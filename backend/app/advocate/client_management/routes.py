import os
import shutil
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from .service import get_case_documents
from .models import Client, Case, Hearing, Activity, Document
from .schemas import ClientCreate, ClientUpdate


router = APIRouter(
    prefix="/clients",
    tags=["Clients"]
)


class ClientResponse(BaseModel):
    id: int
    client_id: str
    full_name: str
    email: str
    phone: str
    alt_phone: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None
    total_cases: Optional[int] = 0
    active_cases: Optional[int] = 0
    status: Optional[str] = "Active"
    court_name: Optional[str] = None

    class Config:
        from_attributes = True

# Document Response Schema
class DocumentResponse(BaseModel):
    id: int
    document_name: str
    document_type: str
    file_path: str

    class Config:
        from_attributes = True


# Get all clients
@router.get(
    "/",
    response_model=list[ClientResponse]
)
def get_clients(
    db: Session = Depends(get_db)
):
    from app.advocate.case_management.models import Case as MgmtCase
    
    # 1. Fetch all cases from case_management_cases to ensure sync
    all_mgmt_cases = db.query(MgmtCase).all()
    
    # Check if any case has a client not yet in clients table
    existing_clients = db.query(Client).all()
    clients_by_cid = {c.client_id: c for c in existing_clients if c.client_id}
    clients_by_name = {c.full_name.strip().lower(): c for c in existing_clients if c.full_name}
    
    current_year = datetime.now().year
    synced_any = False
    
    for case in all_mgmt_cases:
        if not case.client_name or not case.client_name.strip():
            continue
        c_name_key = case.client_name.strip().lower()
        c_cid = (case.client_id or "").strip()
        
        target_client = clients_by_cid.get(c_cid) or clients_by_name.get(c_name_key)
        
        if not target_client:
            # Generate client_id if missing
            new_cid = c_cid if c_cid else f"CLT-{current_year}-{str(len(existing_clients) + 1).zfill(3)}"
            new_client = Client(
                client_id=new_cid,
                full_name=case.client_name.strip(),
                email=case.email_id or "",
                phone=case.contact_number or "",
                alt_phone=case.alt_contact_number or "",
                address=case.client_address or "",
                district=case.client_district or ""
            )
            db.add(new_client)
            existing_clients.append(new_client)
            clients_by_cid[new_cid] = new_client
            clients_by_name[c_name_key] = new_client
            if not case.client_id:
                case.client_id = new_cid
            synced_any = True
        else:
            if not case.client_id and target_client.client_id:
                case.client_id = target_client.client_id
                synced_any = True
            if not target_client.address and case.client_address:
                target_client.address = case.client_address
                synced_any = True
            if not target_client.district and case.client_district:
                target_client.district = case.client_district
                synced_any = True

    if synced_any:
        try:
            db.commit()
            existing_clients = db.query(Client).all()
        except Exception as e:
            db.rollback()
            print(f"Error during client auto-sync: {e}")

    # Build response with case counts
    response_list = []
    for cl in existing_clients:
        cl_cases = [
            c for c in all_mgmt_cases
            if (c.client_id and c.client_id == cl.client_id) or
               (c.client_name and c.client_name.strip().lower() == (cl.full_name or "").strip().lower())
        ]
        
        total_c = len(cl_cases)
        active_c = sum(1 for c in cl_cases if (c.status or "").lower() not in ["disposed", "closed", "won", "lost"])
        status_val = "Active" if active_c > 0 or total_c == 0 else "Inactive"
        court_val = cl_cases[0].court_name if cl_cases and cl_cases[0].court_name else None
        
        response_list.append(ClientResponse(
            id=cl.id,
            client_id=cl.client_id or f"CLT-{current_year}-{str(cl.id).zfill(3)}",
            full_name=cl.full_name or "Unknown Client",
            email=cl.email or "",
            phone=cl.phone or "",
            alt_phone=cl.alt_phone or "",
            address=cl.address or "",
            district=cl.district or "",
            total_cases=total_c,
            active_cases=active_c,
            status=status_val,
            court_name=court_val
        ))

    return response_list


