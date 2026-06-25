from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import SessionLocal
from app.authapp.models import User
from .schemas import (
    InvoiceCreate,
    InvoiceUpdateStatus,
    InvoiceOut,
    InvoiceStats,
    CreateOrderSchema,
    VerifyPaymentSchema
)
from . import service
from pydantic import BaseModel
from app.utils.email import send_email
import razorpay
import os

router = APIRouter(prefix="/finance", tags=["Finance Management"])


# Database connection
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Razorpay client
client = razorpay.Client(
    auth=(
        os.getenv("RAZORPAY_KEY_ID"),
        os.getenv("RAZORPAY_KEY_SECRET")
    )
)


# -----------------------------
# Schemas
# -----------------------------
class PaymentEmailSchema(BaseModel):
    email: str
    client_name: str
    amount: str
    payment_method: str
    gpay_number: str | None = None
    upi_id: str | None = None
    payment_link: str




# -----------------------------
# Invoice APIs
# -----------------------------
@router.get("/invoices", response_model=List[InvoiceOut])
def get_invoices(
    advocate_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    client_name: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return service.get_invoices(
        db,
        advocate_id=advocate_id,
        status=status,
        client_name=client_name,
        email=email
    )


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
def update_status(
    invoice_id: int,
    data: InvoiceUpdateStatus,
    db: Session = Depends(get_db)
):
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


# -----------------------------
# Client API
# -----------------------------
@router.get("/clients")
def get_registered_clients(db: Session = Depends(get_db)):
    users = db.query(User).all()
    client_list = []

    for user in users:
        client_list.append({
            "id": user.id,
            "name": user.username,
            "email": user.email,
            "mobile": user.mobile_number if hasattr(user, "mobile_number") else None
        })

    return client_list


# -----------------------------
# Send Payment Email
# -----------------------------
@router.post("/send-payment-email")
async def send_payment_email(data: PaymentEmailSchema):

    html_content = f"""
    <h2>Legal Service Payment Request</h2>

    <p>Dear {data.client_name},</p>

    <p>
        Your invoice has been generated successfully.
        Please complete the payment using the link below.
    </p>

    <p><strong>Total Amount:</strong> ₹{data.amount}</p>

    <br>

    <a href="{data.payment_link}"
       style="
         background:#2563EB;
         color:white;
         padding:12px 20px;
         text-decoration:none;
         border-radius:8px;
       ">
       Open Payment
    </a>

    <br><br>

    <p>Thank you for choosing our legal services.</p>
    <p>Senior Advocate Team</p>
    """

    await send_email(
        to_email=data.email,
        subject="Legal Payment Request",
        body=html_content
    )

    return {"message": "Email sent successfully"}


# -----------------------------
# Razorpay Create Order
# -----------------------------
@router.post("/payment/create-order")
def create_order(data: CreateOrderSchema):
    amount = int(data.amount * 100)

    order = client.order.create({
        "amount": amount,
        "currency": "INR",
        "payment_capture": 1
    })

    return {
        "id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"]
    }


# -----------------------------
# Razorpay Verify Payment
# -----------------------------
@router.post("/payment/verify")
def verify_payment(
    data: VerifyPaymentSchema,
    db: Session = Depends(get_db)
):
    try:
        client.utility.verify_payment_signature({
            "razorpay_order_id": data.razorpay_order_id,
            "razorpay_payment_id": data.razorpay_payment_id,
            "razorpay_signature": data.razorpay_signature
        })

        invoice = service.update_invoice_status(
            db,
            data.invoice_id,
            "Paid"
        )

        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")

        return {
            "success": True,
            "message": "Payment verified successfully",
            "invoice": invoice
        }

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Payment verification failed"
        )