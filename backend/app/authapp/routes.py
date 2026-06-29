from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from datetime import datetime, timedelta, date
from jose import jwt
from app.database import SessionLocal
from .schemas import LoginSchema, TokenSchema
from . import service
from .service import SECRET_KEY, ALGORITHM
from .models import User

router = APIRouter(tags=["Authentication"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/login", response_model=TokenSchema)
def login(user: LoginSchema, db: Session = Depends(get_db)):
    db_user = service.get_user_by_email(db, user.email)

    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email")

    if not service.verify_password(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Invalid password")

    token = service.create_token({
        "id": db_user.id,
        "email": db_user.email,
        "role": db_user.role,
        "username": db_user.username
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }


def _time_ago(dt: datetime) -> str:
    """Return a human-readable 'X ago' string for a datetime."""
    now = datetime.utcnow()
    diff = now - dt
    seconds = int(diff.total_seconds())
    if seconds < 60:
        return "Just now"
    if seconds < 3600:
        minutes = seconds // 60
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    if seconds < 86400:
        hours = seconds // 3600
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    days = seconds // 86400
    return f"{days} day{'s' if days > 1 else ''} ago"


@router.get("/notifications")
def get_notifications(
    user_id: Optional[int] = Query(None),
    role: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Returns dynamic in-app notifications for the logged-in user
    by fetching directly from existing models (Invoice, Consultation, Case, Document).
    No new database table is used. Alerts automatically disappear after 48 hours
    (except hearing and consultation calendar reminders which are strictly date-based).
    """
    from app.advocate.finance_management.models import Invoice
    from app.advocate.consultations.models import Consultation
    from app.advocate.case_management.models import Case
    from app.advocate.client_management.models import Document
    from app.advocate.lawfirm_management.models import AssignedCase

    notifications = []
    now = datetime.utcnow()
    cutoff = now - timedelta(hours=48)  # Recent events threshold
    today = date.today()

    # Load logged-in user profile details for name comparisons
    user = db.query(User).filter(User.id == user_id).first() if user_id else None

    # Helper comparisons for Junior Advocates
    def is_junior_assigned(case_obj):
        if not user or not case_obj.selected_advocate:
            return False
        adv_lower = case_obj.selected_advocate.lower()
        return (
            user.username.lower() in adv_lower or
            (user.first_name and user.first_name.lower() in adv_lower) or
            (user.last_name and user.last_name.lower() in adv_lower)
        )

    def is_junior_consult(consult_obj):
        if not user:
            return False
        if consult_obj.advocate_id == user.id:
            return True
        if not consult_obj.advocate_name:
            return False
        adv_lower = consult_obj.advocate_name.lower()
        return (
            user.username.lower() in adv_lower or
            (user.first_name and user.first_name.lower() in adv_lower) or
            (user.last_name and user.last_name.lower() in adv_lower)
        )

    # Helper comparisons for Clients
    def is_client_owner(case_obj):
        if not user:
            return False
        case_email = (case_obj.email_id or "").lower()
        case_client = (case_obj.client_name or "").lower()
        return (
            user.email.lower() == case_email or
            user.username.lower() in case_client
        )

    def is_client_consult(consult_obj):
        if not user:
            return False
        if consult_obj.client_id == user.id:
            return True
        client_lower = consult_obj.client_name.lower()
        return user.username.lower() in client_lower

    is_senior = role and role.lower() == "senior advocate"
    is_junior = role and role.lower() == "junior advocate"
    is_client = role and role.lower() == "client"

    # ─── A. SENIOR ADVOCATE NOTIFICATIONS ──────────────────────────────────────────
    if is_senior:
        # 1. Successful payments
        paid_invoices = db.query(Invoice).filter(
            Invoice.status == "Paid",
            Invoice.created_at >= cutoff
        ).all()
        for inv in paid_invoices:
            notifications.append({
                "id": f"pay_success_{inv.id}",
                "icon": "💰",
                "title": f"Payment of ₹{inv.grand_total:.2f} completed successfully by client {inv.client_name}.",
                "time": _time_ago(inv.created_at),
                "color": "text-emerald-600",
                "bg": "bg-emerald-50",
                "created_at": inv.created_at.isoformat()
            })

        # 2. Client uploaded document
        recent_docs = db.query(Document).filter(
            Document.created_at >= cutoff
        ).all()
        for doc in recent_docs:
            notifications.append({
                "id": f"doc_upload_{doc.id}",
                "icon": "📄",
                "title": f"Client uploaded a new document: \"{doc.filename}\".",
                "time": _time_ago(doc.created_at),
                "color": "text-purple-600",
                "bg": "bg-purple-50",
                "created_at": doc.created_at.isoformat()
            })

        # 3. New consultations booked
        new_consults = db.query(Consultation).filter(
            Consultation.created_at >= cutoff,
            Consultation.status == "Pending"
        ).all()
        for c in new_consults:
            notifications.append({
                "id": f"new_consult_{c.id}",
                "icon": "📅",
                "title": f"New consultation scheduled by {c.client_name} on {c.date} at {c.time}.",
                "time": _time_ago(c.created_at),
                "color": "text-blue-600",
                "bg": "bg-blue-50",
                "created_at": c.created_at.isoformat()
            })

        # 4. Consultation Rescheduled
        rescheduled_consults = db.query(Consultation).filter(
            Consultation.status == "Rescheduled",
            Consultation.updated_at >= cutoff
        ).all()
        for c in rescheduled_consults:
            notifications.append({
                "id": f"resched_consult_{c.id}",
                "icon": "♻️",
                "title": f"Consultation with {c.client_name} rescheduled to {c.date} at {c.time}.",
                "time": _time_ago(c.updated_at or c.created_at),
                "color": "text-amber-600",
                "bg": "bg-amber-50",
                "created_at": (c.updated_at or c.created_at).isoformat()
            })

        # 5. Overdue Invoices
        # Define overdue as: status is Overdue OR Pending/Sent and created > 7 days ago (max 30 days old to avoid noise)
        overdue_cutoff = now - timedelta(days=7)
        overdue_invoices = db.query(Invoice).filter(
            or_(
                Invoice.status == "Overdue",
                (Invoice.status.in_(["Pending", "Sent"]) & (Invoice.created_at <= overdue_cutoff))
            ),
            Invoice.created_at >= now - timedelta(days=30)
        ).all()
        for inv in overdue_invoices:
            notifications.append({
                "id": f"invoice_overdue_{inv.id}",
                "icon": "🧾",
                "title": f"Invoice #{inv.id} for client {inv.client_name} (₹{inv.grand_total:.2f}) is overdue.",
                "time": "Overdue",
                "color": "text-rose-600",
                "bg": "bg-rose-50",
                "created_at": inv.created_at.isoformat()
            })

        # 6. Case Status Changed
        status_changed_cases = db.query(Case).filter(
            Case.updated_at >= cutoff,
            Case.created_at != Case.updated_at,
            Case.status.in_(["Active", "Pending", "Closed"])
        ).all()
        for case in status_changed_cases:
            notifications.append({
                "id": f"case_status_{case.id}",
                "icon": "✅",
                "title": f"Case '{case.case_title}' status changed to {case.status}.",
                "time": _time_ago(case.updated_at),
                "color": "text-emerald-600",
                "bg": "bg-emerald-50",
                "created_at": case.updated_at.isoformat()
            })

        # 7. Junior Advocate Activity Tracker (Document Uploads by Juniors)
        junior_docs = db.query(Document).filter(
            Document.created_at >= cutoff,
            Document.advocate_id.isnot(None)
        ).all()
        for doc in junior_docs:
            adv_user = db.query(User).filter(User.id == doc.advocate_id).first()
            if adv_user and adv_user.role and adv_user.role.lower() == "junior advocate":
                assoc_case = db.query(Case).filter(Case.case_no == doc.case_no).first()
                case_title = assoc_case.case_title if assoc_case else (doc.case_no or "Unknown Case")
                adv_name = adv_user.username or "Junior Advocate"
                notifications.append({
                    "id": f"junior_doc_upload_{doc.id}",
                    "icon": "📄",
                    "title": f"Junior Advocate {adv_name} uploaded a new case file: '{doc.filename}' for Case {case_title}.",
                    "time": _time_ago(doc.created_at),
                    "color": "text-purple-600",
                    "bg": "bg-purple-50",
                    "created_at": doc.created_at.isoformat()
                })

        # 8. Consultation Cancellation Alerts
        cancelled_consults = db.query(Consultation).filter(
            Consultation.status == "Cancelled",
            Consultation.updated_at >= cutoff
        ).all()
        for c in cancelled_consults:
            notifications.append({
                "id": f"cancel_consult_{c.id}",
                "icon": "❌",
                "title": f"Consultation scheduled with {c.client_name} on {c.date} has been cancelled.",
                "time": _time_ago(c.updated_at or c.created_at),
                "color": "text-rose-600",
                "bg": "bg-rose-50",
                "created_at": (c.updated_at or c.created_at).isoformat()
            })

    # ─── B. JUNIOR ADVOCATE NOTIFICATIONS ──────────────────────────────────────────
    elif is_junior and user:
        # 1. Assigned to a new case
        new_cases = db.query(Case).filter(
            Case.created_at >= cutoff
        ).all()
        for case in new_cases:
            if is_junior_assigned(case):
                notifications.append({
                    "id": f"assigned_case_{case.id}",
                    "icon": "⚖️",
                    "title": f"You have been assigned to new case: \"{case.case_title}\".",
                    "time": _time_ago(case.created_at),
                    "color": "text-indigo-600",
                    "bg": "bg-indigo-50",
                    "created_at": case.created_at.isoformat()
                })

        # 2. Case updated (details changed, e.g. hearing dates)
        updated_cases = db.query(Case).filter(
            Case.updated_at >= cutoff,
            Case.created_at != Case.updated_at
        ).all()
        for case in updated_cases:
            if is_junior_assigned(case):
                notifications.append({
                    "id": f"updated_case_{case.id}",
                    "icon": "📝",
                    "title": f"Case '{case.case_title}' details have been updated.",
                    "time": _time_ago(case.updated_at),
                    "color": "text-sky-600",
                    "bg": "bg-sky-50",
                    "created_at": case.updated_at.isoformat()
                })

        # 3. Client Document Upload on Assigned Cases
        client_docs = db.query(Document).filter(
            Document.created_at >= cutoff
        ).all()
        for doc in client_docs:
            if doc.advocate_id is None and doc.case_no:
                assoc_case = db.query(Case).filter(Case.case_no == doc.case_no).first()
                if assoc_case and is_junior_assigned(assoc_case):
                    notifications.append({
                        "id": f"junior_client_doc_{doc.id}",
                        "icon": "📄",
                        "title": f"Client {assoc_case.client_name or 'Client'} uploaded '{doc.filename}' to your assigned Case '{assoc_case.case_title}'.",
                        "time": _time_ago(doc.created_at),
                        "color": "text-purple-600",
                        "bg": "bg-purple-50",
                        "created_at": doc.created_at.isoformat()
                    })

        # 4. Consultation Updates & Cancellations
        junior_consults = db.query(Consultation).filter(
            Consultation.status.in_(["Rescheduled", "Cancelled"]),
            Consultation.updated_at >= cutoff
        ).all()
        for c in junior_consults:
            if is_junior_consult(c):
                status_text = "rescheduled" if c.status == "Rescheduled" else "cancelled"
                time_detail = f" to {c.date} at {c.time}" if c.status == "Rescheduled" else ""
                icon = "♻️" if c.status == "Rescheduled" else "❌"
                color = "text-amber-600" if c.status == "Rescheduled" else "text-rose-600"
                bg = "bg-amber-50" if c.status == "Rescheduled" else "bg-rose-50"
                notifications.append({
                    "id": f"junior_consult_update_{c.id}_{c.status}",
                    "icon": icon,
                    "title": f"Your consultation with Client {c.client_name} has been {status_text}{time_detail}.",
                    "time": _time_ago(c.updated_at or c.created_at),
                    "color": color,
                    "bg": bg,
                    "created_at": (c.updated_at or c.created_at).isoformat()
                })

        # Helper comparisons for Junior Advocates in lawfirm management
        def is_junior_assigned_firm_case(ac):
            if not user or not ac.advocate_name:
                return False
            adv_lower = ac.advocate_name.lower()
            return (
                user.username.lower() in adv_lower or
                (user.first_name and user.first_name.lower() in adv_lower) or
                (user.last_name and user.last_name.lower() in adv_lower)
            )

        # 5. Senior Advocate Instructions / Tasks
        tasks = db.query(AssignedCase).filter(
            AssignedCase.status == "Active"
        ).all()
        for task in tasks:
            if is_junior_assigned_firm_case(task):
                notifications.append({
                    "id": f"task_assign_{task.id}",
                    "icon": "📋",
                    "title": f"Task assigned by Senior Advocate: '{task.assignment_notes or 'Draft petition'}' for case '{task.case_title}'. Due by {task.due_date or 'N/A'}.",
                    "time": f"Due {task.due_date}" if task.due_date else "Assigned",
                    "color": "text-indigo-600",
                    "bg": "bg-indigo-50",
                    "created_at": now.isoformat()
                })

    # ─── C. CLIENT NOTIFICATIONS ──────────────────────────────────────────────────
    elif is_client and user:
        # 1. Case status updated
        client_cases = db.query(Case).all()
        for case in client_cases:
            if is_client_owner(case):
                if case.updated_at and case.updated_at >= cutoff and case.created_at != case.updated_at:
                    notifications.append({
                        "id": f"client_case_status_{case.id}",
                        "icon": "⚖️",
                        "title": f"Your case '{case.case_title}' status updated to {case.status}.",
                        "time": _time_ago(case.updated_at),
                        "color": "text-emerald-600",
                        "bg": "bg-emerald-50",
                        "created_at": case.updated_at.isoformat()
                    })

        # 2. Consultation Rescheduled
        client_rescheduled = db.query(Consultation).filter(
            Consultation.status == "Rescheduled",
            Consultation.updated_at >= cutoff
        ).all()
        for c in client_rescheduled:
            if is_client_consult(c):
                adv_name = c.advocate_name or "Advocate"
                notifications.append({
                    "id": f"client_resched_{c.id}",
                    "icon": "♻️",
                    "title": f"Your consultation with {adv_name} rescheduled to {c.date} at {c.time}.",
                    "time": _time_ago(c.updated_at or c.created_at),
                    "color": "text-amber-600",
                    "bg": "bg-amber-50",
                    "created_at": (c.updated_at or c.created_at).isoformat()
                })

        # 3. Consultation scheduled by advocate (Pending or Scheduled)
        client_new_consults = db.query(Consultation).filter(
            Consultation.created_at >= cutoff
        ).all()
        for c in client_new_consults:
            if is_client_consult(c):
                adv_name = c.advocate_name or "Advocate"
                notifications.append({
                    "id": f"client_consult_sched_{c.id}",
                    "icon": "📅",
                    "title": f"New consultation scheduled with {adv_name} on {c.date} at {c.time}.",
                    "time": _time_ago(c.created_at),
                    "color": "text-indigo-600",
                    "bg": "bg-indigo-50",
                    "created_at": c.created_at.isoformat()
                })

        # 4. Consultation reminder (Day before scheduled consultation)
        tomorrow = today + timedelta(days=1)
        upcoming_consults = db.query(Consultation).filter(
            Consultation.date == tomorrow,
            Consultation.status.in_(["Approved", "Scheduled", "Pending"])
        ).all()
        for c in upcoming_consults:
            if is_client_consult(c):
                adv_name = c.advocate_name or "Advocate"
                notifications.append({
                    "id": f"client_consult_remind_{c.id}",
                    "icon": "🔔",
                    "title": f"Reminder: Consultation with {adv_name} is scheduled tomorrow at {c.time}.",
                    "time": "Tomorrow",
                    "color": "text-blue-600",
                    "bg": "bg-blue-50",
                    "created_at": now.isoformat()
                })

        # 5. New Invoice Issued
        client_new_invoices = db.query(Invoice).filter(
            Invoice.status.in_(["Sent", "Pending"]),
            Invoice.created_at >= cutoff
        ).all()
        for inv in client_new_invoices:
            is_owner = False
            if user:
                inv_email = (inv.email or "").lower()
                inv_client = (inv.client_name or "").lower()
                if user.email.lower() == inv_email or user.username.lower() in inv_client:
                     is_owner = True
            if is_owner:
                notifications.append({
                    "id": f"client_new_invoice_{inv.id}",
                    "icon": "🧾",
                    "title": f"New Invoice #{inv.id} for ₹{inv.grand_total:.2f} has been generated.",
                    "time": _time_ago(inv.created_at),
                    "color": "text-indigo-600",
                    "bg": "bg-indigo-50",
                    "created_at": inv.created_at.isoformat()
                })

        # 6. Payment Confirmation receipt
        client_paid_invoices = db.query(Invoice).filter(
            Invoice.status == "Paid",
            Invoice.created_at >= cutoff
        ).all()
        for inv in client_paid_invoices:
            is_owner = False
            if user:
                inv_email = (inv.email or "").lower()
                inv_client = (inv.client_name or "").lower()
                if user.email.lower() == inv_email or user.username.lower() in inv_client:
                     is_owner = True
            if is_owner:
                notifications.append({
                    "id": f"client_payment_confirm_{inv.id}",
                    "icon": "💰",
                    "title": f"Thank you! Your payment of ₹{inv.grand_total:.2f} for Invoice #{inv.id} has been received.",
                    "time": _time_ago(inv.created_at),
                    "color": "text-emerald-600",
                    "bg": "bg-emerald-50",
                    "created_at": inv.created_at.isoformat()
                })

        # 7. New Documents Shared by Advocates
        shared_docs = db.query(Document).filter(
            Document.created_at >= cutoff,
            Document.advocate_id.isnot(None)
        ).all()
        for doc in shared_docs:
            if doc.case_no:
                assoc_case = db.query(Case).filter(Case.case_no == doc.case_no).first()
                if assoc_case and is_client_owner(assoc_case):
                    adv_user = db.query(User).filter(User.id == doc.advocate_id).first()
                    adv_name = adv_user.username if adv_user else "Advocate"
                    notifications.append({
                        "id": f"client_shared_doc_{doc.id}",
                        "icon": "📄",
                        "title": f"Advocate {adv_name} shared a new document '{doc.filename}' on your case '{assoc_case.case_title}'.",
                        "time": _time_ago(doc.created_at),
                        "color": "text-blue-600",
                        "bg": "bg-blue-50",
                        "created_at": doc.created_at.isoformat()
                    })

    # ─── D. HEARING DATE REMINDERS (Shared Calendar Scanners) ──────────────────────
    # Fits rules: 5 days before, 2 days before, morning of
    if is_senior or is_junior or is_client:
        cases = db.query(Case).filter(Case.next_hearing_date.isnot(None)).all()
        for case in cases:
            # Check context scope target
            should_include = False
            if is_senior:
                should_include = True
            elif is_junior and is_junior_assigned(case):
                should_include = True
            elif is_client and is_client_owner(case):
                should_include = True

            if not should_include:
                continue

            try:
                date_str = case.next_hearing_date.strip().split()
                if not date_str:
                    continue
                date_str = date_str[0].split("T")[0]
                hearing_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                days_left = (hearing_date - today).days

                # Custom wording for Client vs Advocate
                subj_name = "Your case" if is_client else f"Case '{case.case_title}'"

                if days_left == 5:
                    notifications.append({
                        "id": f"hearing_5d_{case.id}_{role}",
                        "icon": "⚖️",
                        "title": f"Hearing in 5 days: {subj_name} scheduled on {hearing_date.strftime('%B %d, %Y')}.",
                        "time": "Upcoming",
                        "color": "text-amber-600",
                        "bg": "bg-amber-50",
                        "created_at": now.isoformat()
                    })
                elif days_left == 2:
                    notifications.append({
                        "id": f"hearing_2d_{case.id}_{role}",
                        "icon": "⚖️",
                        "title": f"Hearing in 2 days: {subj_name} scheduled on {hearing_date.strftime('%B %d, %Y')}.",
                        "time": "Upcoming",
                        "color": "text-orange-600",
                        "bg": "bg-orange-50",
                        "created_at": now.isoformat()
                    })
                elif days_left == 0:
                    notifications.append({
                        "id": f"hearing_today_{case.id}_{role}",
                        "icon": "🔔",
                        "title": f"Hearing TODAY: {subj_name} scheduled at {case.court_name}.",
                        "time": "Today",
                        "color": "text-rose-600",
                        "bg": "bg-rose-50",
                        "created_at": now.isoformat()
                    })
            except (ValueError, AttributeError, IndexError):
                continue

    # Sort all compiled notifications in descending chronological order
    notifications.sort(key=lambda x: x["created_at"], reverse=True)
    return notifications
