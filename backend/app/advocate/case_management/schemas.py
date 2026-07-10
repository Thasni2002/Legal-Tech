from pydantic import BaseModel
from typing import Optional, List


# Document Schema
class DocumentSchema(BaseModel):
    documentType: str
    advocate: str
    file: Optional[str] = None
    url: Optional[str] = None
    password: Optional[str] = None



# Create Case Schema
class CaseCreate(BaseModel):
    caseId: str
    cnrNumber: Optional[str] = None
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
    nextHearingDate: Optional[str] = None


# Update Case Schema
class CaseUpdate(BaseModel):
    caseId: Optional[str] = None
    cnrNumber: Optional[str] = None
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
    nextHearingDate: Optional[str] = None


# Response Schema
class CaseResponse(CaseCreate):
    id: int

    class Config:
        from_attributes = True

# AI Assistant Schema
class AIAssistantRequest(BaseModel):
    query: str
    role: Optional[str] = None
    advocateName: Optional[str] = None


# Format Document Generation Schema
class FormatDocumentRequest(BaseModel):
    case_id: int
    template_key: str
    draft_text: str