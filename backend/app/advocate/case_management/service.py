import os
import json
from datetime import datetime
from dotenv import load_dotenv

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

try:
    import google.generativeai as genai  # type: ignore # pyright: ignore[reportMissingImports]
except Exception:
    genai = None

from .models import Case, AIDocumentHistory
from .schemas import CaseCreate, CaseUpdate


def _sync_client_record(db: Session, client_id: str, full_name: str, email: str, phone: str, alt_phone: str = None, address: str = None, district: str = None) -> str:
    """Ensure a Client record exists in clients table and return the valid client_id."""
    try:
        from app.advocate.client_management.models import Client
        if not full_name or not full_name.strip():
            return client_id or ""

        client = None
        if client_id and client_id.strip():
            client = db.query(Client).filter(Client.client_id == client_id.strip()).first()
        if not client and full_name and full_name.strip():
            client = db.query(Client).filter(func.lower(Client.full_name) == full_name.strip().lower()).first()

        cid = client_id.strip() if client_id and client_id.strip() else None

        if not cid and client and client.client_id:
            cid = client.client_id

        if not cid:
            current_year = datetime.now().year
            total_clients = db.query(Client).count()
            cid = f"CLT-{current_year}-{str(total_clients + 1).zfill(3)}"

        if client:
            if not client.client_id or client.client_id != cid:
                client.client_id = cid
            if full_name:
                client.full_name = full_name
            if email and email != "N/A":
                client.email = email
            if phone and phone != "N/A":
                client.phone = phone
            if alt_phone:
                client.alt_phone = alt_phone
            if address:
                client.address = address
            if district:
                client.district = district
        else:
            new_client = Client(
                client_id=cid,
                full_name=full_name,
                email=email or "",
                phone=phone or "",
                alt_phone=alt_phone or "",
                address=address or "",
                district=district or ""
            )
            db.add(new_client)

        return cid
    except Exception as e:
        print(f"Error syncing client record: {e}")
        return client_id or ""


