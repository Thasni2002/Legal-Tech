from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class OrderCollectionBase(BaseModel):
    case_no: str
    case_title: str
    order_date: Optional[str] = None
    court_name: str
    order_type: Optional[str] = None
    cc_application_no: Optional[str] = None
    physical_copy_collected: Optional[bool] = False
    scanned_pdf_url: Optional[str] = None
    status: Optional[str] = "Awaiting Order"
    assigned_advocate_name: Optional[str] = None
    client_notified: Optional[bool] = False
    notes: Optional[str] = None

class OrderCollectionCreate(OrderCollectionBase):
    pass

class OrderCollectionUpdate(BaseModel):
    case_no: Optional[str] = None
    case_title: Optional[str] = None
    order_date: Optional[str] = None
    court_name: Optional[str] = None
    order_type: Optional[str] = None
    cc_application_no: Optional[str] = None
    physical_copy_collected: Optional[bool] = None
    scanned_pdf_url: Optional[str] = None
    status: Optional[str] = None
    assigned_advocate_name: Optional[str] = None
    client_notified: Optional[bool] = None
    notes: Optional[str] = None

class OrderCollectionOut(OrderCollectionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
