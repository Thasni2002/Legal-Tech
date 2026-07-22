from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base
from datetime import datetime

class ClerkDocumentDraft(Base):
    __tablename__ = "clerk_document_drafts"

    id = Column(Integer, primary_key=True, index=True)
    template_type = Column(String(100), default="vakalatnama")
    client_name = Column(String(255), default="John Doe")
    advocate_name = Column(String(255), default="Adv. K. R. Ram")
    case_title = Column(String(255), default="John Doe v. State of Kerala")
    court_name = Column(String(255), default="District Court, Ernakulam")
    batta_fee = Column(String(50), default="50")
    mode_of_summons = Column(String(100), default="Registered Post with AD")
    number_of_summons = Column(String(50), default="1")
    content = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
