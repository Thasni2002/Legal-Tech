from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ClientNoticeBase(BaseModel):
    case_no: str
    client_name: str
    client_phone: Optional[str] = None
    client_email: Optional[str] = None
    notice_type: str
    channel: Optional[str] = "WhatsApp"
    notice_content: str
    tracking_number: Optional[str] = None
    delivery_status: Optional[str] = "Draft"
    sent_at: Optional[str] = None

class ClientNoticeCreate(ClientNoticeBase):
    pass

class ClientNoticeUpdate(BaseModel):
    case_no: Optional[str] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    client_email: Optional[str] = None
    notice_type: Optional[str] = None
    channel: Optional[str] = None
    notice_content: Optional[str] = None
    tracking_number: Optional[str] = None
    delivery_status: Optional[str] = None
    sent_at: Optional[str] = None

class ClientNoticeOut(ClientNoticeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