def create_case(db: Session, data: CaseCreate, current_user=None):
    if data.cnrNumber and data.cnrNumber.strip():
        cnr_val = data.cnrNumber.strip()
        existing = db.query(Case).filter(func.lower(Case.cnr_number) == func.lower(cnr_val)).first()
        if existing:
            raise HTTPException(status_code=400, detail="A case with this CNR Number already exists.")

    # Sync and get verified client_id
    assigned_client_id = _sync_client_record(
        db=db,
        client_id=data.clientId or data.caseId,
        full_name=data.clientName,
        email=data.emailId,
        phone=data.contactNumber,
        alt_phone=data.altContactNumber,
        address=data.clientAddress,
        district=data.clientDistrict
    )

    # ── Confidential Vault: validate and hash password if needed ──
    is_confidential = bool(data.isConfidential)
    pwd_hash = None
    owner_id = None
    if is_confidential:
        role = (getattr(current_user, 'role', '') or '').lower()
        if 'senior' not in role and 'admin' not in role:
            raise HTTPException(status_code=403, detail="Only Senior Advocates can create confidential cases")
        if not data.casePassword or len(data.casePassword.strip()) < 6:
            raise HTTPException(status_code=400, detail="A case password of at least 6 characters is required for confidential cases")
        import bcrypt
        pwd_hash = bcrypt.hashpw(data.casePassword[:72].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        owner_id = getattr(current_user, 'id', None)

    new_case = Case(
        case_id=data.caseId or assigned_client_id,
        client_id=assigned_client_id,
        case_title=data.caseTitle,
        case_no=data.caseNo,
        case_type=data.caseType,
        case_description=data.caseDes,

        client_name=data.clientName,
        contact_number=data.contactNumber,
        alt_contact_number=data.altContactNumber,
        email_id=data.emailId,
        client_role=data.clientRole,
        client_address=data.clientAddress,
        client_district=data.clientDistrict,

        court_name=data.courtName,
        court_type=data.courtType,

        status=data.status,

        selected_advocate=data.selectedAdvocate,
        documents=json.dumps(
            [doc.model_dump() if hasattr(doc, 'model_dump') else doc.dict() for doc in data.documents]
        ) if data.documents else "[]",
        next_hearing_date=data.nextHearingDate,
        cnr_number=data.cnrNumber,

        # Vault
        is_confidential=is_confidential,
        confidential_password_hash=pwd_hash,
        confidential_owner_id=owner_id,
        needs_password_reset=False,
    )

    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    if isinstance(new_case.documents, str):
        db.expunge(new_case)
        try:
            new_case.documents = json.loads(new_case.documents or "[]")
        except Exception:
            new_case.documents = []

    return new_case


def get_all_cases(db: Session, current_user=None):
    """
    Returns cases visible to current_user.
    SECURITY: Confidential cases are ONLY returned to their owner (Layer 1 — ORM filter).
    If current_user is None (unauthenticated), no confidential cases are returned.
    """
    from sqlalchemy import or_

    owner_id = getattr(current_user, 'id', None)
    user_role = (getattr(current_user, 'role', '') or '').lower()

    if owner_id:
        if 'admin' in user_role:
            cases = db.query(Case).order_by(Case.id.desc()).all()
        else:
            cases = (
                db.query(Case)
                .filter(
                    or_(
                        Case.is_confidential == False,
                        Case.confidential_owner_id == owner_id,
                    )
                )
                .order_by(Case.id.desc())
                .all()
            )
    else:
        # No authenticated user — return only non-confidential cases
        cases = db.query(Case).filter(Case.is_confidential == False).order_by(Case.id.desc()).all()

    try:
        from app.advocate.lawfirm_management.models import AssignedCase
        assigned_list = db.query(AssignedCase).all()
        ac_map_id = {ac.case_id: ac for ac in assigned_list if ac.case_id}
        ac_map_no = {ac.case_number: ac for ac in assigned_list if ac.case_number}
    except Exception:
        ac_map_id, ac_map_no = {}, {}

    for case in cases:
        db.expunge(case)
        if isinstance(case.documents, str):
            try:
                case.documents = json.loads(case.documents or "[]")
            except Exception:
                case.documents = []

        ac = ac_map_id.get(case.id) or ac_map_no.get(case.case_no)
        if ac:
            setattr(case, "advocate_name", ac.advocate_name or case.selected_advocate)
            setattr(case, "secondary_advocate_name", ac.secondary_advocate_name)
            if not case.selected_advocate and ac.advocate_name:
                case.selected_advocate = ac.advocate_name
        else:
            setattr(case, "advocate_name", case.selected_advocate)
            setattr(case, "secondary_advocate_name", None)

    return cases


def get_case(db: Session, case_id: int, current_user=None):
    case = db.query(Case).filter(Case.id == case_id).first()

    if not case:
        try:
            from app.advocate.lawfirm_management.models import AssignedCase
            ac_rec = db.query(AssignedCase).filter(AssignedCase.id == case_id).first()
            if ac_rec and ac_rec.case_id:
                case = db.query(Case).filter(Case.id == ac_rec.case_id).first()
            elif ac_rec and ac_rec.case_number:
                case = db.query(Case).filter(Case.case_no == ac_rec.case_number).first()
        except Exception:
            pass

    # SECURITY Layer 2: Return 404 (not 403) for confidential cases owned by others
    # This prevents leaking that the case exists.
    if case and case.is_confidential:
        owner_id = getattr(current_user, 'id', None)
        user_role = (getattr(current_user, 'role', '') or '').lower()
        if case.confidential_owner_id != owner_id and 'admin' not in user_role:
            return None  # Caller raises 404

    if case:
        db.expunge(case)
        if isinstance(case.documents, str):
            try:
                case.documents = json.loads(case.documents or "[]")
            except Exception:
                case.documents = []

        try:
            from app.advocate.lawfirm_management.models import AssignedCase
            ac = db.query(AssignedCase).filter(
                (AssignedCase.case_id == case.id) |
                (AssignedCase.case_id.is_(None) & (AssignedCase.case_number == case.case_no))
            ).first()
            if ac:
                setattr(case, "advocate_name", ac.advocate_name or case.selected_advocate)
                setattr(case, "secondary_advocate_name", ac.secondary_advocate_name)
                if not case.selected_advocate and ac.advocate_name:
                    case.selected_advocate = ac.advocate_name
            else:
                setattr(case, "advocate_name", case.selected_advocate)
                setattr(case, "secondary_advocate_name", None)
        except Exception:
            setattr(case, "advocate_name", case.selected_advocate)
            setattr(case, "secondary_advocate_name", None)

    return case


def update_case(db: Session, case_id: int, data: CaseUpdate):
    case = db.query(Case).filter(Case.id == case_id).first()

    if not case:
        return None

    if data.caseId is not None:
        case.case_id = data.caseId
    if data.clientId is not None:
        case.client_id = data.clientId
    if data.caseTitle is not None:
        case.case_title = data.caseTitle
    if data.caseNo is not None:
        case.case_no = data.caseNo
    if data.caseType is not None:
        case.case_type = data.caseType
    if data.caseDes is not None:
        case.case_description = data.caseDes
    if data.clientName is not None:
        case.client_name = data.clientName
    if data.contactNumber is not None:
        case.contact_number = data.contactNumber
    if data.altContactNumber is not None:
        case.alt_contact_number = data.altContactNumber
    if data.emailId is not None:
        case.email_id = data.emailId
    if data.clientRole is not None:
        case.client_role = data.clientRole
    if data.clientAddress is not None:
        case.client_address = data.clientAddress
    if data.clientDistrict is not None:
        case.client_district = data.clientDistrict
    if data.courtName is not None:
        case.court_name = data.courtName
    if data.courtType is not None:
        case.court_type = data.courtType
    if data.status is not None:
        curr_status_lower = (case.status or "").lower()
        if "disposed" in curr_status_lower:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="Cannot update status for a disposed case.")
        if case.status != data.status:
            from datetime import datetime
            case.status_updated_at = datetime.utcnow()
        case.status = data.status
        try:
            from app.advocate.lawfirm_management.models import AssignedCase
            assigned_cases = db.query(AssignedCase).filter(
                AssignedCase.case_id == case.id
            ).all()
            for ac in assigned_cases:
                if data.status == "Pending":
                    ac.status = "In Progress"
                elif data.status == "Closed":
                    ac.status = "Closed"
                else:
                    ac.status = data.status
        except Exception as e:
            print(f"Error synchronizing case status to assignment: {e}")

    if data.selectedAdvocate is not None:
        case.selected_advocate = data.selectedAdvocate
        try:
            from app.advocate.lawfirm_management.models import AssignedCase
            if not data.selectedAdvocate:
                db.query(AssignedCase).filter(
                    (AssignedCase.case_id == case.id) |
                    (AssignedCase.case_id.is_(None) & (AssignedCase.case_number == case.case_no))
                ).delete(synchronize_session=False)
            else:
                assigned_cases = db.query(AssignedCase).filter(
                    (AssignedCase.case_id == case.id) |
                    (AssignedCase.case_id.is_(None) & (AssignedCase.case_number == case.case_no))
                ).all()
                for ac in assigned_cases:
                    ac.advocate_name = data.selectedAdvocate
                    if ac.case_id is None:
                        ac.case_id = case.id
        except Exception as e:
            print(f"Error synchronizing advocate on case update: {e}")
    if data.documents is not None:
        case.documents = json.dumps(
            [doc.model_dump() if hasattr(doc, 'model_dump') else doc.dict() for doc in data.documents]
        )
        try:
            from app.advocate.lawfirm_management.models import AssignedCase
            assigned_cases = db.query(AssignedCase).filter(
                (AssignedCase.case_id == case.id) |
                (AssignedCase.case_id.is_(None) & (AssignedCase.case_number == case.case_no))
            ).all()
            for ac in assigned_cases:
                if ac.case_id is None:
                    ac.case_id = case.id
                ac.assigned_documents = case.documents
        except Exception as e:
            print(f"Error synchronizing document permissions: {e}")
    if data.nextHearingDate is not None:
        case.next_hearing_date = data.nextHearingDate
    if data.cnrNumber is not None:
        cnr_val = data.cnrNumber.strip() if isinstance(data.cnrNumber, str) else ""
        if cnr_val:
            existing = db.query(Case).filter(func.lower(Case.cnr_number) == func.lower(cnr_val), Case.id != case_id).first()
            if existing:
                raise HTTPException(status_code=400, detail="A case with this CNR Number already exists.")
        case.cnr_number = data.cnrNumber

    case.updated_at = datetime.utcnow()

    # Sync client record in clients table
    if case.client_name:
        _sync_client_record(
            db=db,
            client_id=case.client_id,
            full_name=case.client_name,
            email=case.email_id,
            phone=case.contact_number,
            alt_phone=case.alt_contact_number,
            address=case.client_address,
            district=case.client_district
        )

    if isinstance(case.documents, (list, dict)):
        case.documents = json.dumps(case.documents)

    db.commit()
    db.refresh(case)

    if isinstance(case.documents, str):
        case.documents = json.loads(case.documents or "[]")

    return case


