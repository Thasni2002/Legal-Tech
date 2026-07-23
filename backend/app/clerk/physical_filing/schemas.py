from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PhysicalFilingBase(BaseModel):
    case_number: str
    client_name: str
    advocate_name: Optional[str] = None
    court_name: str
    filing_type: Optional[str] = None
    filing_date: Optional[str] = None
    documents_checklist: Optional[str] = None
    court_fee_paid: Optional[float] = 0.0
    stamp_duty: Optional[float] = 0.0
    filing_status: Optional[str] = "Pending"
    filing_receipt_url: Optional[str] = None
    diary_sr_number: Optional[str] = None
    notes: Optional[str] = None

class PhysicalFilingCreate(PhysicalFilingBase):
    pass

class PhysicalFilingUpdate(BaseModel):
    case_number: Optional[str] = None
    client_name: Optional[str] = None
    advocate_name: Optional[str] = None
    court_name: Optional[str] = None
    filing_type: Optional[str] = None
    filing_date: Optional[str] = None
    documents_checklist: Optional[str] = None
    court_fee_paid: Optional[float] = None
    stamp_duty: Optional[float] = None
    filing_status: Optional[str] = None
    filing_receipt_url: Optional[str] = None
    diary_sr_number: Optional[str] = None
    notes: Optional[str] = None

class PhysicalFilingOut(PhysicalFilingBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
