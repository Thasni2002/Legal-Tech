from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NextPostingBase(BaseModel):
    case_id: Optional[int] = None
    case_no: str
    case_title: str
    court_name: Optional[str] = None
    court_hall: Optional[str] = None
    judge_name: Optional[str] = None
    next_hearing_date: str
    hearing_time: Optional[str] = None
    hearing_purpose: Optional[str] = None
    item_number: Optional[str] = None
    posting_order_url: Optional[str] = None
    notify_senior: Optional[bool] = True
    notify_junior: Optional[bool] = True
    notify_client: Optional[bool] = True
    notes: Optional[str] = None

class NextPostingCreate(NextPostingBase):
    pass

class NextPostingUpdate(BaseModel):
    case_id: Optional[int] = None
    case_no: Optional[str] = None
    case_title: Optional[str] = None
    court_name: Optional[str] = None
    court_hall: Optional[str] = None
    judge_name: Optional[str] = None
    next_hearing_date: Optional[str] = None
    hearing_time: Optional[str] = None
    hearing_purpose: Optional[str] = None
    item_number: Optional[str] = None
    posting_order_url: Optional[str] = None
    notify_senior: Optional[bool] = None
    notify_junior: Optional[bool] = None
    notify_client: Optional[bool] = None
    notes: Optional[str] = None

class NextPostingOut(NextPostingBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
