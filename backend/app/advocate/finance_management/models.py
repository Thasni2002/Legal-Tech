from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    
    # Advocate info (linked to User model representing advocate)
    advocate_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Client Details
    client_name = Column(String(150), nullable=False)
    case_number = Column(String(100), nullable=True)
    mobile_number = Column(String(50), nullable=True)
    email = Column(String(150), nullable=True)

    # Payment Details
    gpay_number = Column(String(50), nullable=True)
    upi_id = Column(String(100), nullable=True)

    # Court Fee details
    court_fee_case_type = Column(String(150), nullable=True)
    court_fee_amount = Column(Float, default=0.0)
    court_fee_jurisdiction = Column(String(150), nullable=True)
    
    # Stamp Duty details
    stamp_duty_doc_type = Column(String(150), nullable=True)
    stamp_duty_amount = Column(Float, default=0.0)
    stamp_duty_state = Column(String(100), nullable=True)
    
    # Advocate Fee details
    advocate_fee_case_type = Column(String(150), nullable=True)
    advocate_fee_amount = Column(Float, default=0.0)
    advocate_fee_remarks = Column(String(255), nullable=True)
    
    # Paper Filing details
    filing_cost_pages = Column(Integer, default=0)
    filing_cost_amount = Column(Float, default=0.0)
    filing_cost_notes = Column(String(255), nullable=True)
    
    # Totals
    subtotal = Column(Float, default=0.0)
    gst = Column(Float, default=0.0)
    grand_total = Column(Float, default=0.0)
    
    # Status
    status = Column(String(50), default="Pending")  # "Pending", "Paid", "Overdue", "Sent"
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    advocate = relationship("User", foreign_keys=[advocate_id])
