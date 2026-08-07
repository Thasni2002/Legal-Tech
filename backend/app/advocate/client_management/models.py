from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
from app.advocate.lawfirm_management.models import Advocate


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(String(100), unique=True, index=True)
    full_name = Column(String(100))
    email = Column(String(150))
    phone = Column(String(20))
    alt_phone = Column(String(20), nullable=True)
    address = Column(String(500), nullable=True)
    district = Column(String(100), nullable=True)

    documents = relationship("ClientDocument", back_populates="client")


class ClientDocument(Base):
    __tablename__ = "client_documents"

    id = Column(Integer, primary_key=True, index=True)
    document_name = Column(String(255))
    document_type = Column(String(100))
    file_path = Column(String(500))

    client_id = Column(Integer, ForeignKey("clients.id"))

    client = relationship("Client", back_populates="documents")


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_no = Column(String(50), unique=True, index=True)
    title = Column(String(255), nullable=False)
    client_name = Column(String(150), nullable=False)
    type = Column(String(100), nullable=False)  # e.g. "Civil", "Criminal"
    court = Column(String(255), nullable=False)
    status = Column(String(50), default="Active")  # "Active", "Pending", "Hearing", "Closed"
    advocate_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    advocate = relationship("User", foreign_keys=[advocate_id])


class Hearing(Base):
    __tablename__ = "hearings"

    id = Column(Integer, primary_key=True, index=True)
    case_no = Column(String(50), nullable=True)
    case_title = Column(String(255), nullable=False)
    court = Column(String(255), nullable=False)
    advocate_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    advocate_name = Column(String(150), nullable=True)
    date = Column(Date, nullable=False)
    time = Column(String(50), nullable=False)
    status = Column(String(50), default="Scheduled")

    advocate = relationship("User", foreign_keys=[advocate_id])


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    timestamp_str = Column(String(100), nullable=False)  # e.g. "10 mins ago"
    type = Column(String(50), nullable=True)
    advocate_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    advocate = relationship("User", foreign_keys=[advocate_id])


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    case_no = Column(String(50), nullable=True)
    advocate_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    advocate = relationship("User", foreign_keys=[advocate_id])


class ClientMeetingNote(Base):
    __tablename__ = "client_meeting_notes"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(String(100), index=True, nullable=False)
    case_no = Column(String(50), nullable=True)
    subject = Column(String(255), nullable=False)
    description = Column(String(4000), nullable=False)
    meeting_date = Column(DateTime, default=datetime.utcnow)
    meeting_mode = Column(String(50), default="In-Person")
    advocate_name = Column(String(150), nullable=True)
    proof_document_path = Column(String(500), nullable=True)
    proof_document_name = Column(String(255), nullable=True)
    action_items = Column(String(1000), nullable=True)
    action_status = Column(String(50), default="Pending")
    tags = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)