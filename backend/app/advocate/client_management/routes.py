import os
import shutil
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from .service import get_case_documents
from .models import Client, Case, Hearing, Activity, Document, ClientMeetingNote
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
    return db.query(Client).all()


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


# --- CLIENT MEETING NOTES ENDPOINTS ---

class NoteOut(BaseModel):
    id: int
    client_id: str
    case_no: Optional[str] = None
    subject: str
    description: str
    meeting_date: datetime
    meeting_mode: Optional[str] = "In-Person"
    advocate_name: Optional[str] = None
    proof_document_path: Optional[str] = None
    proof_document_name: Optional[str] = None
    action_items: Optional[str] = None
    action_status: Optional[str] = "Pending"
    tags: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/{client_id}/notes", response_model=List[NoteOut])
def get_client_notes(
    client_id: str,
    db: Session = Depends(get_db)
):
    notes = db.query(ClientMeetingNote).filter(
        ClientMeetingNote.client_id == client_id
    ).order_by(ClientMeetingNote.meeting_date.desc()).all()
    return notes


@router.get("/notes/by-case/{case_no:path}", response_model=List[NoteOut])
def get_notes_by_case(
    case_no: str,
    db: Session = Depends(get_db)
):
    notes = db.query(ClientMeetingNote).filter(
        ClientMeetingNote.case_no == case_no
    ).order_by(ClientMeetingNote.meeting_date.desc()).all()
    return notes


