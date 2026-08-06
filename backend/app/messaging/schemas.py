from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MessageCreate(BaseModel):
    content: Optional[str] = None
    message_type: Optional[str] = "text"
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[str] = None
    case_no: Optional[str] = None
    case_title: Optional[str] = None

class MessageEdit(BaseModel):
    content: str

class MessageOut(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    sender_name: Optional[str] = None
    sender_role: Optional[str] = None
    content: Optional[str] = None
    message_type: str
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[str] = None
    case_no: Optional[str] = None
    case_title: Optional[str] = None
    is_edited: bool
    is_deleted: bool
    edited_at: Optional[datetime] = None
    created_at: datetime
    is_read: Optional[bool] = False

    class Config:
        from_attributes = True

class ConversationCreate(BaseModel):
    case_id: Optional[int] = None
    client_user_id: Optional[int] = None
    client_name: Optional[str] = None
    title: Optional[str] = None
    priority: Optional[str] = "Medium"
    initial_message: Optional[str] = None

class ConversationAssign(BaseModel):
    assigned_junior_id: int
    assigned_junior_name: Optional[str] = None

class ConversationStatusUpdate(BaseModel):
    status: str

class ConversationPriorityUpdate(BaseModel):
    priority: str

class ConversationOut(BaseModel):
    id: int
    case_id: Optional[int] = None
    case_title: Optional[str] = None
    case_no: Optional[str] = None
    client_user_id: Optional[int] = None
    client_name: Optional[str] = None
    assigned_junior_id: Optional[int] = None
    assigned_junior_name: Optional[str] = None
    title: Optional[str] = None
    status: str
    priority: str
    is_pinned: bool
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    unread_count: Optional[int] = 0

    class Config:
        from_attributes = True

class AuditLogOut(BaseModel):
    id: int
    conversation_id: Optional[int] = None
    actor_id: Optional[int] = None
    actor_name: Optional[str] = None
    actor_role: Optional[str] = None
    action: str
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UnreadCountOut(BaseModel):
    unread_count: int
