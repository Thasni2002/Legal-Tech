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


from fastapi import UploadFile, File, Response
from .models import UploadedFile

@router.post("/upload")
def upload_case_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        content = file.file.read()
        db_file = UploadedFile(
            filename=file.filename,
            content_type=file.content_type,
            data=content
        )
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        
        file_url = f"http://localhost:8000/case-management/documents/{db_file.id}"
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
    return ask_ai_assistant(db, request.query, request.role, request.advocateName)