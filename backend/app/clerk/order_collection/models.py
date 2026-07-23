from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from app.database import Base
from datetime import datetime

class ClerkOrderCollectionRecord(Base):
    __tablename__ = "clerk_order_collections"

    id = Column(Integer, primary_key=True, index=True)
    case_no = Column(String(100), nullable=False)
    case_title = Column(String(255), nullable=False)
    order_date = Column(String(100), nullable=True)
    court_name = Column(String(255), nullable=False)
    order_type = Column(String(100), nullable=True)
    cc_application_no = Column(String(100), nullable=True)
    physical_copy_collected = Column(Boolean, default=False)
    scanned_pdf_url = Column(String(500), nullable=True)
    status = Column(String(50), default="Awaiting Order")
    assigned_advocate_name = Column(String(255), nullable=True)
    client_notified = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
