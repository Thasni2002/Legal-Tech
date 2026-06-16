from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import SessionLocal
from app.authapp.models import User
from .schemas import InvoiceCreate, InvoiceUpdateStatus, InvoiceOut, InvoiceStats
from . import service

router = APIRouter(prefix="/finance", tags=["Finance Management"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/invoices", response_model=List[InvoiceOut])
def get_invoices(
    advocate_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    client_name: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return service.get_invoices(db, advocate_id=advocate_id, status=status, client_name=client_name, email=email)

@router.get("/invoices/{invoice_id}", response_model=InvoiceOut)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = service.get_invoice_by_id(db, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@router.post("/invoices", response_model=InvoiceOut)
def create_invoice(data: InvoiceCreate, db: Session = Depends(get_db)):
    return service.create_invoice(db, data)

@router.put("/invoices/{invoice_id}/status", response_model=InvoiceOut)
def update_status(invoice_id: int, data: InvoiceUpdateStatus, db: Session = Depends(get_db)):
    invoice = service.update_invoice_status(db, invoice_id, data.status)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@router.delete("/invoices/{invoice_id}")
def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    success = service.delete_invoice(db, invoice_id)
    if not success:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"message": "Invoice deleted successfully"}

@router.get("/stats", response_model=InvoiceStats)
def get_stats(
    advocate_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return service.get_invoice_stats(db, advocate_id=advocate_id)

@router.get("/clients")
def get_registered_clients(db: Session = Depends(get_db)):
    users = db.query(User).all()
    client_list = []
    for user in users:
        client_list.append({
            "id": user.id,
            "name": user.username,
            "email": user.email,
        })
    return client_list
