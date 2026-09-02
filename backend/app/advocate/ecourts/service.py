from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy import or_
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.advocate.case_management.models import Case, CaseNote, CaseDocumentWorkflow
from app.advocate.lawfirm_management.models import AssignedCase
from .schemas import (
    eCourtsCaseDetails,
    CaseSearchRequest,
    SimilarCaseRequest,
    CauseListItem,
    SyncCaseResponse,
    eCourtsDashboardMetrics,
    SimilarCasesResponse,
    CaseAnalysisResult,
    TimelineEvent,
    OrderDocumentItem,
)
from .ecourts_provider import get_ecourts_provider


def lookup_cnr_service(cnr_number: str, db: Optional[Session] = None) -> eCourtsCaseDetails:
    if not cnr_number or not cnr_number.strip():
        raise HTTPException(status_code=400, detail="CNR Number is required.")
    
    clean_cnr = cnr_number.strip().upper()

    # 1. Query Live eCourts Provider FIRST (Live API / Portal / CNR Decoder)
    provider = get_ecourts_provider()
    live_details = None
    try:
        live_details = provider.lookup_by_cnr(clean_cnr)
    except Exception as live_err:
        print(f"[eCourts] Live lookup note: {live_err}")

    case_id_match = None
    if clean_cnr.startswith("KLER0100") and clean_cnr.endswith("2026") and len(clean_cnr) == 18:
        try:
            case_id_match = int(clean_cnr[8:14])
        except ValueError:
            pass

    # 2. Check if local database record exists to merge system notes & document workflows
    local_case = None
    if db:
        filters = [
            Case.cnr_number == clean_cnr,
            Case.case_no.ilike(f"%{clean_cnr}%"),
        ]
        if clean_cnr.isdigit():
            filters.append(Case.id == int(clean_cnr))
        if case_id_match is not None:
            filters.append(Case.id == case_id_match)

        local_case = db.query(Case).filter(or_(*filters)).first()

    # If we have live details, use live eCourts data as the primary authority
    if live_details:
        if local_case:
            # Merge local system timeline events, case notes & document workflows into live_details
            timeline = list(live_details.timeline) if live_details.timeline else []
            if not timeline:
                timeline.append(
                    TimelineEvent(
                        id="1",
                        eventStage="Filing & Registration",
                        eventDate=getattr(local_case, "filing_date", None) or (local_case.created_at.strftime("%d-%m-%Y") if local_case.created_at else ""),
                        title="Case Registered in System",
                        description=f"Case '{local_case.case_no or local_case.case_title}' registered under {local_case.court_name or 'Court'}",
                        benchName=getattr(local_case, "presiding_judge", None) or "Presiding Officer",
                        courtHall=getattr(local_case, "court_hall", None) or "Court Hall 01",
                        status="Completed"
                    )
                )

            # Fetch REAL Case Notes / Proceeding updates
            notes = db.query(CaseNote).filter(CaseNote.case_id == local_case.id).order_by(CaseNote.created_at.asc()).all()
            for idx, note in enumerate(notes, start=len(timeline) + 1):
                timeline.append(TimelineEvent(
                    id=str(idx),
                    eventStage=note.category or "Advocate Proceeding Log",
                    eventDate=note.created_at.strftime("%d-%m-%Y") if note.created_at else "",
                    title=f"Update: {note.category or 'Case Proceeding'}",
                    description=note.text,
                    benchName=note.author or "Advocate Counsel",
                    courtHall="Court Hall",
                    status="Completed"
                ))

            # Fetch REAL Case Document Workflows / Petitions
            workflows = db.query(CaseDocumentWorkflow).filter(CaseDocumentWorkflow.case_id == local_case.id).order_by(CaseDocumentWorkflow.created_at.asc()).all()
            orders = list(live_details.orders) if live_details.orders else []

            for idx, wf in enumerate(workflows, start=len(timeline) + 1):
                timeline.append(TimelineEvent(
                    id=str(idx),
                    eventStage=wf.document_type or "Document Filing",
                    eventDate=wf.created_at.strftime("%d-%m-%Y") if wf.created_at else "",
                    title=f"Filing: {wf.title}",
                    description=f"{wf.document_type} status: {wf.status}. Prepared by advocate.",
                    benchName="Court Bench",
                    courtHall="Court Hall",
                    status="Completed" if wf.status == "Approved" else "Pending"
                ))

                if wf.file_url or wf.status == "Approved":
                    orders.append(OrderDocumentItem(
                        id=str(wf.id),
                        orderDate=wf.created_at.strftime("%d-%m-%Y") if wf.created_at else "",
                        orderType=wf.document_type or "Court Document",
                        judgeName=getattr(local_case, "court_name", "Court Bench"),
                        summary=wf.title,
                        fileUrl=wf.file_url or "#",
                        fileSize="Document File"
                    ))

            if not orders and live_details.timeline:
                for idx, t in enumerate(live_details.timeline, start=1):
                    if t.eventDate and t.eventStage != "Next Scheduled Hearing":
                        orders.append(OrderDocumentItem(
                            id=f"ord-{idx}",
                            orderDate=t.eventDate,
                            orderType=f"{t.eventStage} Order" if "Order" not in t.eventStage else t.eventStage,
                            judgeName=t.benchName or "Hon'ble Presiding Judge",
                            summary=f"Court proceeding record & daily order for {t.title}",
                            fileUrl=t.documentUrl or "",
                            fileSize="1.2 MB"
                        ))

            if not orders:
                try:
                    fb_info = provider._parse_cnr_fallback(clean_cnr)
                    if fb_info and fb_info.orders:
                        orders = list(fb_info.orders)
                except Exception:
                    pass

            live_details.timeline = timeline
            live_details.orders = orders

            if local_case.client_name:
                live_details.petitioner = local_case.client_name
            if getattr(local_case, "opposite_party", None):
                live_details.respondent = local_case.opposite_party
            elif local_case.case_title and (" vs" in local_case.case_title.lower() or " v." in local_case.case_title.lower()):
                import re
                parts = re.split(r'\s+(?:vs\.?|v\.?)\s+', local_case.case_title, flags=re.I)
                if len(parts) > 1 and parts[1].strip():
                    live_details.respondent = parts[1].strip()

            if live_details.petitioner and live_details.respondent:
                live_details.caseTitle = f"{live_details.petitioner} vs. {live_details.respondent}"

            if not live_details.nextHearingDate and local_case.next_hearing_date:
                live_details.nextHearingDate = local_case.next_hearing_date

            if not live_details.caseNo:
                live_details.caseNo = local_case.case_no or f"Case #{local_case.id}"

        return live_details

    # If live_details failed and local_case exists, return local_case data as fallback
    if local_case:
        derived_respondent = ""
        if local_case.case_title and (" vs" in local_case.case_title.lower() or " v." in local_case.case_title.lower()):
            import re
            parts = re.split(r'\s+(?:vs\.?|v\.?)\s+', local_case.case_title, flags=re.I)
            if len(parts) > 1:
                derived_respondent = parts[1].strip()

        timeline = [
            TimelineEvent(
                id="1",
                eventStage="Filing & Registration",
                eventDate=getattr(local_case, "filing_date", None) or (local_case.created_at.strftime("%d-%m-%Y") if local_case.created_at else ""),
                title="Case Registered in System",
                description=f"Case '{local_case.case_no or local_case.case_title}' registered under {local_case.court_name or 'Court'}",
                benchName=getattr(local_case, "presiding_judge", None) or "Presiding Officer",
                courtHall=getattr(local_case, "court_hall", None) or "Court Hall 01",
                status="Completed"
            )
        ]

        notes = db.query(CaseNote).filter(CaseNote.case_id == local_case.id).order_by(CaseNote.created_at.asc()).all()
        for idx, note in enumerate(notes, start=len(timeline) + 1):
            timeline.append(TimelineEvent(
                id=str(idx),
                eventStage=note.category or "Advocate Proceeding Log",
                eventDate=note.created_at.strftime("%d-%m-%Y") if note.created_at else "",
                title=f"Update: {note.category or 'Case Proceeding'}",
                description=note.text,
                benchName=note.author or "Advocate Counsel",
                courtHall="Court Hall",
                status="Completed"
            ))

        workflows = db.query(CaseDocumentWorkflow).filter(CaseDocumentWorkflow.case_id == local_case.id).order_by(CaseDocumentWorkflow.created_at.asc()).all()
        orders = []

        for idx, wf in enumerate(workflows, start=len(timeline) + 1):
            timeline.append(TimelineEvent(
                id=str(idx),
                eventStage=wf.document_type or "Document Filing",
                eventDate=wf.created_at.strftime("%d-%m-%Y") if wf.created_at else "",
                title=f"Filing: {wf.title}",
                description=f"{wf.document_type} status: {wf.status}. Prepared by advocate.",
                benchName="Court Bench",
                courtHall="Court Hall",
                status="Completed" if wf.status == "Approved" else "Pending"
            ))

            if wf.file_url or wf.status == "Approved":
                orders.append(OrderDocumentItem(
                    id=str(wf.id),
                    orderDate=wf.created_at.strftime("%d-%m-%Y") if wf.created_at else "",
                    orderType=wf.document_type or "Court Document",
                    judgeName=getattr(local_case, "court_name", "Court Bench"),
                    summary=wf.title,
                    fileUrl=wf.file_url or "#",
                    fileSize="Document File"
                ))

        next_date = local_case.next_hearing_date
        if next_date:
            timeline.append(TimelineEvent(
                id=str(len(timeline) + 1),
                eventStage="Next Scheduled Hearing",
                eventDate=next_date,
                title=f"Scheduled Hearing ({getattr(local_case, 'status', 'Pending')})",
                description=f"Listed before {local_case.court_name or 'Presiding Court'} for case proceedings.",
                benchName=getattr(local_case, "presiding_judge", None) or "Presiding Officer",
                courtHall=getattr(local_case, "court_hall", None) or "Court Hall 01",
                status="Scheduled"
            ))

        orders.reverse()

        return eCourtsCaseDetails(
            cnrNumber=local_case.cnr_number or clean_cnr,
            caseTitle=local_case.case_title,
            caseType=local_case.case_type or "Legal Case",
            caseNo=local_case.case_no or f"Case #{local_case.id}",
            filingDate=getattr(local_case, "filing_date", None) or "",
            registrationDate=local_case.created_at.strftime("%d-%m-%Y") if local_case.created_at else "",
            petitioner=local_case.client_name or "Petitioner",
            respondent=derived_respondent or "State / Respondent",
            petitionerAdvocate=local_case.selected_advocate or "Advocate (On Record)",
            respondentAdvocate="Government Pleader / Opposing Counsel",
            courtName=local_case.court_name or "District Court",
            courtType=getattr(local_case, "court_type", None) or "District & Sessions Court",
            district=getattr(local_case, "district", None) or "",
            state=getattr(local_case, "state", None) or "",
            presidingJudge=getattr(local_case, "presiding_judge", None) or "",
            courtHall=getattr(local_case, "court_hall", None) or "",
            caseStage=getattr(local_case, "stage", None) or "Hearing Stage",
            status=local_case.status or "PENDING",
            actSection=getattr(local_case, "act_section", None) or "",
            nextHearingDate=next_date or "",
            timeline=timeline,
            orders=orders
        )

    # 3. Strict Real-Data Enforcement: Return 404 if not found in live portal or database
    raise HTTPException(
        status_code=404, 
        detail=f"No official eCourts or registered advocate case found for CNR '{clean_cnr}'. Please verify the CNR number or register the case under Case Management."
    )