@router.post("/{client_id}/notes", response_model=NoteOut)
def create_client_note(
    client_id: str,
    subject: str = Form(...),
    description: str = Form(...),
    case_no: Optional[str] = Form(None),
    meeting_mode: Optional[str] = Form("In-Person"),
    advocate_name: Optional[str] = Form(None),
    action_items: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    meeting_date: Optional[str] = Form(None),
    proof_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    proof_path = None
    proof_filename = None

    if proof_file and proof_file.filename:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        upload_folder = os.path.join(base_dir, "uploads", "client_notes")
        os.makedirs(upload_folder, exist_ok=True)
        
        safe_filename = f"{int(datetime.utcnow().timestamp())}_{proof_file.filename.replace(' ', '_')}"
        save_file_path = os.path.join(upload_folder, safe_filename)
        
        with open(save_file_path, "wb") as buffer:
            shutil.copyfileobj(proof_file.file, buffer)
            
        proof_path = f"/uploads/client_notes/{safe_filename}"
        proof_filename = proof_file.filename

    parsed_date = datetime.utcnow()
    if meeting_date:
        try:
            parsed_date = datetime.fromisoformat(meeting_date.replace("Z", "+00:00"))
        except Exception:
            try:
                parsed_date = datetime.strptime(meeting_date, "%Y-%m-%d")
            except Exception:
                pass

    new_note = ClientMeetingNote(
        client_id=client_id,
        case_no=case_no,
        subject=subject,
        description=description,
        meeting_date=parsed_date,
        meeting_mode=meeting_mode or "In-Person",
        advocate_name=advocate_name,
        proof_document_path=proof_path,
        proof_document_name=proof_filename,
        action_items=action_items,
        tags=tags
    )
    
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note


@router.delete("/notes/{note_id}")
def delete_client_note(
    note_id: int,
    db: Session = Depends(get_db)
):
    note = db.query(ClientMeetingNote).filter(ClientMeetingNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(note)
    db.commit()
    return {"message": "Meeting note deleted successfully"}


@router.patch("/notes/{note_id}/toggle-action-status")
def toggle_note_action_status(
    note_id: int,
    db: Session = Depends(get_db)
):
    note = db.query(ClientMeetingNote).filter(ClientMeetingNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    current_status = getattr(note, "action_status", "Pending") or "Pending"
    new_status = "Completed" if current_status != "Completed" else "Pending"
    
    setattr(note, "action_status", new_status)
    db.commit()
    db.refresh(note)
    return {"id": note.id, "action_status": note.action_status}


@router.post("/{client_id}/notes/ai-summary")
def generate_ai_notes_summary(
    client_id: str,
    db: Session = Depends(get_db)
):
    notes = db.query(ClientMeetingNote).filter(
        ClientMeetingNote.client_id == client_id
    ).order_by(ClientMeetingNote.meeting_date.asc()).all()

    if not notes:
        return {
            "success": True,
            "executive_summary": "No meeting notes recorded yet for this client.",
            "timeline": [],
            "key_statements": [],
            "pending_action_items": [],
            "recommended_arguments": ["Record client meetings to auto-generate court preparation summaries."]
        }

    # Synthesize AI court prep brief from stored notes
    note_texts = []
    timeline = []
    key_statements = []
    pending_actions = []

    for n in notes:
        m_date_str = n.meeting_date.strftime("%d %b %Y") if n.meeting_date else "N/A"
        note_texts.append(f"[{m_date_str} - {n.meeting_mode}] {n.subject}: {n.description}")
        
        timeline.append({
            "date": m_date_str,
            "mode": n.meeting_mode,
            "subject": n.subject,
            "summary": n.description[:120] + "..." if len(n.description) > 120 else n.description
        })

        act_status = getattr(n, "action_status", "Pending") or "Pending"
        if n.action_items and act_status != "Completed":
            pending_actions.append(f"[{m_date_str}] {n.action_items}")

        # Extract statement highlights
        if "said" in n.description.lower() or "stated" in n.description.lower() or "agreed" in n.description.lower() or "claimed" in n.description.lower():
            key_statements.append(f"[{m_date_str}] {n.subject}: {n.description[:150]}")

    if not key_statements:
        key_statements = [f"[{n.meeting_date.strftime('%d %b %Y')}] {n.subject}" for n in notes[:3]]

    has_any_action_items = any(bool(n.action_items) for n in notes)
    if not pending_actions and not has_any_action_items:
        pending_actions = ["Verify client documentary evidence before court trial", "Confirm witness presence for next hearing"]

    exec_summary = (
        f"Client has {len(notes)} meeting interaction(s) logged. "
        f"Primary issues discussed include: {', '.join([n.subject for n in notes[:3]])}. "
        f"Latest advocate consultation took place on {notes[-1].meeting_date.strftime('%d %b %Y')} ({notes[-1].meeting_mode})."
    )

    recommended_arguments = [
        f"Highlight key facts established during client meeting on {notes[0].meeting_date.strftime('%d %b %Y')}.",
        f"Present document proof ({notes[-1].proof_document_name or 'attached records'}) during cross-examination.",
        "Emphasize consistency across client statements recorded across all consultations."
    ]

    return {
        "success": True,
        "total_notes": len(notes),
        "executive_summary": exec_summary,
        "timeline": timeline,
        "key_statements": key_statements,
        "pending_action_items": pending_actions,
        "recommended_arguments": recommended_arguments
    }


@router.post("/notes/by-case/{case_no:path}", response_model=NoteOut)
def create_note_by_case(
    case_no: str,
    subject: str = Form(...),
    description: str = Form(...),
    client_id: Optional[str] = Form("Unknown"),
    meeting_mode: Optional[str] = Form("In-Person"),
    advocate_name: Optional[str] = Form(None),
    action_items: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    meeting_date: Optional[str] = Form(None),
    proof_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    proof_path = None
    proof_filename = None

    if proof_file and proof_file.filename:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        upload_folder = os.path.join(base_dir, "uploads", "client_notes")
        os.makedirs(upload_folder, exist_ok=True)
        
        safe_filename = f"{int(datetime.utcnow().timestamp())}_{proof_file.filename.replace(' ', '_')}"
        save_file_path = os.path.join(upload_folder, safe_filename)
        
        with open(save_file_path, "wb") as buffer:
            shutil.copyfileobj(proof_file.file, buffer)
            
        proof_path = f"/uploads/client_notes/{safe_filename}"
        proof_filename = proof_file.filename

    parsed_date = datetime.utcnow()
    if meeting_date:
        try:
            parsed_date = datetime.fromisoformat(meeting_date.replace("Z", "+00:00"))
        except Exception:
            try:
                parsed_date = datetime.strptime(meeting_date, "%Y-%m-%d")
            except Exception:
                pass

    new_note = ClientMeetingNote(
        client_id=client_id or "Unknown",
        case_no=case_no,
        subject=subject,
        description=description,
        meeting_date=parsed_date,
        meeting_mode=meeting_mode or "In-Person",
        advocate_name=advocate_name,
        proof_document_path=proof_path,
        proof_document_name=proof_filename,
        action_items=action_items,
        tags=tags
    )
    
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note


@router.post("/notes/ai-summary-by-case/{case_no:path}")
def generate_ai_notes_summary_by_case(
    case_no: str,
    db: Session = Depends(get_db)
):
    notes = db.query(ClientMeetingNote).filter(
        ClientMeetingNote.case_no == case_no
    ).order_by(ClientMeetingNote.meeting_date.asc()).all()

    if not notes:
        return {
            "success": True,
            "executive_summary": f"No meeting notes recorded yet for Case '{case_no}'.",
            "timeline": [],
            "key_statements": [],
            "pending_action_items": [],
            "recommended_arguments": ["Record client consultations for this case to auto-generate AI court summaries."]
        }

    note_texts = []
    timeline = []
    key_statements = []
    pending_actions = []

    for n in notes:
        m_date_str = n.meeting_date.strftime("%d %b %Y") if n.meeting_date else "N/A"
        note_texts.append(f"[{m_date_str} - {n.meeting_mode}] {n.subject}: {n.description}")
        
        timeline.append({
            "date": m_date_str,
            "mode": n.meeting_mode,
            "subject": n.subject,
            "summary": n.description[:120] + "..." if len(n.description) > 120 else n.description
        })

        act_status = getattr(n, "action_status", "Pending") or "Pending"
        if n.action_items and act_status != "Completed":
            pending_actions.append(f"[{m_date_str}] {n.action_items}")

        if "said" in n.description.lower() or "stated" in n.description.lower() or "agreed" in n.description.lower() or "claimed" in n.description.lower():
            key_statements.append(f"[{m_date_str}] {n.subject}: {n.description[:150]}")

    if not key_statements:
        key_statements = [f"[{n.meeting_date.strftime('%d %b %Y')}] {n.subject}" for n in notes[:3]]

    has_any_action_items = any(bool(n.action_items) for n in notes)
    if not pending_actions and not has_any_action_items:
        pending_actions = ["Verify case documentary evidence before court trial", "Confirm witness presence for next hearing"]

    exec_summary = (
        f"Case '{case_no}' has {len(notes)} meeting interaction(s) logged. "
        f"Primary issues discussed include: {', '.join([n.subject for n in notes[:3]])}. "
        f"Latest advocate consultation took place on {notes[-1].meeting_date.strftime('%d %b %Y')} ({notes[-1].meeting_mode})."
    )

    recommended_arguments = [
        f"Highlight key facts established during client meeting on {notes[0].meeting_date.strftime('%d %b %Y')}.",
        f"Present document proof ({notes[-1].proof_document_name or 'attached records'}) during cross-examination.",
        "Emphasize consistency across client statements recorded across all consultations."
    ]

    return {
        "success": True,
        "total_notes": len(notes),
        "executive_summary": exec_summary,
        "timeline": timeline,
        "key_statements": key_statements,
        "pending_action_items": pending_actions,
        "recommended_arguments": recommended_arguments
    }

