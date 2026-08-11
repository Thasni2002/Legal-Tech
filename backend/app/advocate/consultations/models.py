from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)

    # Client info (linked to User model if user is registered, or string for guest clients)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    client_name = Column(String(150), nullable=False)

    # Linked Case (optional)
    case_id = Column(Integer, ForeignKey("case_management_cases.id"), nullable=True)

    # Schedule details
    date = Column(Date, nullable=False)
    time = Column(String(50), nullable=False)  # E.g., "11:00 AM"
    type = Column(String(100), nullable=False)  # "Video Call", "Chat", "Person to Person"
    meeting_link = Column(String(500), nullable=True)

    # Legal matters
    issue = Column(String(255), nullable=True)  # E.g. "Civil Dispute"
    fee = Column(String(50), nullable=True, default="₹500")

    # Status
    status = Column(String(50), nullable=False, default="Pending")  # "Pending", "Approved", "Rescheduled", "Completed", "Scheduled"

    # Completion details
    duration = Column(String(50), nullable=True)  # E.g., "30 mins"
    summary = Column(String(500), nullable=True)  # Consultation notes summary

    # Reschedule notes
    reschedule_reason = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)

    # Relationships
    client = relationship("User", foreign_keys=[client_id])
    case = relationship("app.advocate.case_management.models.Case", foreign_keys=[case_id])
    notes = relationship("MeetingNote", back_populates="consultation", cascade="all, delete-orphan")


class MeetingNote(Base):
    __tablename__ = "meeting_notes"

    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(Integer, ForeignKey("consultations.id"), nullable=True)
    case_id = Column(Integer, ForeignKey("case_management_cases.id"), nullable=True)
    advocate_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    client_name = Column(String(150), nullable=True)
    case_title = Column(String(255), nullable=True)
    case_no = Column(String(100), nullable=True)

    title = Column(String(255), nullable=False, default="Consultation Meeting Note")
    meeting_date = Column(Date, nullable=False)
    meeting_time = Column(String(50), nullable=True)
    meeting_type = Column(String(100), nullable=True, default="Video Call")

    summary = Column(Text, nullable=True)
    key_topics = Column(Text, nullable=True)
    action_items = Column(JSON, nullable=True, default=list)
    legal_advice = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)

    is_confidential = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)

    consultation = relationship("Consultation", back_populates="notes", foreign_keys=[consultation_id])
    case = relationship("app.advocate.case_management.models.Case", foreign_keys=[case_id])
    advocate = relationship("User", foreign_keys=[advocate_id])
    client = relationship("User", foreign_keys=[client_id])