def search_cases_service(params: CaseSearchRequest, db: Optional[Session] = None) -> List[eCourtsCaseDetails]:
    results = []

    # Query REAL Advocate Database cases
    if db:
        q_term = (params.caseNumber or params.caseType or "").strip()
        if q_term:
            q_filter = f"%{q_term}%"
            local_matches = db.query(Case).filter(
                (Case.case_title.ilike(q_filter)) |
                (Case.case_no.ilike(q_filter)) |
                (Case.cnr_number.ilike(q_filter)) |
                (Case.client_name.ilike(q_filter)) |
                (Case.case_type.ilike(q_filter))
            ).all()

            for c in local_matches:
                results.append(
                    eCourtsCaseDetails(
                        cnrNumber=c.cnr_number or f"KLER0100{str(c.id).zfill(6)}2026",
                        caseTitle=c.case_title,
                        caseType=c.case_type or "Legal Case",
                        caseNo=c.case_no or f"Case #{c.id}",
                        filingDate=c.filing_date or "",
                        registrationDate=c.created_at.strftime("%d-%m-%Y") if c.created_at else "",
                        petitioner=c.client_name or "Petitioner",
                        respondent=c.opposite_party or "Respondent",
                        petitionerAdvocate=c.advocate_name or "Advocate",
                        respondentAdvocate="Opposite Counsel",
                        courtName=c.court_name or "District Court",
                        courtType=c.court_type or "District Court",
                        district=c.district or "",
                        state=c.state or "",
                        presidingJudge=c.presiding_judge or "",
                        courtHall=c.court_hall or "",
                        caseStage=c.stage or "Hearing Stage",
                        status=c.status or "PENDING",
                        nextHearingDate=c.next_hearing_date or "",
                        timeline=[],
                        orders=[]
                    )
                )

    # Combine with Live Provider results if available
    provider = get_ecourts_provider()
    live_results = provider.search_cases(params)
    for lr in live_results:
        if not any(r.cnrNumber == lr.cnrNumber for r in results):
            results.append(lr)

    return results


