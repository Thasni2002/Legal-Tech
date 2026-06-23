from pydantic import BaseModel
from typing import Optional, List


# Document Schema
class DocumentSchema(BaseModel):
    documentType: str
    advocate: str
    file: Optional[str] = None


# Create Case Schema
class CaseCreate(BaseModel):
    caseId: str
    caseTitle: str
    caseNo: str
    caseType: str
    caseDes: str

    clientName: str
    contactNumber: str
    emailId: str

    courtName: str
    courtType: str

    status: str

    selectedAdvocate: Optional[str] = None
    documents: Optional[List[DocumentSchema]] = []


# Update Case Schema
class CaseUpdate(BaseModel):
    caseId: Optional[str] = None
    caseTitle: Optional[str] = None
    caseNo: Optional[str] = None
    caseType: Optional[str] = None
    caseDes: Optional[str] = None

    clientName: Optional[str] = None
    contactNumber: Optional[str] = None
    emailId: Optional[str] = None

    courtName: Optional[str] = None
    courtType: Optional[str] = None

    status: Optional[str] = None

    selectedAdvocate: Optional[str] = None
    documents: Optional[List[DocumentSchema]] = []


# Response Schema
class CaseResponse(CaseCreate):
    id: int

    class Config:
        from_attributes = True