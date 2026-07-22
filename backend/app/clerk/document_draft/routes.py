from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from typing import List

from .schemas import ClerkDocumentDraftCreate, ClerkDocumentDraftUpdate, ClerkDocumentDraftOut
from .service import get_document_drafts, get_document_draft, create_document_draft, update_document_draft, delete_document_draft

router = APIRouter(
    prefix="/clerk/document-draft",
    tags=["Clerk Document Draft"]
)

@router.get("/", response_model=List[ClerkDocumentDraftOut])
def read_drafts(db: Session = Depends(get_db)):
    return get_document_drafts(db)

@router.get("/{draft_id}", response_model=ClerkDocumentDraftOut)
def read_draft(draft_id: int, db: Session = Depends(get_db)):
    draft = get_document_draft(db, draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return draft

@router.post("/", response_model=ClerkDocumentDraftOut, status_code=status.HTTP_201_CREATED)
def add_draft(data: ClerkDocumentDraftCreate, db: Session = Depends(get_db)):
    return create_document_draft(db, data)

@router.put("/{draft_id}", response_model=ClerkDocumentDraftOut)
def modify_draft(draft_id: int, data: ClerkDocumentDraftUpdate, db: Session = Depends(get_db)):
    updated = update_document_draft(db, draft_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Draft not found")
    return updated

@router.delete("/{draft_id}")
def remove_draft(draft_id: int, db: Session = Depends(get_db)):
    success = delete_document_draft(db, draft_id)
    if not success:
        raise HTTPException(status_code=404, detail="Draft not found")
    return {"detail": "Draft deleted successfully"}