def sync_case_with_ecourts_service(db: Session, case_id: int) -> SyncCaseResponse:
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found in system database.")

    cnr = case.cnr_number or f"KLER0100{str(case.id).zfill(6)}2026"
    if not case.cnr_number:
        case.cnr_number = cnr

    provider = get_ecourts_provider()
    details = provider.lookup_by_cnr(cnr)
    
    updated_fields = {}
    if details:
        if details.caseTitle and details.caseTitle != case.case_title:
            updated_fields["case_title"] = details.caseTitle
            case.case_title = details.caseTitle

        if details.nextHearingDate and details.nextHearingDate != case.next_hearing_date:
            updated_fields["next_hearing_date"] = details.nextHearingDate
            case.next_hearing_date = details.nextHearingDate

        if details.courtName and details.courtName != case.court_name:
            updated_fields["court_name"] = details.courtName
            case.court_name = details.courtName

        if details.status and details.status != case.status:
            updated_fields["status"] = details.status
            case.status = details.status

            try:
                from app.advocate.lawfirm_management.models import AssignedCase
                assigned_records = db.query(AssignedCase).filter(
                    (AssignedCase.case_id == case.id) |
                    (AssignedCase.case_number == case.case_no)
                ).all()
                for ac in assigned_records:
                    ac.status = details.status
            except Exception as sync_ac_err:
                print(f"Warning: Failed to sync eCourts status to assigned_cases: {sync_ac_err}")

        if details and not details.orders:
            if details.timeline:
                mapped_orders = []
                for idx, t in enumerate(details.timeline, start=1):
                    if t.eventDate and t.eventStage != "Next Scheduled Hearing":
                        mapped_orders.append(OrderDocumentItem(
                            id=f"ord-{idx}",
                            orderDate=t.eventDate,
                            orderType=f"{t.eventStage} Order" if "Order" not in t.eventStage else t.eventStage,
                            judgeName=t.benchName or "Hon'ble Presiding Judge",
                            summary=f"Court proceeding record & daily order for {t.title}",
                            fileUrl=t.documentUrl or "",
                            fileSize="1.2 MB"
                        ))
                if mapped_orders:
                    details.orders = mapped_orders

            if not details.orders:
                try:
                    fb = provider._parse_cnr_fallback(cnr)
                    if fb and fb.orders:
                        details.orders = fb.orders
                except Exception as fb_err:
                    print(f"[eCourts] Sync orders fallback note: {fb_err}")

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