def delete_case(db: Session, case_id: int):
    case = db.query(Case).filter(Case.id == case_id).first()

    if not case:
        return None

    case_no_val = case.case_no

    try:
        from app.advocate.lawfirm_management.models import AssignedCase
        db.query(AssignedCase).filter(
            (AssignedCase.case_id == case_id) | 
            (AssignedCase.case_number == case_no_val)
        ).delete(synchronize_session=False)
    except Exception as e:
        print(f"[delete_case] AssignedCase cleanup warning: {e}")

    try:
        from app.advocate.confidential_vault.models import ConfidentialCaseAuditLog
        db.query(ConfidentialCaseAuditLog).filter(ConfidentialCaseAuditLog.case_id == case_id).delete(synchronize_session=False)
    except Exception as e:
        print(f"[delete_case] ConfidentialCaseAuditLog cleanup warning: {e}")

    try:
        from app.ocr.models import OcrResult
        db.query(OcrResult).filter(OcrResult.case_id == case_id).delete(synchronize_session=False)
    except Exception as e:
        print(f"[delete_case] OcrResult cleanup warning: {e}")

    try:
        from .models import CaseDocumentWorkflow, AIDocumentHistory
        db.query(CaseDocumentWorkflow).filter(CaseDocumentWorkflow.case_id == case_id).delete(synchronize_session=False)
        db.query(AIDocumentHistory).filter(AIDocumentHistory.case_id == case_id).delete(synchronize_session=False)
    except Exception as e:
        print(f"[delete_case] Document/AI history cleanup warning: {e}")

    db.delete(case)
    db.commit()

    return case