@router.get(
    "/{client_id}",
    response_model=ClientResponse
)
def get_client_by_id(
    client_id: str,
    db: Session = Depends(get_db)
):
    from app.advocate.case_management.models import Case as MgmtCase
    client = db.query(Client).filter(
        (Client.client_id == client_id) | (Client.id == int(client_id) if client_id.isdigit() else False)
    ).first()
    
    if not client:
        # Check by name in Case table
        case = db.query(MgmtCase).filter(
            (MgmtCase.client_id == client_id) | (MgmtCase.client_name == client_id)
        ).first()
        if case:
            return ClientResponse(
                id=case.id,
                client_id=case.client_id or client_id,
                full_name=case.client_name or "",
                email=case.email_id or "",
                phone=case.contact_number or "",
                alt_phone=case.alt_contact_number or "",
                address=case.client_address or "",
                district=case.client_district or "",
                total_cases=1,
                active_cases=1 if (case.status or "").lower() not in ["disposed", "closed"] else 0,
                status=case.status or "Active",
                court_name=case.court_name
            )
        raise HTTPException(status_code=404, detail="Client not found")

    all_mgmt_cases = db.query(MgmtCase).all()
    cl_cases = [
        c for c in all_mgmt_cases
        if (c.client_id and c.client_id == client.client_id) or
           (c.client_name and c.client_name.strip().lower() == (client.full_name or "").strip().lower())
    ]
    total_c = len(cl_cases)
    active_c = sum(1 for c in cl_cases if (c.status or "").lower() not in ["disposed", "closed", "won", "lost"])
    status_val = "Active" if active_c > 0 or total_c == 0 else "Inactive"
    court_val = cl_cases[0].court_name if cl_cases and cl_cases[0].court_name else None

    return ClientResponse(
        id=client.id,
        client_id=client.client_id or str(client.id),
        full_name=client.full_name or "",
        email=client.email or "",
        phone=client.phone or "",
        alt_phone=client.alt_phone or "",
        address=client.address or "",
        district=client.district or "",
        total_cases=total_c,
        active_cases=active_c,
        status=status_val,
        court_name=court_val
    )


# Get next continuous Client ID (CLT-YYYY-XXX)
@router.get("/next-id")
def get_next_client_id(db: Session = Depends(get_db)):
    from app.advocate.case_management.models import Case as MgmtCase
    current_year = datetime.now().year
    clients = db.query(Client).all()
    cases = db.query(MgmtCase).all()

    max_seq = 0
    for c in clients:
        if c.client_id:
            parts = str(c.client_id).split("-")
            try:
                num = int(parts[-1])
                if num > max_seq:
                    max_seq = num
            except ValueError:
                pass
        if c.id and c.id > max_seq:
            max_seq = c.id

    for k in cases:
        if k.client_id:
            parts = str(k.client_id).split("-")
            try:
                num = int(parts[-1])
                if num > max_seq:
                    max_seq = num
            except ValueError:
                pass

    next_seq = str(max_seq + 1).zfill(3)
    return {"client_id": f"CLT-{current_year}-{next_seq}"}


# Get client documents
@router.get(
    "/documents/view",
    response_model=list[DocumentResponse]
)
def view_documents(
    client_id: int,
    advocate_role: str,
    document_type: str = None,
    db: Session = Depends(get_db)
):
    return get_case_documents(
        db=db,
        client_id=client_id,
        advocate_role=advocate_role,
        document_type=document_type
    )


class CaseOut(BaseModel):
    id: int
    case_no: str
    title: str
    client_name: str
    type: str
    court: str
    status: str
    advocate_id: Optional[int]

    class Config:
        from_attributes = True


class HearingOut(BaseModel):
    id: int
    case_no: Optional[str]
    case_title: str
    court: str
    advocate_id: Optional[int]
    advocate_name: Optional[str]
    date: date
    time: str
    status: str

    class Config:
        from_attributes = True


class ActivityOut(BaseModel):
    id: int
    title: str
    timestamp_str: str
    type: Optional[str]
    advocate_id: Optional[int]

    class Config:
        from_attributes = True


class DocumentOut(BaseModel):
    id: int
    filename: str
    case_no: Optional[str]
    advocate_id: Optional[int]

    class Config:
        from_attributes = True


