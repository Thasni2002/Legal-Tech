from pydantic import BaseModel

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


class CaseResponse(CaseCreate):
    id: int

    class Config:
        from_attributes = True