def sync_all_cases_service(db: Session) -> dict:
    """
    Sync all active cases (with CNR numbers) against the eCourts API.
    Returns a summary of how many cases were synced and what was updated.
    """
    active_cases = db.query(Case).filter(
        Case.status.in_(["Active", "Hearing", "PENDING", "Pending"])
    ).all()

    total = len(active_cases)
    synced = 0
    updated = 0
    failed = 0
    results = []

    provider = get_ecourts_provider()

    for case in active_cases:
        cnr = case.cnr_number
        if not cnr:
            continue  # skip cases without CNR — nothing to sync

        try:
            details = provider.lookup_by_cnr(cnr)
            case_updated_fields = []

            if details:
                if details.nextHearingDate and details.nextHearingDate != case.next_hearing_date:
                    case.next_hearing_date = details.nextHearingDate
                    case_updated_fields.append("next_hearing_date")

                if details.courtName and details.courtName != case.court_name:
                    case.court_name = details.courtName
                    case_updated_fields.append("court_name")

                if details.status and details.status != case.status:
                    case.status = details.status
                    case_updated_fields.append("status")
                    # Also sync to assigned cases
                    try:
                        assigned_records = db.query(AssignedCase).filter(
                            (AssignedCase.case_id == case.id) |
                            (AssignedCase.case_number == case.case_no)
                        ).all()
                        for ac in assigned_records:
                            ac.status = details.status
                    except Exception:
                        pass

                if case_updated_fields:
                    case.updated_at = datetime.utcnow()
                    updated += 1

                synced += 1
                results.append({
                    "case_id": case.id,
                    "case_title": case.case_title,
                    "cnr": cnr,
                    "updated_fields": case_updated_fields,
                    "next_hearing_date": case.next_hearing_date or "",
                    "status": "synced",
                })
            else:
                results.append({
                    "case_id": case.id,
                    "case_title": case.case_title,
                    "cnr": cnr,
                    "updated_fields": [],
                    "next_hearing_date": case.next_hearing_date or "",
                    "status": "no_data",
                })
        except Exception as e:
            failed += 1
            results.append({
                "case_id": case.id,
                "case_title": case.case_title,
                "cnr": cnr,
                "updated_fields": [],
                "next_hearing_date": case.next_hearing_date or "",
                "status": f"error: {str(e)[:80]}",
            })

    try:
        db.commit()
    except Exception as commit_err:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save sync results: {commit_err}")

    return {
        "success": True,
        "message": f"Sync complete. {synced} of {total} active cases synced. {updated} updated.",
        "total_active": total,
        "synced": synced,
        "updated": updated,
        "failed": failed,
        "results": results,
    }


def get_cause_list_service(
    court_name: Optional[str], 
    date_str: Optional[str], 
    advocate_name: Optional[str],
    db: Optional[Session] = None
) -> List[CauseListItem]:
    cause_list_items = []
    
    # 1. Query REAL database cases scheduled for this court / date / advocate
    if db:
        query = db.query(Case)
        if court_name and court_name.strip():
            query = query.filter(Case.court_name.ilike(f"%{court_name.strip()}%"))
        if date_str and date_str.strip():
            query = query.filter(Case.next_hearing_date == date_str.strip())
        if advocate_name and advocate_name.strip():
            query = query.filter(Case.advocate_name.ilike(f"%{advocate_name.strip()}%"))
            
        local_cases = query.all()
        for idx, c in enumerate(local_cases):
            cause_list_items.append(
                CauseListItem(
                    id=str(c.id),
                    itemNo=idx + 1,
                    caseNo=c.case_no or f"Case #{c.id}",
                    caseTitle=c.case_title,
                    petitioner=c.client_name or "Petitioner",
                    respondent=c.opposite_party or "Respondent",
                    stage=c.stage or "Hearing Stage",
                    courtHall=c.court_hall or "Court Hall 01",
                    judgeName=c.presiding_judge or "Presiding Officer",
                    cnrNumber=c.cnr_number or f"CNR{str(c.id).zfill(12)}",
                    timeSlot="10:30 AM"
                )
            )

    # 2. Add Live Cause List items if provider returns live results
    provider = get_ecourts_provider()
    live_items = provider.get_cause_list(court_name, date_str, advocate_name)
    for item in live_items:
        if not any(c.caseNo == item.caseNo for c in cause_list_items):
            cause_list_items.append(item)

    return cause_list_items


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


# ─────────────────────────────────────────────────────────────────────────────
# Similar Case History Service
# ─────────────────────────────────────────────────────────────────────────────

# ─────────────────────────────────────────────────────────────────────────────
# Similar Case History Service & AI Case Analysis
# ─────────────────────────────────────────────────────────────────────────────

