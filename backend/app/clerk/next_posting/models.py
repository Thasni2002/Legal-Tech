from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from app.database import Base
from datetime import datetime

class ClerkNextPosting(Base):
    __tablename__ = "clerk_next_postings"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("case_management_cases.id", ondelete="SET NULL"), nullable=True)
    case_no = Column(String(100), nullable=False)
    case_title = Column(String(255), nullable=False)
    court_name = Column(String(255), nullable=True)
    court_hall = Column(String(100), nullable=True)
    judge_name = Column(String(255), nullable=True)
    next_hearing_date = Column(String(100), nullable=False)
    hearing_time = Column(String(100), nullable=True)
    hearing_purpose = Column(String(255), nullable=True)
    item_number = Column(String(50), nullable=True)
    posting_order_url = Column(String(500), nullable=True)
    notify_senior = Column(Boolean, default=True)
    notify_junior = Column(Boolean, default=True)
    notify_client = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
