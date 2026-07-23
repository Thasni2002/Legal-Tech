from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from typing import List
import os
import uuid

from .schemas import OrderCollectionCreate, OrderCollectionUpdate, OrderCollectionOut
from .service import get_order_collections, create_order_collection, update_order_collection, delete_order_collection

router = APIRouter(
    prefix="/clerk/order-collection",
    tags=["Clerk Order Collection"]
)

@router.get("", response_model=List[OrderCollectionOut])
def read_order_collections(db: Session = Depends(get_db)):
    return get_order_collections(db)

@router.post("", response_model=OrderCollectionOut, status_code=status.HTTP_201_CREATED)
def add_order_collection(data: OrderCollectionCreate, db: Session = Depends(get_db)):
    return create_order_collection(db, data)

@router.put("/{order_id}", response_model=OrderCollectionOut)
def modify_order_collection(order_id: int, data: OrderCollectionUpdate, db: Session = Depends(get_db)):
    updated = update_order_collection(db, order_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Order collection record not found")
    return updated

@router.delete("/{order_id}")
def remove_order_collection(order_id: int, db: Session = Depends(get_db)):
    success = delete_order_collection(db, order_id)
    if not success:
        raise HTTPException(status_code=404, detail="Order collection record not found")
    return {"detail": "Order collection record deleted successfully"}

@router.post("/upload-pdf")
async def upload_order_pdf(file: UploadFile = File(...)):
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "uploads")
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)
    
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"court_order_{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(uploads_dir, unique_filename)

    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    return {"url": f"/uploads/{unique_filename}", "name": file.filename}