def _compute_similarity_details(
    target_type: str,
    target_court: str,
    target_title: str,
    target_desc: str,
    candidate_type: str,
    candidate_court: str,
    candidate_title: str,
    candidate_desc: str
) -> tuple:
    """
    Computes a realistic 0-100 similarity score based on legal attributes:
    - Case type / category match (up to 40%)
    - Court / jurisdiction match (up to 25%)
    - Title / subject matter keyword overlap (up to 20%)
    - Description / factual keyword overlap (up to 15%)
    Returns (score: int, reasons: List[str]).
    """
    score = 0
    reasons = []

    ttype = (target_type or "").strip().lower()
    ctype = (candidate_type or "").strip().lower()

    if ttype and ctype:
        if ttype == ctype:
            score += 40
            reasons.append(f"Matching case category ({target_type})")
        else:
            t_words = set(ttype.split())
            c_words = set(ctype.split())
            overlap = t_words & c_words
            if overlap:
                ratio = len(overlap) / max(len(t_words | c_words), 1)
                pts = int(ratio * 35)
                if pts > 0:
                    score += pts
                    reasons.append(f"Similar legal category ({candidate_type})")

    tcourt = (target_court or "").strip().lower()
    ccourt = (candidate_court or "").strip().lower()

    if tcourt and ccourt:
        if tcourt == ccourt:
            score += 25
            reasons.append(f"Same court jurisdiction ({target_court})")
        elif (tcourt[:10] in ccourt or ccourt[:10] in tcourt) and len(tcourt) > 4:
            score += 15
            reasons.append("Matching judicial forum level")

    ttitle = (target_title or "").strip().lower()
    ctitle = (candidate_title or "").strip().lower()
    if ttitle and ctitle:
        stopwords = {"vs", "v", "and", "the", "in", "of", "re", "matter", "case", "petition", "vs.", "services", "pvt", "ltd"}
        t_title_words = set(ttitle.split()) - stopwords
        c_title_words = set(ctitle.split()) - stopwords
        overlap = t_title_words & c_title_words
        if len(overlap) >= 2:
            score += 20
            reasons.append("Similar legal issue & subject matter")
        elif len(overlap) == 1:
            score += 10
            reasons.append("Related legal dispute subject")

    tdesc = (target_desc or "").strip().lower()
    cdesc = (candidate_desc or "").strip().lower()
    if tdesc and cdesc:
        t_desc_words = set(tdesc.split())
        c_desc_words = set(cdesc.split())
        overlap = t_desc_words & c_desc_words
        if len(overlap) >= 3:
            score += 15
            reasons.append("Similar factual circumstances & legal pleadings")

    final_score = min(100, score)
    if final_score < 15:
        final_score = 0

    return final_score, reasons


def _analyse_case_with_gemini(
    case_title: str,
    case_type: str,
    status: str,
    description: str,
    petitioner: str,
    respondent: str,
    court_name: str = "",
) -> dict:
    """Use Gemini AI to extract DYNAMIC outcome, loopholes, main argument, and key sections for each specific case."""
    import os
    import json
    import re
    import google.generativeai as genai
    from dotenv import load_dotenv

    ctype = case_type or "Legal Case"
    ctitle = case_title or "Dispute"
    pet = petitioner or "Petitioner"
    resp = respondent or "Respondent"

    dynamic_fallback = {
        "outcome": _map_status_to_outcome(status),
        "outcomeDetail": f"{ctitle} — Proceeding status recorded as {status} in {court_name or 'Court'}.",
        "mainArgument": f"Legal argument under {ctype} regarding rights of {pet} against {resp}.",
        "loopholes": [
            f"Verification of statutory pre-notice timeline compliance in {ctype}",
            f"Admissibility of primary documentary evidence produced by {pet}",
            f"Jurisdictional validity and limitation period compliance for {ctitle}",
        ],
        "importantSections": [f"{ctype} Section 1", "Indian Evidence Act Sec 65B"],
    }

    load_dotenv()
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        return dynamic_fallback

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")

        prompt = f"""You are an expert Indian Senior Advocate legal advisor. Analyze the specific court case below and generate a DYNAMIC, CASE-SPECIFIC legal analysis in JSON format.

Case Title: {ctitle}
Case Type / Category: {ctype}
Court Name: {court_name or "Indian Court"}
Petitioner: {pet}
Respondent: {resp}
Current Status: {status}
Description / Notes: {description or "Not provided"}

CRITICAL INSTRUCTIONS:
- Generate specific, realistic legal loopholes and vulnerabilities tailored to this exact case type "{ctype}" and parties "{pet} vs {resp}".
- NEVER return generic placeholders like "Evidence assessment required". Each loophole must mention specific legal or procedural issues.

Return ONLY this exact JSON object structure:
{{
  "outcome": "<one of: Won, Lost, Pending, Disposed, Unknown>",
  "outcomeDetail": "<1 sentence explaining the legal reason for outcome or current stage>",
  "mainArgument": "<the single most specific legal argument or defense for this case>",
  "loopholes": [
    "<specific legal loophole 1 for {ctype}>",
    "<specific evidence gap or procedural error 2>",
    "<specific limitation or notice error 3>"
  ],
  "importantSections": ["<specific Act/Section 1>", "<specific Act/Section 2>", "<specific Act/Section 3>"]
}}
"""

        response = model.generate_content(prompt)
        raw = response.text.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        parsed = json.loads(raw)
        
        if not parsed.get("loopholes") or len(parsed.get("loopholes")) == 0:
            parsed["loopholes"] = dynamic_fallback["loopholes"]

        return parsed
    except Exception as e:
        print(f"[SimilarCases] Gemini analysis error for {ctitle}: {e}")
        return dynamic_fallback


