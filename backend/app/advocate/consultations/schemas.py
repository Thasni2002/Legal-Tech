from pydantic import BaseModel
from datetime import date as date_type, datetime
from typing import Optional, List, Any

class ConsultationBase(BaseModel):
    client_name: str
    date: date_type
    time: str
    type: str
    issue: Optional[str] = None
    fee: Optional[str] = "₹500"

class ConsultationCreate(ConsultationBase):
    client_id: Optional[int] = None
    case_id: Optional[int] = None
    client_email: Optional[str] = None
    meeting_link: Optional[str] = None
    status: Optional[str] = None

class ConsultationStart(BaseModel):
    client_name: str
    client_email: Optional[str] = None
    type: str
    date: date_type
    time: str
    meeting_link: Optional[str] = None
    status: Optional[str] = "Pending Client"

class ConsultationReschedule(BaseModel):
    date: date_type
    time: str
    reason: Optional[str] = None
    status: Optional[str] = None

class ConsultationUpdateStatus(BaseModel):
    status: str

class ConsultationOut(BaseModel):
    id: int
    client_id: Optional[int]
    case_id: Optional[int] = None
    client_name: str
    
    date: date_type
    time: str
    type: str
    meeting_link: Optional[str]
    issue: Optional[str]
    fee: Optional[str]
    status: str
    duration: Optional[str]
    summary: Optional[str]
    reschedule_reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class ConsultationStats(BaseModel):
    total_consultations: int
    video_calls: int
    chat_consultations: int

# Meeting Notes Schemas
class MeetingNoteBase(BaseModel):
    title: str = "Consultation Meeting Note"
    meeting_date: date_type
    meeting_time: Optional[str] = None
    meeting_type: Optional[str] = "Video Call"
    client_name: Optional[str] = None
    case_title: Optional[str] = None
    case_no: Optional[str] = None
    summary: Optional[str] = None
    key_topics: Optional[str] = None
    action_items: Optional[List[Any]] = []
    legal_advice: Optional[str] = None
    internal_notes: Optional[str] = None
    is_confidential: Optional[bool] = False

class MeetingNoteCreate(MeetingNoteBase):
    consultation_id: Optional[int] = None
    case_id: Optional[int] = None
    advocate_id: Optional[int] = None
    client_id: Optional[int] = None

class MeetingNoteUpdate(BaseModel):
    consultation_id: Optional[int] = None
    case_id: Optional[int] = None
    title: Optional[str] = None
    meeting_date: Optional[date_type] = None
    meeting_time: Optional[str] = None
    meeting_type: Optional[str] = None
    client_name: Optional[str] = None
    case_title: Optional[str] = None
    case_no: Optional[str] = None
    summary: Optional[str] = None
    key_topics: Optional[str] = None
    action_items: Optional[List[Any]] = None
    legal_advice: Optional[str] = None
    internal_notes: Optional[str] = None
    is_confidential: Optional[bool] = None

class MeetingNoteOut(MeetingNoteBase):
    id: int
    consultation_id: Optional[int] = None
    case_id: Optional[int] = None
    advocate_id: Optional[int] = None
    client_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

