from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from typing import List
import os
import uuid

from .schemas import PhysicalFilingCreate, PhysicalFilingUpdate, PhysicalFilingOut
from .service import get_physical_filings, create_physical_filing, update_physical_filing, delete_physical_filing

router = APIRouter(
    prefix="/clerk/physical-filing",
    tags=["Clerk Physical Filing"]
)

@router.get("", response_model=List[PhysicalFilingOut])
def read_physical_filings(db: Session = Depends(get_db)):
    return get_physical_filings(db)

@router.post("", response_model=PhysicalFilingOut, status_code=status.HTTP_201_CREATED)
def add_physical_filing(data: PhysicalFilingCreate, db: Session = Depends(get_db)):
    return create_physical_filing(db, data)

@router.put("/{filing_id}", response_model=PhysicalFilingOut)
def modify_physical_filing(filing_id: int, data: PhysicalFilingUpdate, db: Session = Depends(get_db)):
    updated = update_physical_filing(db, filing_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Physical filing record not found")
    return updated

@router.delete("/{filing_id}")
def remove_physical_filing(filing_id: int, db: Session = Depends(get_db)):
    success = delete_physical_filing(db, filing_id)
    if not success:
        raise HTTPException(status_code=404, detail="Physical filing record not found")
    return {"detail": "Physical filing record deleted successfully"}

@router.post("/upload-receipt")
async def upload_filing_receipt(file: UploadFile = File(...)):
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "uploads")
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)
    
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"filing_receipt_{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(uploads_dir, unique_filename)

    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    return {"url": f"/uploads/{unique_filename}"}
