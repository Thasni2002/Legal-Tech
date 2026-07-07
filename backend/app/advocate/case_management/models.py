
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.dialects.mysql import LONGTEXT, LONGBLOB
from app.database import Base
from datetime import datetime

class Case(Base):
    __tablename__ = "case_management_cases"

    id = Column(Integer, primary_key=True, index=True)

    case_id = Column(String(100))
    cnr_number = Column(String(100), nullable=True)
    case_title = Column(String(255))
    case_no = Column(String(100))
    case_type = Column(String(100))
    case_description = Column(Text)

    client_name = Column(String(255))
    contact_number = Column(String(50))
    email_id = Column(String(255))

    court_name = Column(String(255))
    court_type = Column(String(100))

    status = Column(String(50))
    selected_advocate = Column(String(255), nullable=True)
    documents = Column(LONGTEXT, nullable=True)
    next_hearing_date = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=True)
    data = Column(LONGBLOB, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)