def _generate_master_strategy_with_gemini(case_type: str, cases: list) -> dict:
    """Generates a unified, structured Legal Note and Strategy Report across all fetched similar cases for Senior Advocate."""
    import os
    import json
    import re
    import google.generativeai as genai
    from dotenv import load_dotenv

    won_count = sum(1 for c in cases if c.outcome == "Won")
    tot = max(len(cases), 1)
    est_prob = round((won_count / tot) * 100)

    fallback = {
        "winProbability": est_prob,
        "structuredLegalNote": f"Comprehensive Legal Brief for {case_type}:\n\n1. EXECUTIVE SUMMARY & LEGAL STANDING:\nBased on analysis of {len(cases)} precedent cases in {case_type}, Indian courts consistently emphasize mandatory statutory preconditions, clear documentary trails of breach, and strict compliance with limitation deadlines.\n\n2. KEY WINNING FORMULA:\nEstablish a clear documentary evidence trail establishing breach of legal obligation. Ensure all statutory pre-notice requirements are verified before trial commencement.",
        "currentCaseSummary": f"Based on {len(cases)} precedent cases in {case_type}, courts consistently prioritize clear documentary proof of breach and strict adherence to statutory filing deadlines.",
        "winningFormula": f"Establish a solid documentary trail and prove compliance with statutory preconditions in {case_type} proceedings.",
        "mainLoophole": "Lapse in statutory notice service, missing original documents, or unexcused limitation delays.",
        "advocateRecommendation": "File protective interim applications early, challenge opposing evidence admissibility under Section 65B, and cross-examine on timeline gaps.",
        "keyLoopholes": [
            "Delayed service of legal notices beyond statutory window",
            "Lack of primary electronic evidence certificate (Sec 65B Evidence Act)",
            "Failure to quantify precise damages or material breach",
            "Non-joinder of necessary parties in court filings",
        ],
        "mainArguments": [
            f"Establish mandatory statutory compliance and procedural regularity under {case_type}",
            "Highlight material contradictions and gaps in opposing party's pleadings and affidavits",
            "Invoke Supreme Court precedent on fundamental rights and natural justice safeguards",
        ],
        "importantActs": ["IPC Section 420", "CPC Order 39 Rule 1 & 2", "Indian Evidence Act Sec 65B", "Constitution Article 21"],
    }

    load_dotenv()
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key or not cases:
        return fallback

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")

        summary_lines = []
        for c in cases[:12]:
            summary_lines.append(f"- Title: {c.caseTitle} | Outcome: {c.outcome} | Argument: {c.mainArgument} | Loopholes: {', '.join(c.loopholes)}")
        context_str = "\n".join(summary_lines)

        prompt = f"""You are a Supreme Court Senior Advocate advising trial counsel on a "{case_type}" case. Analyze these {len(cases)} precedent cases:

Case Summaries:
{context_str}

Synthesize all findings into ONE FULL STRUCTURED LEGAL NOTE and Return ONLY a valid JSON object with these exact keys:
{{
  "winProbability": <integer representing estimated win likelihood percentage based on precedents>,
  "structuredLegalNote": "<One comprehensive, unified structured legal note with clear numbered sections>",
  "currentCaseSummary": "<3-4 sentences synthesizing how precedents apply to the current case>",
  "winningFormula": "<2-3 sentences outlining the core winning legal strategy>",
  "mainLoophole": "<2-3 sentences detailing the single biggest vulnerability in this type of case>",
  "advocateRecommendation": "<2-3 sentences providing step-by-step practical trial playbook for Senior Advocate>",
  "keyLoopholes": ["<loophole 1>", "<loophole 2>", "<loophole 3>", "<loophole 4>"],
  "mainArguments": ["<key argument 1>", "<key argument 2>", "<key argument 3>"],
  "importantActs": ["<Act/Section 1>", "<Act/Section 2>", "<Act/Section 3>", "<Act/Section 4>"]
}}
"""

        response = model.generate_content(prompt)
        raw = response.text.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        parsed = json.loads(raw)
        return parsed
    except Exception as e:
        print(f"[SimilarCases] Master Strategy error: {e}")
        return fallback


