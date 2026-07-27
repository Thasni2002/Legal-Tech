from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class CNRLookupRequest(BaseModel):
    cnrNumber: str = Field(..., description="16-character unique CNR number e.g. KLAL010012342026")


class CaseSearchRequest(BaseModel):
    state: Optional[str] = None
    district: Optional[str] = None
    courtName: Optional[str] = None
    caseType: Optional[str] = None
    caseNumber: Optional[str] = None
    year: Optional[str] = None


class TimelineEvent(BaseModel):
    id: Optional[str] = None
    eventStage: str  # e.g., 'Case Filed', 'First Hearing', 'Adjourned', 'Order Uploaded', 'Judgment Passed'
    eventDate: str
    title: str
    description: str
    benchName: Optional[str] = "Hon'ble Presiding Judge"
    courtHall: Optional[str] = "Court Hall 1"
    documentUrl: Optional[str] = None
    status: Optional[str] = "Completed"


class OrderDocumentItem(BaseModel):
    id: str
    orderDate: str
    orderType: str  # e.g., 'Interim Order', 'Daily Order', 'Final Judgment', 'Notice'
    judgeName: str
    summary: str
    fileUrl: str
    fileSize: Optional[str] = "1.2 MB"


class eCourtsCaseDetails(BaseModel):
    cnrNumber: str
    caseTitle: str
    caseType: str
    caseNo: str
    filingDate: str
    registrationDate: str
    petitioner: str
    respondent: str
    petitionerAdvocate: str
    respondentAdvocate: str
    courtName: str
    courtType: str
    district: str
    state: str
    presidingJudge: str
    courtHall: str
    caseStage: str
    status: str
    nextHearingDate: Optional[str] = None
    timeline: List[TimelineEvent] = []
    orders: List[OrderDocumentItem] = []


class SyncCaseResponse(BaseModel):
    success: bool
    message: str
    caseId: int
    cnrNumber: Optional[str] = None
    updatedFields: Dict[str, Any] = {}
    details: Optional[eCourtsCaseDetails] = None


class CauseListRequest(BaseModel):
    courtName: Optional[str] = None
    date: Optional[str] = None
    advocateName: Optional[str] = None


class CauseListItem(BaseModel):
    id: str
    itemNo: int
    caseNo: str
    caseTitle: str
    petitioner: str
    respondent: str
    stage: str
    courtHall: str
    judgeName: str
    cnrNumber: str
    timeSlot: Optional[str] = "10:30 AM"


class eCourtsDashboardMetrics(BaseModel):
    todaysHearings: int
    upcomingHearings: int
    casesUpdatedToday: int
    ordersDownloaded: int
