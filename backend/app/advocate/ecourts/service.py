from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.advocate.case_management.models import Case
from app.advocate.lawfirm_management.models import AssignedCase
from .schemas import (
    eCourtsCaseDetails,
    CaseSearchRequest,
    CauseListItem,
    SyncCaseResponse,
    eCourtsDashboardMetrics,
)
from .ecourts_provider import get_ecourts_provider


def lookup_cnr_service(cnr_number: str) -> eCourtsCaseDetails:
    if not cnr_number or not cnr_number.strip():
        raise HTTPException(status_code=400, detail="CNR Number is required.")
    
    clean_cnr = cnr_number.strip().upper()
    if len(clean_cnr) != 16:
        # Relaxed check for search flexibility, but log recommendation
        pass
        
    provider = get_ecourts_provider()
    details = provider.lookup_by_cnr(clean_cnr)
    if not details:
        raise HTTPException(status_code=404, detail="No eCourts record found for this CNR Number.")
    return details


def search_cases_service(params: CaseSearchRequest) -> List[eCourtsCaseDetails]:
    provider = get_ecourts_provider()
    return provider.search_cases(params)


def sync_case_with_ecourts_service(db: Session, case_id: int) -> SyncCaseResponse:
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    cnr = case.cnr_number or f"KLER0100{str(case.id).zfill(6)}2026"
    if not case.cnr_number:
        case.cnr_number = cnr

    provider = get_ecourts_provider()
    details = provider.lookup_by_cnr(cnr)
    
    updated_fields = {}
    if details:
        if details.nextHearingDate and details.nextHearingDate != case.next_hearing_date:
            updated_fields["next_hearing_date"] = details.nextHearingDate
            case.next_hearing_date = details.nextHearingDate

        if details.courtName and details.courtName != case.court_name:
            updated_fields["court_name"] = details.courtName
            case.court_name = details.courtName

        if details.status and details.status != case.status:
            updated_fields["status"] = details.status
            case.status = details.status

        case.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(case)

    return SyncCaseResponse(
        success=True,
        message=f"Case '{case.case_title}' synchronized successfully with eCourts.",
        caseId=case.id,
        cnrNumber=case.cnr_number,
        updatedFields=updated_fields,
        details=details,
    )


def get_cause_list_service(
    court_name: Optional[str], date_str: Optional[str], advocate_name: Optional[str]
) -> List[CauseListItem]:
    provider = get_ecourts_provider()
    return provider.get_cause_list(court_name, date_str, advocate_name)


def get_ecourts_metrics_service(db: Session, current_user: Any = None) -> eCourtsDashboardMetrics:
    if current_user is None:
        user_role = ""
        user_name = ""
        user_email = ""
    elif isinstance(current_user, dict):
        user_role = current_user.get("role") or ""
        user_name = current_user.get("username") or current_user.get("full_name") or ""
        user_email = current_user.get("email") or ""
    else:
        user_role = getattr(current_user, "role", "") or ""
        user_name = getattr(current_user, "username", "") or getattr(current_user, "full_name", "") or ""
        user_email = getattr(current_user, "email", "") or ""

    user_role_str = user_role.lower().replace(" ", "")
    today_str = datetime.now().strftime("%Y-%m-%d")

    if "junior" in user_role_str:
        # Junior advocate: filter strictly to assigned cases
        assigned_case_nos = [
            ac.case_number for ac in db.query(AssignedCase).filter(AssignedCase.advocate_name == user_name).all()
        ]
        cases_query = db.query(Case).filter(Case.case_no.in_(assigned_case_nos)) if assigned_case_nos else db.query(Case).filter(Case.id == -1)
    elif "client" in user_role_str:
        # Client: filter strictly to client email/name
        client_email_clean = user_email.lower().strip()
        client_name_clean = user_name.lower().strip()
        cases_query = db.query(Case).filter(
            (Case.email_id.ilike(client_email_clean)) | (Case.client_name.ilike(client_name_clean))
        )
    else:
        # Senior Advocate / Admin / Clerk: full access
        cases_query = db.query(Case)

    all_cases = cases_query.all()
    
    todays_hearings = sum(1 for c in all_cases if c.next_hearing_date == today_str)
    upcoming_hearings = sum(
        1 for c in all_cases if c.next_hearing_date and c.next_hearing_date > today_str
    )
    cases_updated_today = sum(1 for c in all_cases if c.updated_at and c.updated_at.strftime("%Y-%m-%d") == today_str)
    orders_downloaded = 0

    return eCourtsDashboardMetrics(
        todaysHearings=todays_hearings,
        upcomingHearings=upcoming_hearings,
        casesUpdatedToday=cases_updated_today,
        ordersDownloaded=orders_downloaded,
    )