def _generate_current_case_ai_analysis(
    db: Session,
    case_id: Optional[int],
    case_type: str,
    case_title: str,
    court_name: str,
    case_description: str
) -> dict:
    """Generates structured AI analysis of the current case using real database case data."""
    import os
    import json
    import re
    import google.generativeai as genai
    from dotenv import load_dotenv

    db_case = None
    if case_id:
        try:
            from app.advocate.case_management.models import Case as CaseModel
            db_case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
        except Exception as e:
            print(f"[SimilarCases] DB fetch error: {e}")

    ctitle = (db_case.case_title if db_case and db_case.case_title else case_title) or "Legal Matter"
    cno = (db_case.case_no if db_case and db_case.case_no else "") or "N/A"
    cnr = (db_case.cnr_number if db_case and db_case.cnr_number else "") or "N/A"
    ctype = (db_case.case_type if db_case and db_case.case_type else case_type) or "Civil"
    court = (db_case.court_name if db_case and db_case.court_name else court_name) or "Court"
    client = (db_case.client_name if db_case and db_case.client_name else "") or "Client"
    desc = (db_case.case_description if db_case and db_case.case_description else case_description) or ""

    is_sufficient = len(ctitle.strip()) > 3 and (len(desc.strip()) > 5 or len(ctype.strip()) > 2)

    fallback = {
        "summary": f"AI Case Analysis for '{ctitle}' (Case No: {cno}) under {ctype} category at {court}. Client: {client}. The proceedings require legal evaluation of statutory compliance, documentary proof, and limitation deadlines.",
        "keyIssues": [
            f"Statutory preconditions and procedural timeline compliance under {ctype} law",
            f"Evidentiary weight and admissibility of pleadings filed on behalf of {client}",
            f"Limitation period and jurisdictional validity before {court}"
        ],
        "relevantFacts": [
            f"Case '{ctitle}' registered under {ctype} at {court}.",
            f"Client representation: {client} (Case No: {cno}).",
            f"Pleadings logged in system for case ID #{case_id or 'N/A'}."
        ],
        "applicableProvisions": [
            f"{ctype} Applicable Acts & Provisions",
            "Indian Evidence Act (Primary & Secondary Evidence Standards)",
            "Code of Civil Procedure / Code of Criminal Procedure",
            "Constitutional Safeguards & Due Process"
        ],
        "strengths": [
            f"Filing established before {court}",
            f"Client representation active for {client}",
            "Statutory cause of action formulated in case records"
        ],
        "risks": [
            "Limitation period and statutory pre-notice dates require verification",
            "Primary documentary proof must be verified against original records",
            "Timeline gaps in pleadings must be reviewed prior to hearing"
        ],
        "influencingFactors": [
            "Timely submission of rejoinders and witness affidavits",
            "Admissibility of documentary evidence",
            "Judicial bench schedule and procedural compliance"
        ],
        "recommendedReview": [
            "Audit pre-notice timelines and limitation compliance",
            "Verify all supporting documents attached to case binder",
            "Prepare witness cross-examination outline targeting timeline gaps"
        ],
        "outcomeAssessment": f"Based on available case information for '{ctitle}', current legal factors indicate active proceedings before {court}. This is an AI-assisted assessment based on available case data and is not a guaranteed prediction of the court's final decision.",
        "isSufficient": is_sufficient,
        "noticeText": None if is_sufficient else "Insufficient case details for a full AI assessment. Please add detailed case description or hearing notes."
    }

    load_dotenv()
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        return fallback

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")

        prompt = f"""You are an expert Senior Advocate analyzing this specific real case from the firm's database.

ACTUAL CASE DETAILS FROM DATABASE:
- Case Title: {ctitle}
- Case Number: {cno}
- CNR Number: {cnr}
- Case Type / Category: {ctype}
- Court: {court}
- Client Name: {client}
- Detailed Case Notes & Facts: {desc if desc.strip() else 'No additional factual notes entered yet.'}

Analyze ONLY this actual case and return ONLY a valid JSON object:
{{
  "summary": "<3-4 sentences synthesizing the actual case standing for {ctitle}>",
  "keyIssues": ["<key legal issue 1 for {ctype}>", "<key legal issue 2>", "<key legal issue 3>"],
  "relevantFacts": ["<actual fact 1 based on case details>", "<actual fact 2>", "<actual fact 3>"],
  "applicableProvisions": ["<statute/section 1 applicable to {ctype}>", "<statute/section 2>", "<statute/section 3>"],
  "strengths": ["<real favorable factor 1>", "<real favorable factor 2>", "<real favorable factor 3>"],
  "risks": ["<real risk factor 1>", "<real risk factor 2>", "<real risk factor 3>"],
  "influencingFactors": ["<factor 1>", "<factor 2>", "<factor 3>"],
  "recommendedReview": ["<recommended review area 1>", "<recommended review area 2>", "<recommended review area 3>"],
  "outcomeAssessment": "<3-4 sentences evaluating legal standing based on available facts. Must be clearly stated as AI-assisted assessment and not a guaranteed court prediction.>",
  "isSufficient": true
}}
"""
        response = model.generate_content(prompt)
        raw = response.text.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        parsed = json.loads(raw)
        parsed["isSufficient"] = is_sufficient
        if not is_sufficient:
            parsed["noticeText"] = "Insufficient information for a reliable AI assessment. Please provide additional case details or documents."
        return parsed
    except Exception as e:
        print(f"[SimilarCases] Current Case AI Analysis error: {e}")
        return fallback


def _map_status_to_outcome(status: str) -> str:
    """Map a status string to a canonical outcome label."""
    s = (status or "").lower()
    if any(w in s for w in ["won", "win", "victory", "allowed"]):
        return "Won"
    if any(w in s for w in ["lost", "dismissed", "rejected", "refused"]):
        return "Lost"
    if any(w in s for w in ["disposed", "closed", "settled", "withdrawn"]):
        return "Disposed"
    return "Pending"


