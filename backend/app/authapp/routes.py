import os
import random
import urllib.parse
from fastapi import APIRouter, Depends, HTTPException, Header, Query, Request, BackgroundTasks
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional, List
from datetime import datetime, timedelta, date
from jose import jwt
from app.database import SessionLocal
from .schemas import LoginSchema, RegisterSchema, TokenSchema
from . import service
from .service import SECRET_KEY, ALGORITHM, hash_password
from .models import User, UserNotificationRead, AppNotification

class MarkReadRequest(BaseModel):
    user_id: int
    notification_ids: List[str]

router = APIRouter(tags=["Authentication"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── In-memory OTP store: { email -> {otp, expires_at} } ──────────────────────
_otp_store: dict = {}
OTP_EXPIRE_MINUTES = 4


class ForgotSendOtpRequest(BaseModel):
    email: str


class ForgotVerifyOtpRequest(BaseModel):
    email: str
    otp: str


class ForgotResetRequest(BaseModel):
    email: str
    otp: str
    new_password: str


def send_otp_email_task(email: str, username: str, otp: str):
    """Sync task runner to send SMTP emails in a FastAPI background thread."""
    try:
        from app.utils.email import send_email_sync
        from app.utils.email_templates import build_otp_email
        body = build_otp_email(
            username=username,
            otp=otp,
            expire_minutes=OTP_EXPIRE_MINUTES
        )
        send_email_sync(
            to_email=email,
            subject="Legal-Tech: Your Verification Code",
            body=body,
        )
        print(f"[OTP] Background email successfully sent to {email}")
    except Exception as e:
        print(f"[OTP] Background email FAILED for {email}: {type(e).__name__}: {e}")


@router.post("/forgot-password/send-otp", tags=["Password Reset"])
async def forgot_password_send_otp(
    data: ForgotSendOtpRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Step 1 – validate email exists, generate OTP, email it via background tasks."""
    email_clean = data.email.strip().lower()
    user = service.get_user_by_email(db, email_clean)
    if not user:
        raise HTTPException(status_code=404, detail="No account found with that email address.")

    otp = str(random.randint(100000, 999999))
    _otp_store[user.email.lower()] = {
        "otp": otp,
        "expires_at": datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES),
    }

    # Always print OTP to console for easy debugging
    print(f"\n{'='*50}")
    print(f"[OTP] Email: {user.email}")
    print(f"[OTP] Code:  {otp}")
    print(f"[OTP] Valid for {OTP_EXPIRE_MINUTES} minutes")
    print(f"{'='*50}\n")

    username_display = user.username or user.first_name or "Advocate"
    background_tasks.add_task(send_otp_email_task, user.email, username_display, otp)

    return {
        "message": "OTP sent to your email address.",
        "email": user.email,
        "email_sent": True
    }


@router.post("/forgot-password/verify-otp", tags=["Password Reset"])
def forgot_password_verify_otp(
    data: ForgotVerifyOtpRequest,
    db: Session = Depends(get_db)
):
    """Step 2 – verify OTP without resetting yet."""
    email_clean = data.email.strip().lower()
    user = service.get_user_by_email(db, email_clean)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    entry = _otp_store.get(user.email.lower())
    if not entry:
        raise HTTPException(status_code=400, detail="No OTP requested for this email. Please request a new one.")
    if datetime.utcnow() > entry["expires_at"]:
        _otp_store.pop(user.email.lower(), None)
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    if entry["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Incorrect OTP. Please try again.")
    return {"message": "OTP verified successfully."}


@router.post("/forgot-password/reset", tags=["Password Reset"])
def forgot_password_reset(
    data: ForgotResetRequest,
    db: Session = Depends(get_db)
):
    """Step 3 – verify OTP again and set new password."""
    email_clean = data.email.strip().lower()
    user = service.get_user_by_email(db, email_clean)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    entry = _otp_store.get(user.email.lower())
    if not entry:
        raise HTTPException(status_code=400, detail="No OTP requested for this email.")
    if datetime.utcnow() > entry["expires_at"]:
        _otp_store.pop(user.email.lower(), None)
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    if entry["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Incorrect OTP.")

    user.password = hash_password(data.new_password)
    user.temp_password = data.new_password   # keep temp_password in sync
    db.commit()
    _otp_store.pop(user.email.lower(), None)         # consume OTP
    return {"message": "Password reset successfully."}


@router.post("/forgot-password/login-with-otp", tags=["Password Reset"])
def forgot_password_login_with_otp(
    data: ForgotVerifyOtpRequest,
    db: Session = Depends(get_db)
):
    """Verify OTP and return a login token — allows direct login after OTP verification."""
    email_clean = data.email.strip().lower()
    user = service.get_user_by_email(db, email_clean)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    entry = _otp_store.get(user.email.lower())
    if not entry:
        raise HTTPException(status_code=400, detail="No OTP requested for this email. Please request a new one.")
    if datetime.utcnow() > entry["expires_at"]:
        _otp_store.pop(user.email.lower(), None)
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    if entry["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Incorrect OTP. Please try again.")

    _otp_store.pop(user.email.lower(), None)   # consume OTP after successful verification

    token = service.create_token({
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "username": user.username,
        "firstName": user.first_name or "",
        "lastName": user.last_name or ""
    })
    return {"access_token": token, "token_type": "bearer"}

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
        "username": db_user.username,
        "firstName": db_user.first_name or "",
        "lastName": db_user.last_name or ""
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@router.post("/register", response_model=TokenSchema)
def register_user(data: RegisterSchema, db: Session = Depends(get_db)):
    email_clean = (data.email or "").strip().lower()
    if not email_clean:
        raise HTTPException(status_code=400, detail="Email address is required.")

    existing_user = db.query(User).filter(func.lower(User.email) == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="An account with this email address already exists. Please sign in instead."
        )

    base_name = (data.username or f"{data.first_name or ''} {data.last_name or ''}").strip() or email_clean.split("@")[0]
    uname = base_name
    counter = 1
    while db.query(User).filter(func.lower(User.username) == uname.lower()).first():
        uname = f"{base_name}_{counter}"
        counter += 1

    try:
        new_user = User(
            email=email_clean,
            username=uname,
            password=hash_password(data.password),
            role=data.role or "Advocate",
            first_name=data.first_name,
            last_name=data.last_name,
            temp_password=data.password,
            custom_permissions={},
            document_access=[]
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception as err:
        db.rollback()
        print(f"[Register Error] {err}")
        raise HTTPException(status_code=400, detail="Failed to create account. Please check inputs and retry.")

    token = service.create_token({
        "id": new_user.id,
        "email": new_user.email,
        "role": new_user.role,
        "username": new_user.username,
        "firstName": new_user.first_name or "",
        "lastName": new_user.last_name or ""
    })
    return {"access_token": token, "token_type": "bearer"}


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
    No new database table is used. Alerts automatically disappear after 48 hours.
    """
    from app.advocate.finance_management.models import Invoice
    from app.advocate.consultations.models import Consultation
    from app.advocate.case_management.models import Case, CaseDocumentWorkflow
    from app.advocate.client_management.models import Document
    from app.advocate.lawfirm_management.models import AssignedCase
    from app.advocate.tasks.models import Task, TaskMessage
    from app.advocate.leave_management.models import LeaveRequest
    from app.clerk.dashboard.models import ClerkTask

    notifications = []
    now = datetime.utcnow()
    cutoff = now - timedelta(days=30)  # Notifications threshold: last 1 month (30 days)
    today = date.today()

    # Load logged-in user profile details for name comparisons
    user = db.query(User).filter(User.id == user_id).first() if user_id else None

    # Persistent AppNotification Table Records
    if user:
        adv_name_lower = (user.username or "").lower()
        fname_lower = (user.first_name or "").lower()
        lname_lower = (user.last_name or "").lower()
        full_name_lower = f"{fname_lower} {lname_lower}".strip()

        conditions = [
            AppNotification.user_id == user.id
        ]
        if adv_name_lower:
            conditions.append(func.lower(AppNotification.target_name) == adv_name_lower)
        if fname_lower and fname_lower != "adv.":
            conditions.append(func.lower(AppNotification.target_name).contains(fname_lower))
        if lname_lower:
            conditions.append(func.lower(AppNotification.target_name).contains(lname_lower))
        if full_name_lower:
            conditions.append(func.lower(AppNotification.target_name) == full_name_lower)

        app_notifs = db.query(AppNotification).filter(or_(*conditions)).all()
        for an in app_notifs:
            an_created = an.created_at or now
            notifications.append({
                "id": f"app_notif_{an.id}",
                "icon": an.icon or "⚖️",
                "title": an.title,
                "time": _time_ago(an_created) if hasattr(an, 'created_at') and an.created_at else (an.time_str or "Just now"),
                "color": an.color or "text-indigo-600",
                "bg": an.bg or "bg-indigo-50",
                "created_at": an_created.isoformat(),
                "is_read": bool(an.is_read)
            })

    def parse_date_str(d_str):
        if not d_str:
            return None
        try:
            clean = str(d_str).strip().split()[0].split("T")[0]
            return datetime.strptime(clean, "%Y-%m-%d").date()
        except Exception:
            return None

    # Helper comparisons for Junior Advocates
    def is_junior_assigned(case_obj):
        if not user:
            return False
        
        target_names = []
        if hasattr(case_obj, "selected_advocate") and case_obj.selected_advocate:
            target_names.append(str(case_obj.selected_advocate))
        if hasattr(case_obj, "advocate_name") and case_obj.advocate_name:
            target_names.append(str(case_obj.advocate_name))
        if hasattr(case_obj, "secondary_advocate_name") and case_obj.secondary_advocate_name:
            target_names.append(str(case_obj.secondary_advocate_name))

        if not target_names:
            return False

        u_tokens = [
            (user.username or "").lower(),
            (user.first_name or "").lower(),
            (user.last_name or "").lower(),
            (user.email or "").lower().split("@")[0]
        ]
        if "ashfah" in u_tokens[0]:
            u_tokens.extend(["ashfah", "ashraf"])

        clean_tokens = [t.replace(".", "").strip() for t in u_tokens if len(t.strip()) >= 3]

        for name_str in target_names:
            norm_target = name_str.lower().replace(" ", "").replace(".", "")
            for token in clean_tokens:
                if token in norm_target or norm_target in token:
                    return True
        return False

    # Helper comparisons for Clients
    def is_client_owner(case_obj):
        if not user:
            return False
        case_email = (case_obj.email_id or "").lower()
        case_client = (case_obj.client_name or "").lower()
        u_email = (user.email or "").lower()
        u_username = (user.username or "").lower()
        return (
            (u_email and u_email == case_email) or
            (u_username and u_username in case_client)
        )

    def is_client_consult(consult_obj):
        if not user:
            return False
        if consult_obj.client_id == user.id:
            return True
        client_name = consult_obj.client_name or ""
        client_lower = client_name.lower()
        u_username = (user.username or "").lower()
        return u_username and u_username in client_lower

    # Flexible Role Matching (supports 'Junior Advocate', 'Junior', 'junior_advocate', etc.)
    user_role = (role or (user.role if user else "") or "").lower().replace(" ", "").replace("_", "")

    is_senior = "senior" in user_role or "admin" in user_role
    is_junior = "junior" in user_role
    is_client = "client" in user_role
    is_clerk = "clerk" in user_role

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

        # 3. New meeting scheduled (renamed from consultation)
        new_consults = db.query(Consultation).filter(
            Consultation.created_at >= cutoff,
            Consultation.status == "Pending"
        ).all()
        for c in new_consults:
            notifications.append({
                "id": f"new_consult_{c.id}",
                "icon": "📅",
                "title": f"New meeting scheduled by {c.client_name} on {c.date} at {c.time}.",
                "time": _time_ago(c.created_at),
                "color": "text-blue-600",
                "bg": "bg-blue-50",
                "created_at": c.created_at.isoformat()
            })

        # 4. Meeting Rescheduled (renamed from consultation)
        rescheduled_consults = db.query(Consultation).filter(
            Consultation.status == "Rescheduled",
            Consultation.updated_at >= cutoff
        ).all()
        for c in rescheduled_consults:
            notifications.append({
                "id": f"resched_consult_{c.id}",
                "icon": "♻️",
                "title": f"Meeting with {c.client_name} rescheduled to {c.date} at {c.time}.",
                "time": _time_ago(c.updated_at or c.created_at),
                "color": "text-amber-600",
                "bg": "bg-amber-50",
                "created_at": (c.updated_at or c.created_at).isoformat()
            })

        # 5. Overdue Invoices
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

        # 8. Meeting Cancellation Alerts (renamed from consultation)
        cancelled_consults = db.query(Consultation).filter(
            Consultation.status == "Cancelled",
            Consultation.updated_at >= cutoff
        ).all()
        for c in cancelled_consults:
            notifications.append({
                "id": f"cancel_consult_{c.id}",
                "icon": "❌",
                "title": f"Meeting scheduled with {c.client_name} on {c.date} has been cancelled.",
                "time": _time_ago(c.updated_at or c.created_at),
                "color": "text-rose-600",
                "bg": "bg-rose-50",
                "created_at": (c.updated_at or c.created_at).isoformat()
            })

        # 9. Case Document Approval pending review notifications for Seniors
        pending_review_docs = db.query(CaseDocumentWorkflow).filter(
            CaseDocumentWorkflow.status == "Pending Review",
            CaseDocumentWorkflow.updated_at >= cutoff
        ).all()
        for doc in pending_review_docs:
            jr_user = db.query(User).filter(User.id == doc.junior_id).first()
            jr_name = (jr_user.username or "Junior Advocate") if jr_user else "Junior Advocate"
            notifications.append({
                "id": f"workflow_pending_{doc.id}",
                "icon": "⚖️",
                "title": f"Junior Advocate {jr_name} submitted document '{doc.title}' for review.",
                "time": _time_ago(doc.updated_at),
                "color": "text-blue-600",
                "bg": "bg-blue-50",
                "created_at": doc.updated_at.isoformat()
            })

        # 10. Task Overdue Warning for Senior Advocate
        overdue_tasks = db.query(Task).filter(
            Task.status != "completed"
        ).all()
        for t in overdue_tasks:
            if user and t.senior_advocate_id == user.id:
                d = parse_date_str(t.due_date)
                if d and d < today:
                    notifications.append({
                        "id": f"task_overdue_{t.id}",
                        "icon": "⏰",
                        "title": f"Task Overdue: Delegated task '{t.title}' assigned to {t.junior_name or 'Assignee'} passed its due date ({t.due_date}).",
                        "time": "Overdue",
                        "color": "text-rose-600",
                        "bg": "bg-rose-50",
                        "created_at": (t.updated_at or t.created_at).isoformat()
                    })

        # 11. Leave Approval Requests (Junior / Clerk applied for leave)
        pending_leaves = db.query(LeaveRequest).filter(
            LeaveRequest.status == "Pending",
            LeaveRequest.created_at >= cutoff
        ).all()
        for lr in pending_leaves:
            dates_str = f"{lr.from_date}" if lr.from_date == lr.to_date else f"{lr.from_date} to {lr.to_date}"
            notifications.append({
                "id": f"senior_leave_req_{lr.id}",
                "icon": "🌴",
                "title": f"Leave Approval Request: {lr.applicant_role} {lr.applicant_name} applied for {lr.leave_type} on {dates_str}.",
                "time": _time_ago(lr.created_at),
                "color": "text-amber-600",
                "bg": "bg-amber-50",
                "created_at": lr.created_at.isoformat()
            })

        # 12. High-Priority Task Progress / Message / Attachment Update
        task_msgs = db.query(TaskMessage).filter(
            TaskMessage.created_at >= cutoff
        ).all()
        for tm in task_msgs:
            if tm.sender_role and "junior" in tm.sender_role.lower():
                parent_task = db.query(Task).filter(Task.id == tm.task_id).first()
                if parent_task and parent_task.senior_advocate_id == (user.id if user else 0):
                    has_attachment = bool(tm.file_url)
                    is_high_prio = parent_task.priority and parent_task.priority.lower() in ["high", "urgent"]
                    if is_high_prio or has_attachment or tm.message_type == "progress":
                        msg_desc = "attached a file/audio note" if has_attachment else "posted a progress update"
                        notifications.append({
                            "id": f"senior_task_prog_{tm.id}",
                            "icon": "🎙️" if (tm.file_type and "audio" in str(tm.file_type).lower()) else ("📎" if has_attachment else "⚡"),
                            "title": f"High-Priority Task Progress: {tm.sender_name or 'Junior Advocate'} {msg_desc} on task '{parent_task.title}'.",
                            "time": _time_ago(tm.created_at),
                            "color": "text-indigo-600",
                            "bg": "bg-indigo-50",
                            "created_at": tm.created_at.isoformat()
                        })

        # 13. Emergency Case Hearing Added (Urgent hearing scheduled within 24-48 hours)
        emergency_cases = db.query(Case).filter(
            Case.next_hearing_date.isnot(None)
        ).all()
        for ec in emergency_cases:
            h_date = parse_date_str(ec.next_hearing_date)
            if h_date:
                days_diff = (h_date - today).days
                if 0 <= days_diff <= 2:
                    notifications.append({
                        "id": f"senior_emergency_hearing_{ec.id}",
                        "icon": "🚨",
                        "title": f"Emergency Case Hearing: Case '{ec.case_title}' has an urgent hearing scheduled on {h_date.strftime('%B %d, %Y')} ({'TODAY' if days_diff==0 else f'in {days_diff} days'}).",
                        "time": "Urgent Hearing",
                        "color": "text-rose-600",
                        "bg": "bg-rose-50",
                        "created_at": now.isoformat()
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

        # 1b. Assigned to a Lawfirm Management AssignedCase (Assigned vs Unassigned)
        firm_cases = db.query(AssignedCase).all()
        for ac in firm_cases:
            c_title = ac.case_title or ac.case_name
            if not c_title or not c_title.strip() or c_title.strip().lower() == "assigned case":
                continue
                
            if is_junior_assigned(ac):
                st_lower = (ac.status or "").lower()
                if st_lower in ["unassigned", "inactive", "removed"]:
                    notifications.append({
                        "id": f"unassigned_firm_case_{ac.id}",
                        "icon": "⚠️",
                        "title": f"Case Unassigned: Senior Advocate unassigned you from case: \"{c_title}\".",
                        "time": "Unassigned",
                        "color": "text-rose-600",
                        "bg": "bg-rose-50",
                        "created_at": (now - timedelta(minutes=2)).isoformat()
                    })
                else:
                    notifications.append({
                        "id": f"assigned_firm_case_{ac.id}",
                        "icon": "⚖️",
                        "title": f"You have been assigned to case: \"{c_title}\".",
                        "time": "Assigned",
                        "color": "text-indigo-600",
                        "bg": "bg-indigo-50",
                        "created_at": (now - timedelta(minutes=5)).isoformat()
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

        # 4. Real Senior Advocate Task Assignments
        jr_real_tasks = db.query(Task).filter(
            Task.junior_advocate_id == user.id,
            Task.created_at >= cutoff
        ).all()
        for t in jr_real_tasks:
            c_title = f" for case '{t.case_title}'" if t.case_title else ""
            t_created = t.created_at or (now - timedelta(days=1))
            notifications.append({
                "id": f"real_task_assign_{t.id}",
                "icon": "📋",
                "title": f"Task assigned by Senior Advocate: '{t.title}'{c_title}. Due by {t.due_date or 'N/A'}.",
                "time": _time_ago(t_created),
                "color": "text-indigo-600",
                "bg": "bg-indigo-50",
                "created_at": t_created.isoformat()
            })

        # 5. Case Document Approval updates for Juniors
        my_review_docs = db.query(CaseDocumentWorkflow).filter(
            CaseDocumentWorkflow.junior_id == user.id,
            CaseDocumentWorkflow.status.in_(["Approved", "Needs Correction"]),
            CaseDocumentWorkflow.updated_at >= cutoff
        ).all()
        for doc in my_review_docs:
            if doc.status == "Approved":
                notifications.append({
                    "id": f"workflow_approved_{doc.id}",
                    "icon": "✅",
                    "title": f"Senior Advocate approved your document: '{doc.title}'.",
                    "time": _time_ago(doc.updated_at),
                    "color": "text-emerald-600",
                    "bg": "bg-emerald-50",
                    "created_at": doc.updated_at.isoformat()
                })
            elif doc.status == "Needs Correction":
                notifications.append({
                    "id": f"workflow_correction_{doc.id}",
                    "icon": "⚠️",
                    "title": f"Correction requested for '{doc.title}': {doc.senior_feedback or ''}",
                    "time": _time_ago(doc.updated_at),
                    "color": "text-amber-600",
                    "bg": "bg-amber-50",
                    "created_at": doc.updated_at.isoformat()
                })

        # 6. Upcoming Task Due Reminder (within 24 Hours) for Junior Advocate
        jr_tasks = db.query(Task).filter(
            Task.junior_advocate_id == user.id,
            Task.status != "completed"
        ).all()
        for t in jr_tasks:
            d = parse_date_str(t.due_date)
            if d and 0 <= (d - today).days <= 1:
                notifications.append({
                    "id": f"task_due_soon_{t.id}",
                    "icon": "⏳",
                    "title": f"Upcoming Task Due: '{t.title}' is due within 24 hours (Due: {t.due_date}).",
                    "time": "Due Soon",
                    "color": "text-amber-600",
                    "bg": "bg-amber-50",
                    "created_at": now.isoformat()
                })

        # 7. Standby Advocate Role Notification
        standby_cases = db.query(AssignedCase).filter(
            AssignedCase.secondary_advocate_name.isnot(None)
        ).all()
        for sc in standby_cases:
            if is_junior_assigned(sc):
                notifications.append({
                    "id": f"jr_standby_role_{sc.id}",
                    "icon": "🛡️",
                    "title": f"Standby Advocate Assignment: You have been assigned as Secondary/Standby Counsel for case '{sc.case_title or sc.case_name or 'Assigned Case'}'.",
                    "time": "Assigned",
                    "color": "text-amber-600",
                    "bg": "bg-amber-50",
                    "created_at": (now - timedelta(minutes=10)).isoformat()
                })

        # 8. Calendar Reschedule Notice for Junior Advocates
        rescheduled_discussions = db.query(Consultation).filter(
            Consultation.status == "Rescheduled",
            Consultation.updated_at >= cutoff
        ).all()
        for rd in rescheduled_discussions:
            notifications.append({
                "id": f"jr_cal_rescheduled_{rd.id}",
                "icon": "📆",
                "title": f"Calendar Reschedule Notice: Internal case discussion / review meeting rescheduled to {rd.date} at {rd.time}.",
                "time": _time_ago(rd.updated_at or rd.created_at),
                "color": "text-blue-600",
                "bg": "bg-blue-50",
                "created_at": (rd.updated_at or rd.created_at).isoformat()
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

        # 2. Meeting Rescheduled (renamed from consultation)
        client_rescheduled = db.query(Consultation).filter(
            Consultation.status == "Rescheduled",
            Consultation.updated_at >= cutoff
        ).all()
        for c in client_rescheduled:
            if is_client_consult(c):
                notifications.append({
                    "id": f"client_resched_{c.id}",
                    "icon": "♻️",
                    "title": f"Your meeting has been rescheduled to {c.date} at {c.time}.",
                    "time": _time_ago(c.updated_at or c.created_at),
                    "color": "text-amber-600",
                    "bg": "bg-amber-50",
                    "created_at": (c.updated_at or c.created_at).isoformat()
                })

        # 3. Meeting scheduled by advocate (renamed from consultation)
        client_new_consults = db.query(Consultation).filter(
            Consultation.created_at >= cutoff
        ).all()
        for c in client_new_consults:
            if is_client_consult(c):
                notifications.append({
                    "id": f"client_consult_sched_{c.id}",
                    "icon": "📅",
                    "title": f"New meeting scheduled on {c.date} at {c.time}.",
                    "time": _time_ago(c.created_at),
                    "color": "text-indigo-600",
                    "bg": "bg-indigo-50",
                    "created_at": c.created_at.isoformat()
                })

        # 4. Meeting reminder (renamed from consultation)
        tomorrow = today + timedelta(days=1)
        upcoming_consults = db.query(Consultation).filter(
            Consultation.date == tomorrow,
            Consultation.status.in_(["Approved", "Scheduled", "Pending"])
        ).all()
        for c in upcoming_consults:
            if is_client_consult(c):
                notifications.append({
                    "id": f"client_consult_remind_{c.id}",
                    "icon": "🔔",
                    "title": f"Reminder: Meeting scheduled tomorrow at {c.time}.",
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
                u_email = (user.email or "").lower()
                u_username = (user.username or "").lower()
                if (u_email and u_email == inv_email) or (u_username and u_username in inv_client):
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
                u_email = (user.email or "").lower()
                u_username = (user.username or "").lower()
                if (u_email and u_email == inv_email) or (u_username and u_username in inv_client):
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

        # 8. Action Required / Document Requested
        req_docs = db.query(Document).filter(
            Document.created_at >= cutoff
        ).all()
        for doc in req_docs:
            if doc.case_no:
                assoc_case = db.query(Case).filter(Case.case_no == doc.case_no).first()
                if assoc_case and is_client_owner(assoc_case):
                    notifications.append({
                        "id": f"client_doc_req_{doc.id}",
                        "icon": "📑",
                        "title": f"Action Required: Advocate requested evidence / ID proof / affidavit for case '{assoc_case.case_title}'.",
                        "time": _time_ago(doc.created_at),
                        "color": "text-purple-600",
                        "bg": "bg-purple-50",
                        "created_at": doc.created_at.isoformat()
                    })

        # 9. Upcoming Invoice Payment Reminder (3 days before due date)
        inv_reminders = db.query(Invoice).filter(
            Invoice.status.in_(["Sent", "Pending"]),
            Invoice.created_at >= now - timedelta(days=10)
        ).all()
        for inv in inv_reminders:
            is_owner = False
            if user:
                inv_email = (inv.email or "").lower()
                inv_client = (inv.client_name or "").lower()
                u_email = (user.email or "").lower()
                u_username = (user.username or "").lower()
                if (u_email and u_email == inv_email) or (u_username and u_username in inv_client):
                    is_owner = True
            if is_owner:
                days_old = (now - inv.created_at).days
                if days_old == 4:
                    notifications.append({
                        "id": f"client_invoice_remind_3d_{inv.id}",
                        "icon": "💳",
                        "title": f"Upcoming Payment Reminder: Invoice #{inv.id} for ₹{inv.grand_total:.2f} is due in 3 days.",
                        "time": "Due in 3 days",
                        "color": "text-amber-600",
                        "bg": "bg-amber-50",
                        "created_at": now.isoformat()
                    })

        # 10. Next Hearing Date Fixed
        updated_client_cases = db.query(Case).filter(
            Case.updated_at >= cutoff,
            Case.created_at != Case.updated_at,
            Case.next_hearing_date.isnot(None)
        ).all()
        for case in updated_client_cases:
            if is_client_owner(case):
                notifications.append({
                    "id": f"client_next_hearing_fixed_{case.id}",
                    "icon": "📌",
                    "title": f"Next Hearing Date Fixed: Immediate notification for case '{case.case_title}' scheduled on {case.next_hearing_date}.",
                    "time": _time_ago(case.updated_at),
                    "color": "text-indigo-600",
                    "bg": "bg-indigo-50",
                    "created_at": case.updated_at.isoformat()
                })

    # ─── D. CLERK NOTIFICATIONS ────────────────────────────────────────────────────

    elif is_clerk and user:
        # 1. New Clerk Task Assignment
        clerk_tasks = db.query(ClerkTask).filter(
            ClerkTask.created_at >= cutoff
        ).all()
        for ct in clerk_tasks:
            notifications.append({
                "id": f"clerk_task_assign_{ct.id}",
                "icon": "📋",
                "title": f"New Clerk Task Assigned: '{ct.text}'.",
                "time": _time_ago(ct.created_at),
                "color": "text-indigo-600",
                "bg": "bg-indigo-50",
                "created_at": ct.created_at.isoformat()
            })

    # ─── E. HEARING DATE REMINDERS (Shared Calendar Scanners) ──────────────────────
    if is_senior or is_junior or is_client or is_clerk:
        cases = db.query(Case).filter(Case.next_hearing_date.isnot(None)).all()
        for case in cases:
            should_include = False
            if is_senior or is_clerk:
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

                subj_name = "Your case" if is_client else f"Case '{case.case_title}'"

                if days_left == 5:
                    notifications.append({
                        "id": f"hearing_5d_{case.id}_{role}",
                        "icon": "⚖️",
                        "title": f"Hearing in 5 days: {subj_name} scheduled on {hearing_date.strftime('%B %d, %Y')}.",
                        "time": "Upcoming",
                        "color": "text-amber-600",
                        "bg": "bg-amber-50",
                        "created_at": (now - timedelta(days=2)).isoformat()
                    })
                elif days_left == 2:
                    notifications.append({
                        "id": f"hearing_2d_{case.id}_{role}",
                        "icon": "⚖️",
                        "title": f"Hearing in 2 days: {subj_name} scheduled on {hearing_date.strftime('%B %d, %Y')}.",
                        "time": "Upcoming",
                        "color": "text-orange-600",
                        "bg": "bg-orange-50",
                        "created_at": (now - timedelta(days=1)).isoformat()
                    })
                elif days_left == 0:
                    notifications.append({
                        "id": f"hearing_today_{case.id}_{role}",
                        "icon": "🔔",
                        "title": f"Hearing TODAY: {subj_name} scheduled at {case.court_name}.",
                        "time": "Today",
                        "color": "text-rose-600",
                        "bg": "bg-rose-50",
                        "created_at": (now - timedelta(hours=1)).isoformat()
                    })
            except (ValueError, AttributeError, IndexError):
                continue

    # Check database persistent read status for user
    read_ids = set()
    if user_id:
        read_records = db.query(UserNotificationRead.notification_id).filter(
            UserNotificationRead.user_id == user_id
        ).all()
        read_ids = {r[0] for r in read_records}

    for n in notifications:
        n["is_read"] = n["id"] in read_ids

    # Sort all compiled notifications in descending chronological order
    notifications.sort(key=lambda x: x["created_at"], reverse=True)
    return notifications


@router.post("/notifications/mark-read")
def mark_notifications_read(
    payload: MarkReadRequest,
    db: Session = Depends(get_db)
):
    """
    Persist read notification IDs for user in UserNotificationRead table
    """
    if not payload.user_id or not payload.notification_ids:
        return {"status": "ok", "marked": 0}

    # Mark persistent AppNotification records as read if present
    app_notif_db_ids = []
    for nid in payload.notification_ids:
        if nid.startswith("app_notif_"):
            try:
                app_notif_db_ids.append(int(nid.replace("app_notif_", "")))
            except ValueError:
                pass
    if app_notif_db_ids:
        db.query(AppNotification).filter(
            AppNotification.id.in_(app_notif_db_ids)
        ).update({AppNotification.is_read: True}, synchronize_session=False)
        db.commit()

    existing = db.query(UserNotificationRead.notification_id).filter(
        UserNotificationRead.user_id == payload.user_id,
        UserNotificationRead.notification_id.in_(payload.notification_ids)
    ).all()
    existing_ids = {e[0] for e in existing}

    new_entries = []
    for nid in payload.notification_ids:
        if nid not in existing_ids:
            new_entries.append(UserNotificationRead(user_id=payload.user_id, notification_id=nid))

    if new_entries:
        db.bulk_save_objects(new_entries)
        db.commit()

    return {"status": "ok", "marked": len(new_entries) + len(app_notif_db_ids)}


@router.get("/google/login")
def google_login(token: str, request: Request):
    """
    Initiate the Google OAuth flow.
    Decrypt user JWT to verify identity and encode their user_id in the 'state' parameter.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    base_url = os.getenv("BACKEND_URL", "http://localhost:8000")
    base_url = base_url.rstrip("/")
    redirect_uri = f"{base_url}/auth/google/callback"
    
    from app.utils.google_auth import get_authorization_url
    auth_url = get_authorization_url(redirect_uri, state=str(user_id))
    return RedirectResponse(auth_url)


@router.get("/auth/google/callback")
def google_callback(code: str, state: str, db: Session = Depends(get_db)):
    """
    Google OAuth Callback endpoint.
    Retrieves the authorization code, exchanges it for refresh token,
    and stores it in the database for the user identified by state (user_id).
    """
    try:
        user_id = int(state)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid state parameter")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    base_url = os.getenv("BACKEND_URL", "http://localhost:8000")
    base_url = base_url.rstrip("/")
    redirect_uri = f"{base_url}/auth/google/callback"

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    frontend_url = frontend_url.rstrip("/")

    try:
        from app.utils.google_auth import get_refresh_token_from_code
        refresh_token = get_refresh_token_from_code(redirect_uri, code)
        if refresh_token:
            user.google_refresh_token = refresh_token
            db.commit()
            db.refresh(user)
        else:
            if not user.google_refresh_token:
                raise Exception("No refresh token returned. Try disconnecting and reconnecting again.")
    except Exception as e:
        err_msg = urllib.parse.quote(str(e))
        return RedirectResponse(f"{frontend_url}/profile-management?google=error&detail={err_msg}")

    return RedirectResponse(f"{frontend_url}/profile-management?google=success")


@router.get("/google/status")
def google_status(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Check if the logged-in user is integrated with Google Calendar."""
    from app.advocate.tasks.routes import get_current_user
    if not authorization:
        return {"connected": False}
    try:
        user = get_current_user(authorization=authorization, db=db)
        return {
            "connected": user.google_refresh_token is not None,
            "email": user.email if user.google_refresh_token else None
        }
    except Exception:
        return {"connected": False}


@router.delete("/google/disconnect")
def google_disconnect(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Disconnect Google Calendar integration for the logged-in user."""
    from app.advocate.tasks.routes import get_current_user
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        user = get_current_user(authorization=authorization, db=db)
        user.google_refresh_token = None
        db.commit()
        return {"message": "Successfully disconnected Google Calendar."}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
