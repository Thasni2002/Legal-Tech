from sqlalchemy.orm import Session
from datetime import date
from typing import Optional
from app.authapp.models import User
from .models import Case, Hearing, Activity, Document

def get_dashboard_data(db: Session, advocate_id: Optional[int] = None):
    # Total Advocates (Firm wide)
    total_advocates = db.query(User).filter(User.role.ilike("%Advocate%")).count()

    # Active Cases
    active_cases_query = db.query(Case).filter(Case.status.in_(["Active", "Hearing"]))
    if advocate_id is not None:
        active_cases_query = active_cases_query.filter(Case.advocate_id == advocate_id)
    active_cases = active_cases_query.count()

    # Pending Cases
    pending_cases_query = db.query(Case).filter(Case.status == "Pending")
    if advocate_id is not None:
        pending_cases_query = pending_cases_query.filter(Case.advocate_id == advocate_id)
    pending_cases = pending_cases_query.count()

    # Upcoming Hearings Count
    today = date.today()
    hearings_count_query = db.query(Hearing).filter(Hearing.date >= today)
    if advocate_id is not None:
        hearings_count_query = hearings_count_query.filter(Hearing.advocate_id == advocate_id)
    upcoming_hearings_count = hearings_count_query.count()

    # Case Overview list (limit 5)
    cases_list_query = db.query(Case)
    if advocate_id is not None:
        cases_list_query = cases_list_query.filter(Case.advocate_id == advocate_id)
    cases_list = cases_list_query.order_by(Case.created_at.desc()).limit(5).all()

    # Upcoming Hearings list (limit 5)
    hearings_list_query = db.query(Hearing).filter(Hearing.date >= today)
    if advocate_id is not None:
        hearings_list_query = hearings_list_query.filter(Hearing.advocate_id == advocate_id)
    hearings_list = hearings_list_query.order_by(Hearing.date.asc(), Hearing.time.asc()).limit(5).all()

    # Format dates for hearings
    formatted_hearings = []
    for h in hearings_list:
        date_str = h.date.strftime("%d %b") if h.date else ""
        # Strip leading zero in day if necessary, e.g. "05 Jun" -> "5 Jun"
        if date_str.startswith("0"):
            date_str = date_str[1:]
        formatted_hearings.append({
            "date": date_str,
            "case_title": h.case_title,
            "court": h.court,
            "advocate_name": h.advocate_name or "",
            "time": h.time
        })

    # Recent Activities list (limit 5)
    activities_list_query = db.query(Activity)
    if advocate_id is not None:
        activities_list_query = activities_list_query.filter(Activity.advocate_id == advocate_id)
    activities_list = activities_list_query.order_by(Activity.created_at.desc()).limit(5).all()

    # Recent Documents list (limit 5)
    documents_list_query = db.query(Document)
    if advocate_id is not None:
        documents_list_query = documents_list_query.filter(Document.advocate_id == advocate_id)
    documents_list = documents_list_query.order_by(Document.created_at.desc()).limit(5).all()

    return {
        "stats": {
            "total_advocates": total_advocates,
            "active_cases": active_cases,
            "pending_cases": pending_cases,
            "upcoming_hearings_count": upcoming_hearings_count
        },
        "cases": [
            {
                "case_no": c.case_no,
                "client_name": c.client_name,
                "type": c.type,
                "court": c.court,
                "status": c.status
            }
            for c in cases_list
        ],
        "hearings": formatted_hearings,
        "activities": [
            {
                "title": act.title,
                "timestamp_str": act.timestamp_str,
                "type": act.type or ""
            }
            for act in activities_list
        ],
        "documents": [
            {
                "filename": doc.filename,
                "case_no": doc.case_no or ""
            }
            for doc in documents_list
        ]
    }
