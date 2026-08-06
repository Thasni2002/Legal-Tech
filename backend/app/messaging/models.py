from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class MessagingConversation(Base):
    __tablename__ = "messaging_conversations"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("case_management_cases.id", ondelete="SET NULL"), nullable=True)
    case_title = Column(String(255), nullable=True)
    case_no = Column(String(100), nullable=True)
    
    client_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    client_name = Column(String(255), nullable=True)
    
    assigned_junior_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_junior_name = Column(String(255), nullable=True)
    
    title = Column(String(255), nullable=True)
    status = Column(String(50), default="Active") # Active, Closed, Archived
    priority = Column(String(50), default="Medium") # Low, Medium, High, Urgent
    is_pinned = Column(Boolean, default=False)
    
    last_message = Column(Text, nullable=True)
    last_message_at = Column(DateTime, default=datetime.utcnow)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)


class MessagingMessage(Base):
    __tablename__ = "messaging_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("messaging_conversations.id", ondelete="CASCADE"), nullable=False)
    
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sender_name = Column(String(255), nullable=True)
    sender_role = Column(String(100), nullable=True)
    
    content = Column(Text, nullable=True)
    message_type = Column(String(50), default="text") # text, image, voice, audio, video, document
    
    file_url = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_size = Column(String(100), nullable=True)
    
    case_no = Column(String(100), nullable=True)
    case_title = Column(String(255), nullable=True)
    
    is_edited = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    edited_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)


class MessagingMessageRead(Base):
    __tablename__ = "messaging_message_reads"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messaging_messages.id", ondelete="CASCADE"), nullable=False)
    conversation_id = Column(Integer, ForeignKey("messaging_conversations.id", ondelete="CASCADE"), nullable=False)
    reader_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    read_at = Column(DateTime, default=datetime.utcnow)


class MessagingAuditLog(Base):
    __tablename__ = "messaging_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, nullable=True)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    actor_name = Column(String(255), nullable=True)
    actor_role = Column(String(100), nullable=True)
    action = Column(String(100), nullable=False) # created, sent, edited, deleted, assigned, pinned, status_changed
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)
