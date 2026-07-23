from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from typing import List, Optional
import os
import uuid

from .schemas import NextPostingCreate, NextPostingUpdate, NextPostingOut
from .service import get_next_postings, create_next_posting, update_next_posting, delete_next_posting

router = APIRouter(
    prefix="/clerk/next-posting",
    tags=["Clerk Next Posting"]
)

@router.get("", response_model=List[NextPostingOut])
def read_next_postings(case_no: Optional[str] = None, db: Session = Depends(get_db)):
    return get_next_postings(db, case_no=case_no)

@router.post("", response_model=NextPostingOut, status_code=status.HTTP_201_CREATED)
def add_next_posting(data: NextPostingCreate, db: Session = Depends(get_db)):
    return create_next_posting(db, data)

@router.put("/{posting_id}", response_model=NextPostingOut)
def modify_next_posting(posting_id: int, data: NextPostingUpdate, db: Session = Depends(get_db)):
    updated = update_next_posting(db, posting_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Posting record not found")
    return updated

@router.delete("/{posting_id}")
def remove_next_posting(posting_id: int, db: Session = Depends(get_db)):
    success = delete_next_posting(db, posting_id)
    if not success:
        raise HTTPException(status_code=404, detail="Posting record not found")
    return {"detail": "Posting record deleted successfully"}

@router.post("/upload-order")
async def upload_posting_order(file: UploadFile = File(...)):
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "uploads")
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)
    
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"posting_order_{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(uploads_dir, unique_filename)

    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    return {"url": f"/uploads/{unique_filename}"}
