from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional, List
from jose import jwt, JWTError

from app.database import get_db
from app.authapp.models import User
from app.authapp.service import SECRET_KEY, ALGORITHM

from .schemas import CaseCreate, CaseUpdate
from .service import create_case, get_all_cases, get_case, update_case, delete_case

router = APIRouter(
    prefix="/case-management",
    tags=["Case Management"]
)


# ─── Auth dependency (same pattern as tasks module) ───────────────────────────

def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Returns user if a valid Bearer token is provided, else None."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("id")
        if not user_id:
            return None
    except JWTError:
        return None
    return db.query(User).filter(User.id == user_id).first()


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """Requires a valid Bearer token."""
    user = get_current_user_optional.__wrapped__(authorization, db) if hasattr(get_current_user_optional, '__wrapped__') else None
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ─────────────────────────────────────────────────────────────────────────────
# Case CRUD
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/")
def add_case(
    data: CaseCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    return create_case(db, data, current_user)


@router.get("/")
def fetch_cases(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    SECURITY: Confidential cases are filtered at the ORM level.
    Only the owning Senior Advocate will see their own confidential cases.
    All other users receive the case list WITHOUT any confidential entries.
    """
    return get_all_cases(db, current_user)


from typing import Optional as Opt
from .schemas import AIDocumentHistoryResponse, AIDocumentHistoryUpdate

@router.get("/ai-documents/history", response_model=list[AIDocumentHistoryResponse])
def fetch_ai_document_history(
    case_id: Opt[int] = None,
    db: Session = Depends(get_db)
):
    from .service import get_ai_document_histories
    return get_ai_document_histories(db, case_id=case_id)


@router.put("/ai-documents/history/{doc_id}", response_model=AIDocumentHistoryResponse)
def update_ai_document(
    doc_id: int,
    data: AIDocumentHistoryUpdate,
    db: Session = Depends(get_db)
):
    from .service import update_ai_document_history
    updated = update_ai_document_history(db, doc_id, content=data.content, prompt=data.prompt)
    if not updated:
        raise HTTPException(status_code=404, detail="AI document history item not found")
    return updated


@router.delete("/ai-documents/history/{doc_id}")
def delete_ai_document(
    doc_id: int,
    db: Session = Depends(get_db)
):
    from .service import delete_ai_document_history
    success = delete_ai_document_history(db, doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="AI document history item not found")
    return {"message": "Document deleted successfully"}


@router.get("/{case_id}/timeline")
def fetch_case_timeline(
    case_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    from .service import get_case_timeline
    events = get_case_timeline(db, case_id, current_user)
    return events


@router.get("/{case_id}/ai-summary")
def fetch_case_ai_summary(
    case_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Fetches 100% dynamic AI Master Case Progress & Summary for a specific case,
    analyzing its entire journey from filing date through all timeline events,
    assigned advocates, hearing notes, discussions, and status updates.
    """
    from .service import get_full_case_ai_summary
    return get_full_case_ai_summary(db, case_id, current_user)


@router.get("/{case_id}")
def fetch_case(
    case_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):

    """
    SECURITY: Returns 404 for confidential cases if the requester is not the owner.
    Intentionally 404 (not 403) to prevent existence leakage.
    """
    case = get_case(db, case_id, current_user)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.put("/{case_id}")
def edit_case(
    case_id: int,
    data: CaseUpdate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    # Guard: block non-owners from editing confidential cases
    existing = db.query(__import__('app.advocate.case_management.models', fromlist=['Case']).Case).filter_by(id=case_id).first()
    if existing and existing.is_confidential:
        owner_id = getattr(current_user, 'id', None)
        user_role = (getattr(current_user, 'role', '') or '').lower()
        if existing.confidential_owner_id != owner_id and 'admin' not in user_role:
            raise HTTPException(status_code=404, detail="Case not found")
    updated = update_case(db, case_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Case not found")
    return updated


@router.delete("/{case_id}")
def remove_case(
    case_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    # Guard: block non-owners from deleting confidential cases
    from .models import Case
    existing = db.query(Case).filter(Case.id == case_id).first()
    if existing and existing.is_confidential:
        owner_id = getattr(current_user, 'id', None)
        user_role = (getattr(current_user, 'role', '') or '').lower()
        if existing.confidential_owner_id != owner_id and 'admin' not in user_role:
            raise HTTPException(status_code=404, detail="Case not found")
    deleted = delete_case(db, case_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"message": "Case deleted successfully"}


from pydantic import BaseModel
class GenerateDocumentRequest(BaseModel):
    prompt: str

@router.post("/{case_id}/generate-document")
def generate_document(
    case_id: int,
    request: GenerateDocumentRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    from .service import generate_legal_document
    return generate_legal_document(db, case_id, request.prompt)


from fastapi import UploadFile, File, Response, Request
from .models import UploadedFile

@router.post("/upload")
async def upload_case_document(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        content = await file.read()
        db_file = UploadedFile(
            filename=file.filename,
            content_type=file.content_type,
            data=content
        )
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        
        base_url = str(request.base_url).rstrip('/')
        file_url = f"{base_url}/case-management/documents/{db_file.id}"
        return {
            "success": True,
            "url": file_url,
            "filename": file.filename
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save uploaded document: {str(e)}"
        )


@router.get("/documents/{file_id}")
def get_uploaded_document(
    file_id: int,
    db: Session = Depends(get_db)
):
    db_file = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
        
    return Response(
        content=db_file.data,
        media_type=db_file.content_type,
        headers={
            "Content-Disposition": f'inline; filename="{db_file.filename}"'
        }
    )


from .schemas import AIAssistantRequest

@router.post("/ai-assistant")
def ai_assistant_endpoint(
    request: AIAssistantRequest,
    db: Session = Depends(get_db)
):
    from .service import ask_ai_assistant
    return ask_ai_assistant(db, request.query, request.role, request.advocateName, request.clientName)


from app.advocate.tasks.routes import get_current_user as tasks_get_current_user
from .models import CaseDocumentWorkflow
from .schemas import (
    CaseDocumentWorkflowCreate,
    CaseDocumentWorkflowUpdate,
    CaseDocumentWorkflowReview,
    CaseDocumentWorkflowResponse
)
from app.utils.email import send_email

@router.get("/workflow/documents", response_model=List[CaseDocumentWorkflowResponse])
def get_workflow_documents(
    current_user: User = Depends(tasks_get_current_user),
    db: Session = Depends(get_db)
):
    role = (current_user.role or "").lower()
    if "senior" in role or "admin" in role:
        return db.query(CaseDocumentWorkflow).all()
    else:
        return db.query(CaseDocumentWorkflow).filter(CaseDocumentWorkflow.junior_id == current_user.id).all()

@router.post("/workflow/documents", response_model=CaseDocumentWorkflowResponse)
def create_workflow_document(
    data: CaseDocumentWorkflowCreate,
    current_user: User = Depends(tasks_get_current_user),
    db: Session = Depends(get_db)
):
    new_doc = CaseDocumentWorkflow(
        case_id=data.case_id,
        case_no=data.case_no,
        case_title=data.case_title,
        title=data.title,
        document_type=data.document_type,
        content=data.content,
        file_url=data.file_url,
        junior_id=current_user.id,
        status="Draft"
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc

@router.get("/workflow/documents/{doc_id}", response_model=CaseDocumentWorkflowResponse)
def get_workflow_document(
    doc_id: int,
    current_user: User = Depends(tasks_get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(CaseDocumentWorkflow).filter(CaseDocumentWorkflow.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    role = (current_user.role or "").lower()
    if "senior" not in role and "admin" not in role and doc.junior_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this document")
    
    return doc

@router.put("/workflow/documents/{doc_id}", response_model=CaseDocumentWorkflowResponse)
def update_workflow_document(
    doc_id: int,
    data: CaseDocumentWorkflowUpdate,
    current_user: User = Depends(tasks_get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(CaseDocumentWorkflow).filter(CaseDocumentWorkflow.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if doc.junior_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this document")
    
    if doc.status not in ["Draft", "Needs Correction"]:
        raise HTTPException(status_code=400, detail="Cannot edit document when under review or approved")
    
    if data.title is not None:
        doc.title = data.title
    if data.document_type is not None:
        doc.document_type = data.document_type
    if data.content is not None:
        doc.content = data.content
    if data.file_url is not None:
        doc.file_url = data.file_url
        
    db.commit()
    db.refresh(doc)
    return doc

@router.post("/workflow/documents/{doc_id}/submit", response_model=CaseDocumentWorkflowResponse)
def submit_workflow_document(
    doc_id: int,
    current_user: User = Depends(tasks_get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(CaseDocumentWorkflow).filter(CaseDocumentWorkflow.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if doc.junior_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to submit this document")
        
    doc.status = "Pending Review"
    db.commit()
    db.refresh(doc)
    return doc

@router.post("/workflow/documents/{doc_id}/review", response_model=CaseDocumentWorkflowResponse)
async def review_workflow_document(
    doc_id: int,
    data: CaseDocumentWorkflowReview,
    current_user: User = Depends(tasks_get_current_user),
    db: Session = Depends(get_db)
):
    role = (current_user.role or "").lower()
    if "senior" not in role and "admin" not in role:
        raise HTTPException(status_code=403, detail="Only seniors/admins can review documents")
        
    doc = db.query(CaseDocumentWorkflow).filter(CaseDocumentWorkflow.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if data.status not in ["Approved", "Needs Correction"]:
        raise HTTPException(status_code=400, detail="Invalid status for review")
        
    doc.status = data.status
    doc.senior_feedback = data.senior_feedback
    doc.senior_id = current_user.id
    db.commit()
    db.refresh(doc)
    
    # Notify Junior Advocate
    junior = db.query(User).filter(User.id == doc.junior_id).first()
    if junior and junior.email:
        try:
            from app.utils.email_templates import build_document_review_email
            subject = f"Document '{doc.title}' Review Updated: {doc.status}"
            body = build_document_review_email(
                junior_name=junior.first_name or junior.username,
                doc_title=doc.title,
                case_title=doc.case_title,
                status=doc.status,
                feedback=doc.senior_feedback or ""
            )
            await send_email(junior.email, subject, body)
        except Exception as e:
            print(f"Failed to send review email to junior: {e}")
            
    return doc


# ─────────────────────────────────────────────────────────────────────────────
# Case Notes Routes
# ─────────────────────────────────────────────────────────────────────────────

from .schemas import CaseNoteCreate, CaseNoteOut
from .models import CaseNote
from typing import List as TypingList


@router.get("/{case_id}/notes", response_model=TypingList[CaseNoteOut])
def get_case_notes(
    case_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Fetch all internal advocate notes for a case (newest first)."""
    # SECURITY: Block non-owners from reading notes on confidential cases
    from .models import Case as CaseModel
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if case and case.is_confidential:
        owner_id = getattr(current_user, 'id', None)
        if case.confidential_owner_id != owner_id:
            raise HTTPException(status_code=404, detail="Case not found")

    notes = (
        db.query(CaseNote)
        .filter(CaseNote.case_id == case_id)
        .order_by(CaseNote.created_at.desc())
        .all()
    )
    return notes


@router.post("/{case_id}/notes", response_model=CaseNoteOut)
def add_case_note(
    case_id: int,
    data: CaseNoteCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Add a new internal advocate note to a case."""
    from .models import Case as CaseModel
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if case and case.is_confidential:
        owner_id = getattr(current_user, 'id', None)
        if case.confidential_owner_id != owner_id:
            raise HTTPException(status_code=404, detail="Case not found")

    note = CaseNote(
        case_id=case_id,
        text=data.text,
        category=data.category or "General Note",
        author=data.author,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.delete("/{case_id}/notes/{note_id}")
def delete_case_note(
    case_id: int,
    note_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Delete an internal advocate note."""
    from .models import Case as CaseModel
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if case and case.is_confidential:
        owner_id = getattr(current_user, 'id', None)
        if case.confidential_owner_id != owner_id:
            raise HTTPException(status_code=404, detail="Case not found")

    note = db.query(CaseNote).filter(CaseNote.id == note_id, CaseNote.case_id == case_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
    return {"message": "Note deleted"}
