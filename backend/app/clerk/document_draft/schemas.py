from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ClerkDocumentDraftBase(BaseModel):
    template_type: Optional[str] = "vakalatnama"
    client_name: Optional[str] = "John Doe"
    advocate_name: Optional[str] = "Adv. K. R. Ram"
    case_title: Optional[str] = "John Doe v. State of Kerala"
    court_name: Optional[str] = "District Court, Ernakulam"
    batta_fee: Optional[str] = "50"
    mode_of_summons: Optional[str] = "Registered Post with AD"
    number_of_summons: Optional[str] = "1"
    content: Optional[str] = None

class ClerkDocumentDraftCreate(ClerkDocumentDraftBase):
    pass

class ClerkDocumentDraftUpdate(BaseModel):
    template_type: Optional[str] = None
    client_name: Optional[str] = None
    advocate_name: Optional[str] = None
    case_title: Optional[str] = None
    court_name: Optional[str] = None
    batta_fee: Optional[str] = None
    mode_of_summons: Optional[str] = None
    number_of_summons: Optional[str] = None
    content: Optional[str] = None

class ClerkDocumentDraftOut(ClerkDocumentDraftBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