def generate_legal_document(db: Session, case_id: int, user_prompt: str):
    case = get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    load_dotenv()
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured in backend")

    genai.configure(api_key=api_key)
    
    context = f"""
    Case Title: {case.case_title}
    Case Number: {case.case_no}
    Case Type: {case.case_type}
    Client Name: {case.client_name}
    Client Role: {case.client_role or 'Petitioner'}
    Client Address: {case.client_address or 'N/A'}
    Client District/State: {case.client_district or 'N/A'}
    Contact Number: {case.contact_number or 'N/A'}
    Alt Contact Number: {case.alt_contact_number or 'N/A'}
    Email ID: {case.email_id or 'N/A'}
    Client ID: {case.client_id or 'N/A'}
    CNR Number: {case.cnr_number or 'N/A'}
    Court: {case.court_name} ({case.court_type})
    Next Hearing Date: {case.next_hearing_date or 'N/A'}
    Assigned Advocate: {case.selected_advocate or 'N/A'}
    Case Description/Facts: {case.case_description}
    Status: {case.status}
    Today's Date: {datetime.now().strftime('%d/%m/%Y')}
    """
    
    full_prompt = f"""
You are an expert legal advocate assistant. Draft the actual legal court document/notice with ALL specific case details filled in directly into the body.

CRITICAL INSTRUCTIONS:
1. ALWAYS fill in ALL actual case details (Client Name, Client Address, Contact Number, Email, Court Name, CNR Number, Case Number, Hearing Date, Advocate Name, Date) directly into the text.
2. DO NOT leave generic bracketed placeholders like [Chamber / Office Address], [Contact Number], [Email Address], [Date], [City, Ernakulam, Kerala - Pin Code], [CNR Number], [Court Name], [Client Name] if the information is present in the context above. Use the real data provided.
3. If specific chamber details are unprovided, use standard High Court chamber formatting with advocate name ({case.selected_advocate or 'Advocate'}).
4. Format the output in clean, professional Markdown suitable for print.
5. Use `**bold text**` for party names, court titles, case numbers, and section headers. Use `==highlighted text==` for key legal grounds, statutory sections, and crucial deadlines.

Context:
{context}

User Request:
{user_prompt}
"""

    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        response = model.generate_content(full_prompt)
        doc_content = response.text

        history_item = AIDocumentHistory(
            case_id=case.id,
            case_no=case.case_no,
            case_title=case.case_title,
            prompt=user_prompt,
            content=doc_content
        )
        db.add(history_item)
        db.commit()
        db.refresh(history_item)

        return {
            "id": history_item.id,
            "document": doc_content,
            "case_id": case.id,
            "case_no": case.case_no,
            "case_title": case.case_title,
            "prompt": user_prompt,
            "created_at": history_item.created_at.isoformat() if history_item.created_at else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


def get_ai_document_histories(db: Session, case_id: int = None):
    query = db.query(AIDocumentHistory)
    if case_id:
        query = query.filter(AIDocumentHistory.case_id == case_id)
    return query.order_by(AIDocumentHistory.created_at.desc()).all()


def update_ai_document_history(db: Session, doc_id: int, content: str = None, prompt: str = None):
    doc = db.query(AIDocumentHistory).filter(AIDocumentHistory.id == doc_id).first()
    if not doc:
        return None
    if content is not None:
        doc.content = content
    if prompt is not None:
        doc.prompt = prompt
    doc.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(doc)
    return doc


def delete_ai_document_history(db: Session, doc_id: int):
    doc = db.query(AIDocumentHistory).filter(AIDocumentHistory.id == doc_id).first()
    if not doc:
        return False
    db.delete(doc)
    db.commit()
    return True


def ask_ai_assistant(db: Session, user_query: str, user_role: str = None, advocate_name: str = None, client_name: str = None):
    load_dotenv()
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured in backend")
        
    genai.configure(api_key=api_key)
    
    cases = get_all_cases(db)
    if user_role == "Junior Advocate" and advocate_name:
        cases = [c for c in cases if c.selected_advocate == advocate_name]
    
    if client_name:
        client_name_lower = client_name.strip().lower()
        cases = [c for c in cases if c.client_name and (client_name_lower in c.client_name.strip().lower() or c.client_name.strip().lower() in client_name_lower)]
    
    context_lines = []
    for case in cases:
        case_info = f"Case Title: {case.case_title} | Case No: {case.case_no} | Status: {case.status} | Client: {case.client_name} (Phone: {case.contact_number}, Email: {case.email_id}) | Court: {case.court_name} | Next Hearing: {case.next_hearing_date or 'Not scheduled'}"
        
        doc_info = "Documents: None"
        if case.documents:
            try:
                docs = case.documents if isinstance(case.documents, list) else json.loads(case.documents)
                if docs:
                    doc_names = [f"{d.get('file', 'Unknown')} ({d.get('documentType', 'Unknown type')})" for d in docs]
                    doc_info = "Documents: " + ", ".join(doc_names)
            except Exception:
                pass
                
        context_lines.append(f"- {case_info} | {doc_info}")
        
    context_block = "\n".join(context_lines)

    invoices_context = ""
    consultations_context = ""
    
    if client_name:
        try:
            from app.advocate.finance_management.models import Invoice
            invoices = db.query(Invoice).all()
            matched_invoices = [inv for inv in invoices if inv.client_name and (client_name_lower in inv.client_name.strip().lower() or inv.client_name.strip().lower() in client_name_lower)]
            if matched_invoices:
                inv_lines = []
                for inv in matched_invoices:
                    inv_lines.append(f"- Invoice ID: {inv.id} | Amount: ₹{inv.grand_total} | Status: {inv.status} | Date: {inv.created_at.strftime('%Y-%m-%d') if inv.created_at else 'N/A'} | Method: {inv.payment_method or 'N/A'}")
                invoices_context = "\n".join(inv_lines)
            else:
                invoices_context = "No invoices found."
        except Exception as e:
            invoices_context = f"Error fetching invoices: {str(e)}"
            
        try:
            from app.advocate.consultations.models import Consultation
            consultations = db.query(Consultation).all()
            matched_consultations = [con for con in consultations if con.client_name and (client_name_lower in con.client_name.strip().lower() or con.client_name.strip().lower() in client_name_lower)]
            if matched_consultations:
                cons_lines = []
                for con in matched_consultations:
                    cons_lines.append(f"- Consultation ID: {con.id} | Issue: {con.issue or 'N/A'} | Status: {con.status} | Date: {con.date} {con.time} | Type: {con.type} | Summary: {con.summary or 'No summary'}")
                consultations_context = "\n".join(cons_lines)
            else:
                consultations_context = "No consultations found."
        except Exception as e:
            consultations_context = f"Error fetching consultations: {str(e)}"

    advocates_context = ""
    try:
        from app.advocate.lawfirm_management.models import Advocate, AssignedCase
        advocates = db.query(Advocate).all()
        assigned_cases_list = db.query(AssignedCase).all()
        adv_lines = []
        for a in advocates:
            name = a.advocate_name or ""
            a_name = name.strip().lower()
            handling = [ac.case_number or ac.case_name or str(ac.case_id) for ac in assigned_cases_list if ac.advocate_name and ac.advocate_name.strip().lower() == a_name]
            primary_handling = [c.case_no or c.case_title for c in cases if c.selected_advocate and c.selected_advocate.strip().lower() == a_name]
            all_handling = list(set(handling + primary_handling))
            cases_str = ", ".join(all_handling) if all_handling else "None"
            adv_lines.append(f"- Advocate: {a.advocate_name} ({a.role or 'Advocate'}) | Contact: {a.phone_number or 'N/A'}, Email: {a.email_address or 'N/A'} | Handling Cases: {cases_str}")
        advocates_context = "\n".join(adv_lines) if adv_lines else "No advocate records."
    except Exception as e:
        advocates_context = f"Error: {str(e)}"

    leave_context = ""
    try:
        from app.advocate.leave_management.models import LeaveRequest
        leaves = db.query(LeaveRequest).all()
        leave_lines = []
        for l in leaves:
            leave_lines.append(f"- Staff/Advocate: {l.applicant_name} ({l.applicant_role}) | Leave Type: {l.leave_type} | Dates: {l.from_date} to {l.to_date} ({l.total_days} days) | Status: {l.status} | Reason: {l.description or 'N/A'}")
        leave_context = "\n".join(leave_lines) if leave_lines else "No leave records."
    except Exception as e:
        leave_context = f"Error: {str(e)}"

    client_info_block = ""
    if client_name:
        client_info_block = f"""
Context (Client Specific Invoices & Billing):
{invoices_context}

Context (Client Specific Consultations & Discussions):
{consultations_context}
"""

    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    full_prompt = f"""
You are an expert AI Legal Assistant for an advocate. You have access to the following context about the law firm's cases, advocates, staff leave records, clients, and documents.
Answer the user's question accurately based ONLY on this context. 

Current Date and Time: {current_time}
Scheduler Logic: Automatic reminders are sent to clients and advocates exactly 5, 2, and 1 days before the Next Hearing Date. Use the current date to deduce if reminders have been sent.

Drafting: If the user asks you to draft a legal document (e.g., a notice), write out the full draft using professional legal formatting in Markdown, filling in details from the context.

Action Taking (Function Calling): 
If the user explicitly asks you to UPDATE the status of a case, you MUST return ONLY a JSON object (without any markdown formatting or extra text) in the following exact format:
{{
  "action": "update_status",
  "case_no": "insert_case_no_here",
  "new_status": "insert_new_status_here (Active, Pending, or Closed)",
  "reply": "I have successfully updated the status of the case to [status]."
}}
DO NOT return JSON unless an action is requested. If no action is requested, answer normally in markdown.

Context (Cases):
{context_block}

Context (Advocates & Assigned Cases):
{advocates_context}

Context (Staff & Advocate Leave Records):
{leave_context}
{client_info_block}

User Question:
{user_query}
"""

    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        response = model.generate_content(full_prompt)
        response_text = response.text.strip()
        
        if response_text.startswith("{") and response_text.endswith("}") and '"action"' in response_text:
            try:
                action_data = json.loads(response_text)
                if action_data.get("action") == "update_status":
                    case_no = action_data.get("case_no")
                    new_status = action_data.get("new_status")
                    
                    case_to_update = db.query(Case).filter(Case.case_no == case_no).first()
                    if case_to_update:
                        case_to_update.status = new_status
                        db.commit()
                        return {"response": action_data.get("reply", "Status updated successfully.")}
                    else:
                        return {"response": f"Failed to update: Could not find case with number {case_no}."}
            except json.JSONDecodeError:
                pass
                
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Assistant failed: {str(e)}")


def get_case_timeline(db: Session, case_id: int, current_user=None):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        return []

    # SECURITY Check for confidential cases
    if case.is_confidential:
        owner_id = getattr(current_user, 'id', None)
        user_role = (getattr(current_user, 'role', '') or '').lower()
        if case.confidential_owner_id != owner_id and 'admin' not in user_role:
            return []

    events = []

    # 1. Case Created / Case Start Event (Earliest / Top event)
    created_dt = case.created_at or datetime.utcnow()
    created_date_str = created_dt.strftime("%Y-%m-%d")
    created_time_str = created_dt.strftime("%I:%M %p")

    events.append({
        "id": f"evt-start-{case.id}",
        "case_id": case.id,
        "type": "case_created",
        "category": "Case",
        "title": "Case Created & Started",
        "description": f"Initial onboarding and case setup for '{case.case_title}' (Case #{case.case_no}) in {case.court_name or 'Court'}.",
        "date": created_date_str,
        "time": created_time_str,
        "timestamp": created_dt.isoformat(),
        "actor": case.selected_advocate or "Senior Advocate / Law Firm",
        "status": case.status or "Active",
        "metadata": {
            "case_no": case.case_no,
            "cnr_number": case.cnr_number or "N/A",
            "client_name": case.client_name,
            "contact_number": case.contact_number or "N/A",
            "email_id": case.email_id or "N/A",
            "advocate_assigned": case.selected_advocate or "Unassigned",
            "case_type": case.case_type or "General",
            "court_name": case.court_name or "N/A",
            "court_type": case.court_type or "N/A",
            "initial_description": case.case_description or "Case registered in Legal Tech system."
        }
    })

    # 2. Advocate Assignment / Lawfirm Assignments & Updates
    try:
        from app.advocate.lawfirm_management.models import AssignedCase
        assignments = db.query(AssignedCase).filter(
            (AssignedCase.case_id == case.id) |
            (AssignedCase.case_id.is_(None) & (AssignedCase.case_number == case.case_no))
        ).all()
        for idx, ac in enumerate(assignments):
            ac_dt = getattr(ac, 'created_at', None) or created_dt
            events.append({
                "id": f"evt-assign-{ac.id}",
                "case_id": case.id,
                "type": "advocate_assigned",
                "category": "Approval",
                "title": "Advocate Assigned to Case",
                "description": f"Advocate '{ac.advocate_name}' assigned to lead Case #{case.case_no}.",
                "date": ac_dt.strftime("%Y-%m-%d"),
                "time": ac_dt.strftime("%I:%M %p"),
                "timestamp": ac_dt.isoformat(),
                "actor": "Law Firm Management",
                "status": ac.status or "Active",
                "metadata": {
                    "lead_advocate": ac.advocate_name,
                    "secondary_advocate": ac.secondary_advocate_name or "None",
                    "practice_court": ac.practice_court or case.court_name,
                    "assignment_notes": ac.assignment_notes or "Assigned via Law Firm Management."
                }
            })
    except Exception:
        pass

    # 3. Client & Advocate Information Updates
    if case.updated_at and case.updated_at != case.created_at:
        events.append({
            "id": f"evt-info-update-{case.id}",
            "case_id": case.id,
            "type": "case_info_updated",
            "category": "Status Update",
            "title": "Case Information Updated",
            "description": f"Client details, contact info ({case.contact_number}), or case specifications were updated.",
            "date": case.updated_at.strftime("%Y-%m-%d"),
            "time": case.updated_at.strftime("%I:%M %p"),
            "timestamp": case.updated_at.isoformat(),
            "actor": case.selected_advocate or "System Admin",
            "status": "Updated",
            "metadata": {
                "client_name": case.client_name,
                "contact_number": case.contact_number,
                "email_id": case.email_id,
                "client_address": case.client_address or "N/A",
                "client_district": case.client_district or "N/A",
                "court_name": case.court_name
            }
        })

    # 4. Documents Uploaded
    raw_docs = []
    if isinstance(case.documents, str):
        try:
            raw_docs = json.loads(case.documents or "[]")
        except Exception:
            raw_docs = []
    elif isinstance(case.documents, list):
        raw_docs = case.documents

    for idx, doc in enumerate(raw_docs):
        if not isinstance(doc, dict):
            continue

        raw_file = doc.get("file") or doc.get("filename") or doc.get("file_name") or doc.get("name")
        raw_url = doc.get("url") or doc.get("file_url") or doc.get("fileUrl") or doc.get("path") or ""

        doc_type = doc.get("documentType") or doc.get("document_type") or doc.get("type") or "Uploaded Document"
        doc_adv = doc.get("advocate") or doc.get("uploaded_by") or doc.get("uploadedBy") or case.selected_advocate or "Advocate"
        doc_date = doc.get("date") or doc.get("uploadedAt") or doc.get("uploaded_at") or created_date_str

        # If raw_file is a string "None" or None, treat as empty
        if raw_file == "None":
            raw_file = None

        doc_url = str(raw_url).strip() if raw_url else ""
        doc_file = str(raw_file).strip() if raw_file else ""

        if not doc_file and doc_url:
            doc_file = doc_url.split("/")[-1].split("?")[0]

        if not doc_file:
            doc_file = f"{doc_type}.pdf" if doc_type and doc_type != "Uploaded Document" else f"Document_{idx+1}"

        if not doc_url and doc_file and (doc_file.startswith("http://") or doc_file.startswith("https://") or doc_file.startswith("data:")):
            doc_url = doc_file

        events.append({
            "id": f"evt-doc-{idx}",
            "case_id": case.id,
            "type": "document_uploaded",
            "category": "Document",
            "title": f"Document Uploaded: {doc_type}",
            "description": f"File '{doc_file}' was added to case repository.",
            "date": doc_date,
            "time": "10:00 AM",
            "timestamp": f"{doc_date}T10:00:00",
            "actor": doc_adv,
            "status": "Verified" if doc.get("password") else "Uploaded",
            "metadata": {
                "file_name": doc_file,
                "document_type": doc_type,
                "uploaded_by": doc_adv,
                "url": doc_url,
                "has_password": bool(doc.get("password"))
            }
        })

    # 5. Advocate Notes
    try:
        from .models import CaseNote
        notes = db.query(CaseNote).filter(CaseNote.case_id == case.id).all()
        for note in notes:
            n_dt = note.created_at or created_dt
            events.append({
                "id": f"evt-note-{note.id}",
                "case_id": case.id,
                "type": "case_note_added",
                "category": "Note",
                "title": f"Case Note: {note.category}",
                "description": note.text,
                "date": n_dt.strftime("%Y-%m-%d"),
                "time": n_dt.strftime("%I:%M %p"),
                "timestamp": n_dt.isoformat(),
                "actor": note.author or "Advocate",
                "status": note.category,
                "metadata": {
                    "note_id": note.id,
                    "category": note.category,
                    "text": note.text,
                    "author": note.author or "Advocate"
                }
            })
    except Exception:
        pass

    # 6. AI Generated Documents
    try:
        from .models import AIDocumentHistory
        ai_docs = db.query(AIDocumentHistory).filter(AIDocumentHistory.case_id == case.id).all()
        for ai_doc in ai_docs:
            a_dt = ai_doc.created_at or created_dt
            events.append({
                "id": f"evt-aidoc-{ai_doc.id}",
                "case_id": case.id,
                "type": "ai_document_generated",
                "category": "Document",
                "title": "AI Legal Document Generated",
                "description": f"AI Legal Assistant generated document draft based on prompt: '{ai_doc.prompt[:60]}...'",
                "date": a_dt.strftime("%Y-%m-%d"),
                "time": a_dt.strftime("%I:%M %p"),
                "timestamp": a_dt.isoformat(),
                "actor": "AI Legal Assistant",
                "status": "Generated",
                "metadata": {
                    "prompt": ai_doc.prompt,
                    "content": ai_doc.content,
                    "doc_id": ai_doc.id
                }
            })
    except Exception:
        pass

    # 7. Consultations / Discussions & Meeting Notes (Client & Advocate)
    try:
        from app.advocate.consultations.models import Consultation, MeetingNote
        from sqlalchemy import or_
        consults = db.query(Consultation).filter(
            (Consultation.case_id == case.id) |
            (func.lower(Consultation.client_name) == func.lower(case.client_name)) |
            (Consultation.issue.ilike(f"%{case.case_no}%"))
        ).all()
        for c in consults:
            c_dt = getattr(c, 'created_at', None) or created_dt
            events.append({
                "id": f"evt-consult-req-{c.id}",
                "case_id": case.id,
                "type": "discussion_request_sent",
                "category": "Discussion",
                "title": "Case Discussion Request Sent",
                "description": f"Client '{c.client_name}' sent a {c.type} consultation request regarding '{c.issue or 'Case Strategy'}'.",
                "date": c_dt.strftime("%Y-%m-%d"),
                "time": c_dt.strftime("%I:%M %p"),
                "timestamp": c_dt.isoformat(),
                "actor": c.client_name,
                "status": "Pending Request",
                "metadata": {
                    "requested_by": c.client_name,
                    "recipient": case.selected_advocate or "Senior Advocate",
                    "consultation_type": c.type,
                    "issue": c.issue or "General Case Strategy",
                    "requested_date": str(c.date),
                    "requested_time": c.time
                }
            })

            if c.status in ["Approved", "Scheduled", "Completed"]:
                events.append({
                    "id": f"evt-consult-app-{c.id}",
                    "case_id": case.id,
                    "type": "discussion_approved",
                    "category": "Approval",
                    "title": "Discussion Request Approved",
                    "description": f"Discussion request approved by Advocate. Session scheduled for {c.date} at {c.time} ({c.type}).",
                    "date": str(c.date),
                    "time": c.time,
                    "timestamp": f"{c.date}T{c.time}",
                    "actor": case.selected_advocate or "Senior Advocate",
                    "status": c.status,
                    "metadata": {
                        "approved_by": case.selected_advocate or "Senior Advocate",
                        "scheduled_date": str(c.date),
                        "scheduled_time": c.time,
                        "meeting_link": c.meeting_link or "Chambers / In-Person",
                        "fee": c.fee or "Included",
                        "summary": c.summary or "Discussion agenda & session confirmed."
                    }
                })

        # Fetch Meeting Notes linked to case or client
        is_client = (current_user and getattr(current_user, 'role', '').lower() == 'client')
        m_notes_query = db.query(MeetingNote).filter(
            or_(
                MeetingNote.case_id == case.id,
                func.lower(MeetingNote.client_name) == func.lower(case.client_name)
            )
        )
        if is_client:
            m_notes_query = m_notes_query.filter(MeetingNote.is_confidential == False)
        
        notes_list = m_notes_query.all()
        for note in notes_list:
            n_date_str = str(note.meeting_date)
            n_time_str = note.meeting_time or "10:00 AM"
            events.append({
                "id": f"evt-meeting-note-{note.id}",
                "case_id": case.id,
                "type": "consultation_meeting",
                "category": "Meeting Notes",
                "title": (note.title or "Meeting Notes").replace("Consultation Note", "Meeting Notes"),
                "description": note.summary or f"Recorded meeting note for discussion with {note.client_name or case.client_name}.",
                "date": n_date_str,
                "time": n_time_str,
                "timestamp": f"{n_date_str}T{n_time_str}",
                "actor": case.selected_advocate or "Advocate",
                "status": "Notes Recorded",
                "metadata": {
                    "note_id": note.id,
                    "consultation_id": note.consultation_id,
                    "client_name": note.client_name or case.client_name,
                    "case_title": note.case_title or case.case_title,
                    "case_no": note.case_no or case.case_no,
                    "meeting_type": note.meeting_type or "Video Call",
                    "summary": note.summary,
                    "key_topics": note.key_topics,
                    "action_items": note.action_items or [],
                    "legal_advice": note.legal_advice,
                    "internal_notes": note.internal_notes if not is_client else None,
                    "has_meeting_notes": True
                }
            })

    except Exception as e:
        print("Error fetching consultation meeting notes for timeline:", e)


    # 8. eCourts Live Sync & Hearings
    if case.next_hearing_date:
        events.append({
            "id": f"evt-hearing-{case.id}",
            "case_id": case.id,
            "type": "hearing_scheduled",
            "category": "Hearing",
            "title": "Hearing Scheduled (eCourts)",
            "description": f"Next court appearance scheduled at {case.court_name or 'District Court'} for {case.next_hearing_date}.",
            "date": case.next_hearing_date,
            "time": "10:30 AM",
            "timestamp": f"{case.next_hearing_date}T10:30:00",
            "actor": case.court_name or "eCourts Portal",
            "status": "Scheduled",
            "metadata": {
                "court_name": case.court_name,
                "cnr_number": case.cnr_number,
                "hearing_date": case.next_hearing_date,
                "synced_with_ecourts": True
            }
        })

    # Sort events chronologically by timestamp ascending (earliest to latest)
    events.sort(key=lambda x: str(x.get("timestamp", "")))

    # Ensure the first event is explicitly named "Case Started"
    if events:
        events[0]["title"] = "Case Started"

    # Assign sequential 1-based event numbers: 1 = Case Started (bottom), N = Latest Activity (top)
    for idx, evt in enumerate(events, start=1):
        evt["event_number"] = idx

    # Mark the latest event
    if events:
        events[-1]["is_latest"] = True

    # Reverse events so N (latest) is at the top (index 0) and 1 (Case Started) is at the bottom
    events.reverse()

    return events


def get_full_case_ai_summary(db: Session, case_id: int, current_user=None) -> dict:
    """
    Generates a 100% dynamic AI Master Case Progress & Summary report for a specific case.
    Analyzes the entire journey:
    - Core Case Details (Title, No, CNR, Court, Category, Client, Filing Date, Next Hearing Date, Status)
    - Assigned Advocate(s) & Team Members
    - Full Chronological Timeline Events
    - Case Notes, Discussions & Hearing Logs
    - Document Workflows & Files
    """
    import os
    import json
    import re
    try:
        import google.generativeai as genai
    except Exception:
        genai = None

    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Security check for confidential vault cases
    if case.is_confidential:
        owner_id = getattr(current_user, 'id', None)
        user_role = (getattr(current_user, 'role', '') or '').lower()
        if case.confidential_owner_id != owner_id and 'admin' not in user_role:
            raise HTTPException(status_code=403, detail="Confidential case access restricted")

    # 1. Fetch Timeline Events
    timeline_events = get_case_timeline(db, case_id, current_user)

    # 2. Fetch Assigned Advocates / Team Members
    assigned_members = []
    try:
        from app.advocate.lawfirm_management.models import AssignedCase
        ac_list = db.query(AssignedCase).filter(
            (AssignedCase.case_id == case.id) |
            (AssignedCase.case_id.is_(None) & (AssignedCase.case_number == case.case_no))
        ).all()
        for ac in ac_list:
            assigned_members.append({
                "advocate_name": ac.assigned_advocate or ac.advocate_email or "Assigned Advocate",
                "assigned_role": ac.practice_area or "Lead Counsel",
                "assigned_date": str(ac.assigned_date.date()) if ac.assigned_date else "N/A",
                "assignment_notes": ac.assignment_notes or "Active case counsel"
            })
    except Exception as e:
        print("[CaseSummary] Error fetching assigned advocates:", e)

    if not assigned_members and case.selected_advocate:
        assigned_members.append({
            "advocate_name": case.selected_advocate,
            "assigned_role": "Primary Advocate",
            "assigned_date": str(case.created_at.date()) if case.created_at else "N/A",
            "assignment_notes": "Primary assigned legal counsel"
        })

    # 3. Fetch Case Notes
    notes_list = []
    try:
        notes_db = db.query(CaseNote).filter(CaseNote.case_id == case_id).order_by(CaseNote.created_at.desc()).all()
        for n in notes_db:
            notes_list.append({
                "author": n.author or "Advocate",
                "category": n.category or "General Note",
                "text": n.text,
                "date": str(n.created_at.strftime("%Y-%m-%d %H:%M")) if n.created_at else "N/A"
            })
    except Exception as e:
        print("[CaseSummary] Error fetching notes:", e)

    # 4. Fetch Document Workflows
    doc_workflows = []
    try:
        wfs = db.query(CaseDocumentWorkflow).filter(CaseDocumentWorkflow.case_id == case_id).all()
        for w in wfs:
            doc_workflows.append({
                "title": w.title,
                "document_type": w.document_type,
                "status": w.status,
                "created_at": str(w.created_at.date()) if w.created_at else "N/A"
            })
    except Exception as e:
        print("[CaseSummary] Error fetching document workflows:", e)

    # 5. Fetch Payment & Invoice Details
    payment_info = {
        "total_amount": 0.0,
        "paid_amount": 0.0,
        "pending_amount": 0.0,
        "payment_status": "No Invoices",
        "invoices": []
    }
    try:
        from app.advocate.finance_management.models import Invoice
        invoices = db.query(Invoice).filter(
            (Invoice.case_id == case.id) |
            (Invoice.case_number == case.case_no) |
            (Invoice.client_name == case.client_name)
        ).all()
        if invoices:
            total = sum(inv.amount or 0.0 for inv in invoices)
            paid = sum(inv.amount or 0.0 for inv in invoices if (inv.status or '').lower() in ['paid', 'completed'])
            pending = total - paid

            payment_info["total_amount"] = round(total, 2)
            payment_info["paid_amount"] = round(paid, 2)
            payment_info["pending_amount"] = round(pending, 2)
            payment_info["payment_status"] = "Paid" if pending <= 0 else ("Partially Paid" if paid > 0 else "Pending")

            for inv in invoices:
                payment_info["invoices"].append({
                    "id": inv.id,
                    "invoice_number": inv.invoice_number or f"INV-{inv.id}",
                    "amount": inv.amount or 0.0,
                    "status": inv.status or "Pending",
                    "issue_date": str(inv.issue_date.date()) if inv.issue_date else "N/A",
                    "due_date": str(inv.due_date.date()) if inv.due_date else "N/A",
                    "notes": inv.notes or "Legal Fee Invoice"
                })
    except Exception as e:
        print("[CaseSummary] Error fetching payment info:", e)

    # 6. Extract Last Update & Most Recent Proceeding
    latest_evt = timeline_events[0] if timeline_events else None
    last_update_info = {
        "title": latest_evt.get("title", "No updates recorded") if latest_evt else "Case Onboarded",
        "date": latest_evt.get("date", str(case.created_at.date())) if latest_evt else str(case.created_at.date()),
        "time": latest_evt.get("time", "10:00 AM") if latest_evt else "10:00 AM",
        "actor": latest_evt.get("actor", "System Advocate") if latest_evt else "System Advocate",
        "description": latest_evt.get("description", "Case registered in Legal Tech platform.") if latest_evt else "Initial case registration.",
        "status": case.status or "Active",
        "updated_at": str(case.status_updated_at.strftime("%Y-%m-%d %H:%M")) if case.status_updated_at else str(case.updated_at.strftime("%Y-%m-%d %H:%M")) if case.updated_at else "N/A"
    }

    # Core Case Metadata Dictionary
    case_info = {
        "case_id": case.id,
        "case_title": case.case_title or f"Case #{case.id}",
        "case_no": case.case_no or "N/A",
        "cnr_number": case.cnr_number or "N/A",
        "case_type": case.case_type or "General Civil / Criminal",
        "court_name": case.court_name or "District & Sessions Court",
        "court_type": case.court_type or "High Court / District Court",
        "client_name": case.client_name or "Client",
        "contact_number": case.contact_number or "N/A",
        "email_id": case.email_id or "N/A",
        "client_role": case.client_role or "Petitioner / Plaintiff",
        "client_address": case.client_address or "N/A",
        "client_district": case.client_district or "N/A",
        "status": case.status or "Active",
        "next_hearing_date": case.next_hearing_date or "To be scheduled",
        "filing_date": str(case.created_at.date()) if case.created_at else "N/A",
        "case_description": case.case_description or "Case registered in Legal Tech system."
    }

    # Construct Fallback Summary
    adv_names = ", ".join([m["advocate_name"] for m in assigned_members]) if assigned_members else (case.selected_advocate or "Unassigned Advocate")

    fallback_analysis = {
        "masterSummary": f"Comprehensive AI Case Progress Analysis for '{case_info['case_title']}' (Case No: {case_info['case_no']}, CNR: {case_info['cnr_number']}). The matter is pending before {case_info['court_name']} ({case_info['court_type']}). It was registered on {case_info['filing_date']} for client {case_info['client_name']} ({case_info['client_role']}). Current status: '{case_info['status']}'. Legal representation is led by {adv_names}. Most Recent Proceeding on {last_update_info['date']}: {last_update_info['title']} ({last_update_info['description']}). Next hearing date is scheduled for {case_info['next_hearing_date']}.",
        "assignedAdvocateDetails": f"Primary Legal Representation: {adv_names}. Case Responsibility: Lead Trial Counsel / Senior Advocate. Assigned on {case_info['filing_date']}. Team notes: Active representation with client coordination.",
        "nextHearingPreparation": f"Next Hearing Date: {case_info['next_hearing_date']}. Forum: {case_info['court_name']}. Strategic Action: Audit filing of latest affidavits, review court cause list, coordinate with client {case_info['client_name']}, and prepare trial brief.",
        "chronologicalMilestones": [
            f"Case Filing & Registration ({case_info['filing_date']}): Matter registered before {case_info['court_name']} for {case_info['client_name']}.",
            f"Advocate Representation ({case_info['filing_date']}): Lead counsel {adv_names} assigned to manage court proceedings.",
            f"Latest Proceeding ({last_update_info['date']}): {last_update_info['title']} - {last_update_info['description']}",
            f"Active Proceedings & Timeline ({case_info['status']}): {len(timeline_events)} timeline event(s) logged. Next hearing on {case_info['next_hearing_date']}."
        ],
        "latestUpdatesSummary": f"Most Recent Proceeding on {last_update_info['date']} at {last_update_info['time']}: {last_update_info['title']}. Description: {last_update_info['description']}. Conducted by: {last_update_info['actor']}.",
        "discussionHighlights": f"Case Discussions & Notes ({len(notes_list)} logged): {'; '.join([n['text'] for n in notes_list[:3]]) if notes_list else 'No internal discussion notes logged yet.'}",
        "actionPlan": [
            f"Review statutory compliance and case documents before {case_info['next_hearing_date']}",
            f"Coordinate with assigned counsel ({adv_names}) and client ({case_info['client_name']})",
            "Ensure all daily hearing logs, orders, and notices are updated in eCourts portal tracker"
        ]
    }

    # 7. Generate Dynamic AI Analysis using Gemini AI (if available)
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if api_key and genai:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.0-flash")

            events_text = "\n".join([f"- [{e.get('date', 'N/A')} {e.get('time', '')}] {e.get('title', 'Event')}: {e.get('description', '')}" for e in timeline_events[:15]])
            notes_text = "\n".join([f"- [{n['date']}] {n['author']} ({n['category']}): {n['text']}" for n in notes_list[:10]])
            docs_text = "\n".join([f"- [{d['created_at']}] {d['title']} ({d['document_type']}) - Status: {d['status']}" for d in doc_workflows[:10]])

            prompt = f"""You are a Supreme Court Senior Advocate reviewing the complete case file, discussions, and payment status for a specific case.

CASE CORE DATA:
- Case Title: {case_info['case_title']}
- Case Number: {case_info['case_no']}
- CNR Number: {case_info['cnr_number']}
- Case Category: {case_info['case_type']}
- Court: {case_info['court_name']} ({case_info['court_type']})
- Client: {case_info['client_name']} ({case_info['client_role']}) | Phone: {case_info['contact_number']} | Email: {case_info['email_id']}
- Assigned Advocates: {adv_names}
- Filing Date: {case_info['filing_date']}
- Next Hearing Date: {case_info['next_hearing_date']}
- Status: {case_info['status']}
- Description: {case_info['case_description']}
- Last Update Event: [{last_update_info['date']} {last_update_info['time']}] {last_update_info['title']} - {last_update_info['description']} (By: {last_update_info['actor']})
- Payment / Financial Summary: Total: ₹{payment_info['total_amount']} | Paid: ₹{payment_info['paid_amount']} | Pending: ₹{payment_info['pending_amount']} | Status: {payment_info['payment_status']}

CHRONOLOGICAL TIMELINE EVENTS:
{events_text if events_text.strip() else 'No timeline events logged yet.'}

ADVOCATE NOTES & DISCUSSIONS:
{notes_text if notes_text.strip() else 'No internal advocate notes logged yet.'}

DOCUMENT WORKFLOWS & FILINGS:
{docs_text if docs_text.strip() else 'No document workflows logged yet.'}

Perform a thorough, comprehensive analysis of every detail of this case's journey from filing to present day and return ONLY a valid JSON object:
{{
  "masterSummary": "<Comprehensive 3-4 sentence analysis synthesizing case standing, filing history, latest update, discussions, and payment standing>",
  "assignedAdvocateDetails": "<2-3 sentence analysis detailing assigned advocates, team roles, assignment date, and trial representation duties>",
  "nextHearingPreparation": "<2-3 sentence strategic roadmap detailing exact preparation needed before the next hearing date>",
  "chronologicalMilestones": ["<Key Milestone 1 with date>", "<Key Milestone 2 with date>", "<Key Milestone 3 with date>"],
  "latestUpdatesSummary": "<2-3 sentence detailed summary of the most recent update, hearing outcome, or status change>",
  "discussionHighlights": "<2-3 sentence summary detailing advocate discussions, notes, and team collaboration>",
  "actionPlan": ["<action item 1>", "<action item 2>", "<action item 3>"]
}}
"""
            response = model.generate_content(prompt)
            raw = response.text.strip()
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)
            ai_json = json.loads(raw)
            if ai_json:
                fallback_analysis.update(ai_json)
        except Exception as err:
            print("[CaseSummary] Gemini AI generation note:", err)

    return {
        "case": case_info,
        "assigned_members": assigned_members,
        "timeline_events": timeline_events,
        "notes": notes_list,
        "documents": doc_workflows,
        "payment_info": payment_info,
        "last_update_info": last_update_info,
        "ai_analysis": fallback_analysis
    }