# Get cases
@router.get("/cases", response_model=List[CaseOut])
def get_cases(
    advocate_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Case)
    if advocate_id is not None:
        query = query.filter(Case.advocate_id == advocate_id)
    return query.all()


# Get hearings
@router.get("/hearings", response_model=List[HearingOut])
def get_hearings(
    advocate_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Hearing)
    if advocate_id is not None:
        query = query.filter(Hearing.advocate_id == advocate_id)
    return query.all()


# Get activities
@router.get("/activities", response_model=List[ActivityOut])
def get_activities(
    advocate_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Activity)
    if advocate_id is not None:
        query = query.filter(Activity.advocate_id == advocate_id)
    return query.all()


# Get documents
@router.get("/documents", response_model=List[DocumentOut])
def get_documents(
    advocate_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Document)
    if advocate_id is not None:
        query = query.filter(Document.advocate_id == advocate_id)
    return query.all()


# Create new client
@router.post("/", response_model=ClientResponse)
def create_client(client: ClientCreate, db: Session = Depends(get_db)):
    db_client = db.query(Client).filter(Client.client_id == client.client_id).first()
    if db_client:
        raise HTTPException(status_code=400, detail="Client ID already registered")
    
    new_client = Client(
        client_id=client.client_id,
        full_name=client.full_name,
        email=client.email,
        phone=client.phone
    )
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    return new_client


# Update client details
@router.put("/{client_id}", response_model=ClientResponse)
def update_client(client_id: str, client: ClientUpdate, db: Session = Depends(get_db)):
    updated_any = False
    
    # 1. Update clients table if found
    db_client = db.query(Client).filter(Client.client_id == client_id).first()
    if db_client:
        db_client.full_name = client.full_name
        db_client.email = client.email
        db_client.phone = client.phone
        if hasattr(db_client, 'alt_phone'):
            db_client.alt_phone = client.alt_phone
        if hasattr(db_client, 'address'):
            db_client.address = client.address
        if hasattr(db_client, 'district'):
            db_client.district = client.district
        db.commit()
        db.refresh(db_client)
        updated_any = True

    # 2. Update case_management_cases, invoices, and consultations
    if client.original_name:
        from app.advocate.case_management.models import Case as CaseMgmtCase
        from app.advocate.finance_management.models import Invoice
        from app.advocate.consultations.models import Consultation

        # Update Case Management Cases
        case_update_dict = {
            CaseMgmtCase.client_name: client.full_name,
            CaseMgmtCase.contact_number: client.phone,
            CaseMgmtCase.email_id: client.email
        }
        if client.alt_phone is not None:
            case_update_dict[CaseMgmtCase.alt_contact_number] = client.alt_phone
        if client.address is not None:
            case_update_dict[CaseMgmtCase.client_address] = client.address
        if client.district is not None:
            case_update_dict[CaseMgmtCase.client_district] = client.district

        cases_updated = db.query(CaseMgmtCase).filter(CaseMgmtCase.client_name == client.original_name).update(
            case_update_dict, synchronize_session=False
        )

        # Update Invoices
        db.query(Invoice).filter(Invoice.client_name == client.original_name).update({
            Invoice.client_name: client.full_name
        }, synchronize_session=False)

        # Update Consultations
        db.query(Consultation).filter(Consultation.client_name == client.original_name).update({
            Consultation.client_name: client.full_name
        }, synchronize_session=False)

        db.commit()
        
        if cases_updated > 0:
            updated_any = True

    if not updated_any and not db_client:
        raise HTTPException(status_code=404, detail="Client not found")

    return ClientResponse(
        id=db_client.id if db_client else 1,
        client_id=client_id,
        full_name=client.full_name,
        email=client.email,
        phone=client.phone,
        alt_phone=client.alt_phone,
        address=client.address,
        district=client.district
    )


# Delete client
@router.delete("/{client_id}")
def delete_client(client_id: str, db: Session = Depends(get_db)):
    db_client = db.query(Client).filter(Client.client_id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    db.delete(db_client)
    db.commit()
    return {"message": "Client deleted successfully"}