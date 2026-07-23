from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base
from datetime import datetime

class ClerkClientNoticeRecord(Base):
    __tablename__ = "clerk_client_notices"

    id = Column(Integer, primary_key=True, index=True)
    case_no = Column(String(100), nullable=False)
    client_name = Column(String(255), nullable=False)
    client_phone = Column(String(50), nullable=True)
    client_email = Column(String(255), nullable=True)
    notice_type = Column(String(100), nullable=False)
    channel = Column(String(50), default="WhatsApp")
    notice_content = Column(Text, nullable=False)
    tracking_number = Column(String(100), nullable=True)
    delivery_status = Column(String(50), default="Draft")
    sent_at = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
