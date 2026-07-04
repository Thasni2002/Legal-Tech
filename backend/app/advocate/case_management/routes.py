from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db

from .schemas import CaseCreate, CaseUpdate
from .service import create_case, get_all_cases, get_case, update_case, delete_case

router = APIRouter(
    prefix="/case-management",
    tags=["Case Management"]
)


@router.post("/")
def add_case(
    data: CaseCreate,
    db: Session = Depends(get_db)
):
    return create_case(db, data)


@router.get("/")
def fetch_cases(
    db: Session = Depends(get_db)
):
    return get_all_cases(db)


@router.get("/{case_id}")
def fetch_case(
    case_id: int,
    db: Session = Depends(get_db)
):
    case = get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.put("/{case_id}")
def edit_case(
    case_id: int,
    data: CaseUpdate,
    db: Session = Depends(get_db)
):
    updated = update_case(db, case_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Case not found")
    return updated


@router.delete("/{case_id}")
def remove_case(
    case_id: int,
    db: Session = Depends(get_db)
):
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
    db: Session = Depends(get_db)
):
    from .service import generate_legal_document
    return generate_legal_document(db, case_id, request.prompt)


import os
import shutil
from fastapi import UploadFile, File

@router.post("/upload")
def upload_case_document(file: UploadFile = File(...)):
    uploads_dir = os.path.abspath("uploads")
    docs_dir = os.path.join(uploads_dir, "case_documents")
    if not os.path.exists(docs_dir):
        os.makedirs(docs_dir)

    # Use a secure filename
    filename = file.filename
    # Avoid path traversal attacks
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(docs_dir, safe_filename)

    try:
        # Copy file stream directly to disk to handle files up to 5GB without RAM limit
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return static url of the document
        file_url = f"http://localhost:8000/uploads/case_documents/{safe_filename}"
        return {
            "success": True,
            "url": file_url,
            "filename": safe_filename
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save uploaded document: {str(e)}"
        )


from .schemas import AIAssistantRequest

@router.post("/ai-assistant")
def ai_assistant_endpoint(
    request: AIAssistantRequest,
    db: Session = Depends(get_db)
):
    from .service import ask_ai_assistant
    return ask_ai_assistant(db, request.query, request.role, request.advocateName)