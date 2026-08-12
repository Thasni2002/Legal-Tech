from typing import Optional, List
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Query
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.database import get_db
from app.advocate.tasks.routes import get_current_user
from .schemas import (
    CNRLookupRequest,
    CaseSearchRequest,
    eCourtsCaseDetails,
    SyncCaseResponse,
    CauseListItem,
    eCourtsDashboardMetrics,
    SimilarCaseRequest,
    SimilarCasesResponse,
)
from .service import (
    lookup_cnr_service,
    search_cases_service,
    sync_case_with_ecourts_service,
    sync_all_cases_service,
    get_cause_list_service,
    get_ecourts_metrics_service,
)


router = APIRouter(
    prefix="/api/ecourts",
    tags=["eCourts Integration"]
)


@router.get("/metrics", response_model=eCourtsDashboardMetrics)
def get_ecourts_metrics(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return get_ecourts_metrics_service(db, current_user)


@router.post("/lookup", response_model=eCourtsCaseDetails)
def lookup_cnr(data: CNRLookupRequest, db: Session = Depends(get_db)):
    return lookup_cnr_service(data.cnrNumber, db)


@router.post("/search", response_model=List[eCourtsCaseDetails])
def search_cases(data: CaseSearchRequest, db: Session = Depends(get_db)):
    return search_cases_service(data, db)


@router.post("/sync-all")
def sync_all_cases(
    db: Session = Depends(get_db)
):
    """Sync all active cases with CNR numbers against eCourts API in one shot."""
    return sync_all_cases_service(db)


@router.post("/sync/{case_id}", response_model=SyncCaseResponse)
def sync_case(
    case_id: int,
    db: Session = Depends(get_db)
):
    return sync_case_with_ecourts_service(db, case_id)


@router.get("/cause-list", response_model=List[CauseListItem])
def get_cause_list(
    court_name: Optional[str] = Query(None, alias="courtName"),
    date_str: Optional[str] = Query(None, alias="date"),
    advocate_name: Optional[str] = Query(None, alias="advocateName"),
    db: Session = Depends(get_db)
):
    return get_cause_list_service(court_name, date_str, advocate_name, db)


@router.post("/similar-cases", response_model=SimilarCasesResponse)
def get_similar_cases(
    data: SimilarCaseRequest,
    db: Session = Depends(get_db),
):
    """
    Fetches similar historical cases from:
    1. Internal firm DB (filtered by case_type)
    2. Live eCourts API (search by case_type)
    Each result is analysed by Gemini AI to extract outcome, loopholes,
    main argument, and important sections/acts.
    """
    from .service import get_similar_cases_service
    return get_similar_cases_service(db, data)

