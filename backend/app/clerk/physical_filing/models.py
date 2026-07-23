from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from app.database import Base
from datetime import datetime

class ClerkPhysicalFilingRecord(Base):
    __tablename__ = "clerk_physical_filings"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(100), nullable=False)
    client_name = Column(String(255), nullable=False)
    advocate_name = Column(String(255), nullable=True)
    court_name = Column(String(255), nullable=False)
    filing_type = Column(String(100), nullable=True)
    filing_date = Column(String(100), nullable=True)
    documents_checklist = Column(Text, nullable=True)
    court_fee_paid = Column(Float, default=0.0)
    stamp_duty = Column(Float, default=0.0)
    filing_status = Column(String(50), default="Pending")
    filing_receipt_url = Column(String(500), nullable=True)
    diary_sr_number = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
