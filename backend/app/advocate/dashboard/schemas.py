from pydantic import BaseModel
from typing import List, Optional


class DashboardStats(BaseModel):
    total_advocates: int
    active_cases: int
    pending_cases: int
    closed_cases: int
    upcoming_hearings_count: int

class DashboardCase(BaseModel):
    case_no: str
    client_name: str
    type: str
    court: str
    status: str

    class Config:
        from_attributes = True

class DashboardHearing(BaseModel):
    date: str
    case_title: str
    court: str
    advocate_name: str
    time: str

    class Config:
        from_attributes = True

class DashboardActivity(BaseModel):
    title: str
    timestamp_str: str
    type: str

    class Config:
        from_attributes = True

class DashboardDocument(BaseModel):
    filename: str
    case_no: Optional[str] = None

    class Config:
        from_attributes = True

class DashboardResponse(BaseModel):
    stats: DashboardStats
    cases: List[DashboardCase]
    hearings: List[DashboardHearing]
    activities: List[DashboardActivity]
    documents: List[DashboardDocument]