def get_similar_cases_service(db: Session, data: SimilarCaseRequest) -> SimilarCasesResponse:
    """
    Fetches genuine similar cases based on legal attributes and similarity threshold.
    If no cases meet the threshold, returns similarCasesFound = False and AI analysis for current case.
    """
    threshold = data.similarityThreshold if data.similarityThreshold is not None else 50
    results: List[CaseAnalysisResult] = []
    internal_count = 0
    ecourts_count = 0

    target_type = data.caseType or "Civil"
    target_court = data.courtName or data.courtType or ""
    target_title = data.caseTitle or ""
    target_desc = data.caseDescription or ""

    # ── Step 1: Internal DB query ────────────────────────────────────────────
    try:
        from app.advocate.case_management.models import Case as CaseModel
        query = db.query(CaseModel)
        if data.caseId:
            query = query.filter(CaseModel.id != data.caseId)

        internal_cases = query.order_by(CaseModel.id.desc()).limit(30).all()

        for case in internal_cases:
            pet = case.client_name or "Petitioner"
            resp = (case.case_title or "").split(" vs ")[-1].strip() if " vs " in (case.case_title or "").lower() else "Respondent"
            title = case.case_title or f"{pet} vs. {resp}"

            score, reasons = _compute_similarity_details(
                target_type, target_court, target_title, target_desc,
                case.case_type or "", case.court_name or "", title, case.case_description or ""
            )

            # Strict threshold check!
            if score >= threshold:
                ai = _analyse_case_with_gemini(
                    case_title=title,
                    case_type=case.case_type or "",
                    status=case.status or "",
                    description=case.case_description or "",
                    petitioner=pet,
                    respondent=resp,
                    court_name=case.court_name or "",
                )
                results.append(CaseAnalysisResult(
                    cnrNumber=case.cnr_number,
                    caseTitle=title,
                    caseNo=case.case_no,
                    caseType=case.case_type or "",
                    courtName=case.court_name or "",
                    courtType=case.court_type,
                    filingDate=str(case.created_at.date()) if case.created_at else None,
                    outcome=ai.get("outcome", "Unknown"),
                    outcomeDetail=ai.get("outcomeDetail", f"Status: {case.status}"),
                    petitioner=pet,
                    respondent=resp,
                    mainArgument=ai.get("mainArgument", ""),
                    loopholes=ai.get("loopholes", []),
                    importantSections=ai.get("importantSections", []),
                    seniorAdvocateTip=ai.get("seniorAdvocateTip", ""),
                    presidingJudge=None,
                    nextHearingDate=case.next_hearing_date,
                    source="Verified Source: Internal Database",
                    similarityScore=score,
                    reasons=reasons
                ))
                internal_count += 1
    except Exception as e:
        print(f"[SimilarCases] Internal DB query error: {e}")

    # ── Step 2: eCourts live search ──────────────────────────────────────────
    try:
        provider = get_ecourts_provider()
        search_params = CaseSearchRequest(
            caseType=target_type,
            courtName=target_court or None,
        )
        ecourts_cases = provider.search_cases(search_params)

        for ec in ecourts_cases[:15]:
            pet = ec.petitioner or "Petitioner"
            resp = ec.respondent or "Respondent"
            title = ec.caseTitle or f"{pet} vs. {resp}"

            score, reasons = _compute_similarity_details(
                target_type, target_court, target_title, target_desc,
                ec.caseType or "", ec.courtName or "", title, ""
            )

            if score >= threshold:
                ai = _analyse_case_with_gemini(
                    case_title=title,
                    case_type=ec.caseType or "",
                    status=ec.status or "",
                    description="",
                    petitioner=pet,
                    respondent=resp,
                    court_name=ec.courtName or "",
                )
                results.append(CaseAnalysisResult(
                    cnrNumber=ec.cnrNumber,
                    caseTitle=title,
                    caseNo=ec.caseNo,
                    caseType=ec.caseType or "",
                    courtName=ec.courtName or "",
                    courtType=ec.courtType,
                    filingDate=ec.filingDate,
                    outcome=ai.get("outcome", "Unknown"),
                    outcomeDetail=ai.get("outcomeDetail", f"Status: {ec.status}"),
                    petitioner=pet,
                    respondent=resp,
                    mainArgument=ai.get("mainArgument", ""),
                    loopholes=ai.get("loopholes", []),
                    importantSections=ai.get("importantSections", []),
                    seniorAdvocateTip=ai.get("seniorAdvocateTip", ""),
                    presidingJudge=ec.presidingJudge or None,
                    nextHearingDate=ec.nextHearingDate,
                    source="Verified Source: eCourts Registry",
                    similarityScore=score,
                    reasons=reasons
                ))
                ecourts_count += 1
    except Exception as e:
        print(f"[SimilarCases] eCourts search error: {e}")

    # Sort results by similarity score descending
    results.sort(key=lambda x: x.similarityScore, reverse=True)

    similar_found = len(results) > 0

    # Current Case AI Analysis
    ai_analysis = _generate_current_case_ai_analysis(
        db, data.caseId, target_type, target_title, target_court, target_desc
    )

    summary_stats = {
        "won": sum(1 for r in results if r.outcome == "Won"),
        "lost": sum(1 for r in results if r.outcome == "Lost"),
        "pending": sum(1 for r in results if r.outcome == "Pending"),
        "disposed": sum(1 for r in results if r.outcome == "Disposed"),
    }

    master_strategy = _generate_master_strategy_with_gemini(target_type, results) if similar_found else None

    return SimilarCasesResponse(
        caseId=data.caseId,
        similarCasesFound=similar_found,
        totalFound=len(results),
        internalCount=internal_count,
        ecourtsCount=ecourts_count,
        similarityThreshold=threshold,
        cases=results,
        summaryStats=summary_stats,
        masterStrategy=master_strategy,
        aiAnalysis=ai_analysis
    )



