from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


from app.advocate.case_management.models import Case

class ConfidentialCaseAuditLog(Base):
    """
    Tamper-resistant audit log for every access event on confidential cases.
    Captures: who, when, what, from where.
    """
    __tablename__ = "confidential_case_audit_logs"

    id         = Column(Integer, primary_key=True, index=True)
    case_id    = Column(Integer, ForeignKey("case_management_cases.id", ondelete="CASCADE"), nullable=False)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action     = Column(String(100), nullable=False)   # See AUDIT_ACTIONS below
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(Text, nullable=True)
    extra_data = Column(JSON, nullable=True)           # e.g. {"doc_name": "affidavit.pdf"}
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship(Case, backref="audit_logs", passive_deletes=True)
    user = relationship("User", foreign_keys=[user_id])


# ─── Audit action constants ───────────────────────────────────────────────────
class AuditAction:
    CASE_CREATED               = "CASE_CREATED"
    UNLOCK_SUCCESS             = "UNLOCK_SUCCESS"
    UNLOCK_FAILED              = "UNLOCK_FAILED"
    PASSWORD_RESET_OTP_SENT    = "PASSWORD_RESET_OTP_SENT"
    PASSWORD_RESET_COMPLETED   = "PASSWORD_RESET_COMPLETED"
    ADMIN_RESET_INITIATED      = "ADMIN_RESET_INITIATED"
    UNAUTHORIZED_ACCESS        = "UNAUTHORIZED_ACCESS"
    CASE_VIEWED                = "CASE_VIEWED"
    CASE_UPDATED               = "CASE_UPDATED"
    CASE_DELETED               = "CASE_DELETED"
    DOC_DOWNLOADED             = "DOC_DOWNLOADED"
    NOTE_ADDED                 = "NOTE_ADDED"
    NOTE_DELETED               = "NOTE_DELETED"
