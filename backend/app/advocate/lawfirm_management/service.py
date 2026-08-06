from sqlalchemy.orm import Session
from sqlalchemy import func
import re
import json
from fastapi import HTTPException
from .models import Advocate, AssignedCase
from app.advocate.case_management.models import Case
from app.authapp.models import User, AppNotification


def notify_advocate_case_event(db: Session, advocate_name: str, case_title: str, event_type: str):
    if not advocate_name or not case_title:
        return

    clean_adv_name = advocate_name.strip()
    c_title = case_title.strip()
    if not c_title or c_title.lower() == "assigned case":
        return

    target_user = db.query(User).filter(
        (func.lower(User.username) == clean_adv_name.lower()) |
        (func.lower(func.concat(User.first_name, ' ', User.last_name)) == clean_adv_name.lower()) |
        (func.lower(User.email) == clean_adv_name.lower())
    ).first()

    target_user_id = target_user.id if target_user else None

    if event_type == "assigned":
        notif = AppNotification(
            user_id=target_user_id,
            target_name=clean_adv_name,
            target_role="Junior Advocate",
            icon="⚖️",
            title=f'You have been assigned to case: "{c_title}".',
            color="text-indigo-600",
            bg="bg-indigo-50",
            time_str="Assigned"
        )
        db.add(notif)
        db.commit()
    elif event_type == "unassigned":
        notif = AppNotification(
            user_id=target_user_id,
            target_name=clean_adv_name,
            target_role="Junior Advocate",
            icon="⚠️",
            title=f'Case Unassigned: Senior Advocate unassigned you from case: "{c_title}".',
            color="text-rose-600",
            bg="bg-rose-50",
            time_str="Unassigned"
        )
        db.add(notif)
        db.commit()

    # Find email address for target advocate
    recipient_email = target_user.email if (target_user and target_user.email) else None
    if not recipient_email:
        adv_rec = db.query(Advocate).filter(
            (func.lower(Advocate.advocate_name) == clean_adv_name.lower()) |
            (func.lower(func.concat(Advocate.first_name, ' ', Advocate.last_name)) == clean_adv_name.lower()) |
            (func.lower(Advocate.email_address) == clean_adv_name.lower())
        ).first()
        if adv_rec and adv_rec.email_address:
            recipient_email = adv_rec.email_address

    if recipient_email and "@" in recipient_email:
        try:
            from app.utils.email import send_email_sync
            from app.utils.email_templates import render_base_template
            import threading

            if event_type == "assigned":
                subj = f'⚖️ Case Assigned: "{c_title}"'
                content_html = f"""
                <h2 style="color: #0F172A; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">New Case Assignment</h2>
                <p>Dear <strong>{clean_adv_name}</strong>,</p>
                <p>You have been assigned to case <strong>"{c_title}"</strong> by the Senior Advocate.</p>
                <div style="background-color: #F8FAFC; border-left: 4px solid #2563EB; padding: 16px; margin: 20px 0; border-radius: 6px;">
                    <p style="margin: 0; font-weight: 600; color: #1E293B;">Case Title: {c_title}</p>
                    <p style="margin: 4px 0 0 0; color: #64748B; font-size: 13px;">Status: Active / Assigned</p>
                </div>
                <p>Please log in to your Legal-Tech dashboard to review case details and files.</p>
                """
                html_body = render_base_template(title="Case Assigned", badge_label="Case Assignment", content_html=content_html)
                threading.Thread(target=send_email_sync, kwargs={"to_email": recipient_email, "subject": subj, "body": html_body}, daemon=True).start()

            elif event_type == "unassigned":
                subj = f'⚠️ Case Unassigned: "{c_title}"'
                content_html = f"""
                <h2 style="color: #0F172A; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">Case Unassignment Notice</h2>
                <p>Dear <strong>{clean_adv_name}</strong>,</p>
                <p>Please be informed that the Senior Advocate has unassigned you from case <strong>"{c_title}"</strong>.</p>
                <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 16px; margin: 20px 0; border-radius: 6px;">
                    <p style="margin: 0; font-weight: 600; color: #991B1B;">Case Title: {c_title}</p>
                    <p style="margin: 4px 0 0 0; color: #B91C1C; font-size: 13px;">Status: Unassigned</p>
                </div>
                <p>If you have any questions, please contact your Senior Advocate.</p>
                """
                html_body = render_base_template(title="Case Unassigned", badge_label="Case Unassignment", content_html=content_html)
                threading.Thread(target=send_email_sync, kwargs={"to_email": recipient_email, "subject": subj, "body": html_body}, daemon=True).start()
        except Exception as err:
            print(f"[EMAIL NOTIFICATION ERROR]: {err}")



from .schemas import (
    AdvocateCreate,
    AdvocateUpdate,
    AssignedCaseCreate
)
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Get all advocates
def get_all_advocates(db: Session):
    return db.query(Advocate).all()


# Get single advocate
def get_advocate_by_id(
    db: Session,
    advocate_id: int
):
    return db.query(Advocate).filter(
        Advocate.id == advocate_id
    ).first()


# Create advocate
def create_advocate(
    db: Session,
    advocate: AdvocateCreate
):
    advocate_data = advocate.model_dump(
        by_alias=False,
        exclude={"confirm_password"}
    )

    bar_id = advocate_data.get("bar_council_id")
    if advocate_data.get("role") != "Clerk" and bar_id and bar_id.strip():
        clean_bar_id = bar_id.strip()
        if not re.match(r"^[A-Za-z]{1,5}/\d{1,6}/\d{4}$", clean_bar_id):
            raise HTTPException(status_code=400, detail="Invalid Bar Council ID format (e.g., K/1234/2023)")
        existing_bar = db.query(Advocate).filter(
            func.lower(Advocate.bar_council_id) == clean_bar_id.lower()
        ).first()
        if existing_bar:
            raise HTTPException(status_code=400, detail="This Bar Council ID is already registered.")

    password = advocate_data.pop("password", None)

    if password:
        advocate_data["hashed_password"] = pwd_context.hash(password)
        advocate_data["temp_password"] = password

    new_advocate = Advocate(**advocate_data)

    db.add(new_advocate)
    db.commit()
    db.refresh(new_advocate)

    return new_advocate


# Update advocate
def update_advocate(
    db: Session,
    advocate_id: int,
    advocate_data: AdvocateUpdate
):
    advocate = get_advocate_by_id(
        db,
        advocate_id
    )

    if not advocate:
        return None

    update_data = advocate_data.model_dump(
        exclude_unset=True,
        by_alias=False,
        exclude={"confirm_password"}
    )

    bar_id = update_data.get("bar_council_id")
    if update_data.get("role") != "Clerk" and bar_id and bar_id.strip():
        clean_bar_id = bar_id.strip()
        if not re.match(r"^[A-Za-z]{1,5}/\d{1,6}/\d{4}$", clean_bar_id):
            raise HTTPException(status_code=400, detail="Invalid Bar Council ID format (e.g., K/1234/2023)")
        existing_bar = db.query(Advocate).filter(
            func.lower(Advocate.bar_council_id) == clean_bar_id.lower(),
            Advocate.id != advocate_id
        ).first()
        if existing_bar:
            raise HTTPException(status_code=400, detail="This Bar Council ID is already registered.")

    password = update_data.pop("password", None)


    if password:
        advocate.hashed_password = pwd_context.hash(password)
        advocate.temp_password = password

    for key, value in update_data.items():
        setattr(advocate, key, value)

    db.commit()
    db.refresh(advocate)

    return advocate


# Delete advocate
def delete_advocate(
    db: Session,
    advocate_id: int
):
    advocate = get_advocate_by_id(
        db,
        advocate_id
    )

    if not advocate:
        return None

    # Clean up corresponding user record in `users` table if present
    if advocate.email_address or advocate.advocate_name:
        username = (advocate.advocate_name or "").lower().replace(" ", "")
        user_query = db.query(User).filter(
            (User.email == advocate.email_address) |
            (User.username == username)
        )
        for u in user_query.all():
            db.delete(u)

    db.delete(advocate)
    db.commit()

    return {
        "message": "Advocate deleted successfully"
    }


# Create assigned case
def create_assigned_case(
    db: Session,
    case_data: AssignedCaseCreate
):
    case_dict = case_data.model_dump()

    case_dict["assigned_documents"] = json.dumps(
        case_dict.get("assigned_documents", []) if isinstance(case_dict.get("assigned_documents"), (list, dict)) else []
    )
    case_dict["appearances"] = json.dumps(
        case_dict.get("appearances", []) if isinstance(case_dict.get("appearances"), (list, dict)) else []
    )

    # If documents are being assigned, validate that the advocate is already assigned to this case
    raw_docs = case_data.assigned_documents
    advocate_name = case_data.advocate_name
    if raw_docs and advocate_name:
        # Check whether a prior assignment exists for this case + advocate
        case_id_val = case_data.case_id
        case_number_val = (case_data.case_number or "").strip()
        prior = None
        if case_id_val:
            prior = db.query(AssignedCase).filter(
                (AssignedCase.case_id == case_id_val) |
                (
                    AssignedCase.case_id.is_(None) &
                    (AssignedCase.case_number == case_number_val)
                ),
                AssignedCase.advocate_name == advocate_name
            ).first()
        elif case_number_val:
            prior = db.query(AssignedCase).filter(
                AssignedCase.case_number == case_number_val,
                AssignedCase.advocate_name == advocate_name
            ).first()
    # Check for existing assignment to prevent duplicates.
    # IMPORTANT: Filter by BOTH case and advocate_name — different advocates on the
    # same case must each have their own separate AssignedCase record.
    existing = None
    adv_name = (case_data.advocate_name or "").strip()
    if case_data.case_id and adv_name:
        cond = (
            (AssignedCase.case_id == case_data.case_id) &
            (AssignedCase.advocate_name == adv_name)
        )
        if case_data.case_number and case_data.case_number.strip():
            cond = cond | (
                AssignedCase.case_id.is_(None) &
                (AssignedCase.case_number == case_data.case_number.strip()) &
                (AssignedCase.advocate_name == adv_name)
            )
        existing = db.query(AssignedCase).filter(cond).first()
    elif case_data.case_number and case_data.case_number.strip() and adv_name:
        existing = db.query(AssignedCase).filter(
            AssignedCase.case_number == case_data.case_number.strip(),
            AssignedCase.advocate_name == adv_name
        ).first()

    if existing:
        # Update fields instead of inserting a duplicate
        existing.case_id = case_dict.get("case_id", existing.case_id)
        existing.case_name = case_dict.get("case_name") or existing.case_name
        existing.case_title = case_dict.get("case_title") or existing.case_title
        existing.case_number = case_dict.get("case_number", existing.case_number)
        existing.advocate_name = case_dict.get("advocate_name", existing.advocate_name)
        existing.practice_court = case_dict.get("practice_court") or existing.practice_court
        existing.priority = case_dict.get("priority") or existing.priority
        existing.due_date = case_dict.get("due_date") or existing.due_date
        existing.assignment_notes = case_dict.get("assignment_notes") or existing.assignment_notes
        existing.status = case_dict.get("status", existing.status)
        existing.client_name = case_dict.get("client_name") or existing.client_name
        existing.secondary_advocate_name = case_dict.get("secondary_advocate_name", existing.secondary_advocate_name)


        # MERGE documents — add incoming docs not already present (de-duped by filename).
        # This prevents a single-document assignment from wiping out all other documents.
        incoming_docs = json.loads(case_dict.get("assigned_documents", "[]"))
        current_docs = json.loads(existing.assigned_documents or "[]")
        current_files = {d.get("file") for d in current_docs if d.get("file")}
        for doc in incoming_docs:
            if doc.get("file") and doc["file"] not in current_files:
                current_docs.append(doc)
                current_files.add(doc["file"])
        existing.assigned_documents = json.dumps(current_docs)

        db.commit()
        db.refresh(existing)

        c_title = existing.case_title or existing.case_name or ""
        if existing.advocate_name:
            notify_advocate_case_event(db, existing.advocate_name, c_title, "assigned")
        if existing.secondary_advocate_name:
            notify_advocate_case_event(db, existing.secondary_advocate_name, c_title, "assigned")

        existing.assigned_documents = json.loads(existing.assigned_documents or "[]")
        existing.appearances = json.loads(existing.appearances or "[]")
        return existing

    new_case = AssignedCase(
        **case_dict
    )

    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    c_title = new_case.case_title or new_case.case_name or ""
    if new_case.advocate_name:
        notify_advocate_case_event(db, new_case.advocate_name, c_title, "assigned")
    if new_case.secondary_advocate_name:
        notify_advocate_case_event(db, new_case.secondary_advocate_name, c_title, "assigned")

    new_case.assigned_documents = json.loads(
        new_case.assigned_documents or "[]"
    )
    new_case.appearances = json.loads(
        new_case.appearances or "[]"
    )

    return new_case


# Get all assigned cases
def get_assigned_cases(db: Session):
    results = (
        db.query(AssignedCase, Advocate.profile_image, Case.case_id, Case.case_no)
        .outerjoin(
            Advocate,
            AssignedCase.advocate_name == Advocate.advocate_name
        )
        .outerjoin(
            Case,
            AssignedCase.case_id == Case.id
        )
        .filter(
            ~func.lower(func.coalesce(AssignedCase.status, '')).in_(['unassigned', 'inactive', 'removed'])
        )
        .all()
    )

    assigned_cases = []

    for case, profile_image, case_id_code, case_no in results:
        case.assigned_documents = json.loads(
            case.assigned_documents or "[]"
        )
        case.appearances = json.loads(
            case.appearances or "[]"
        )

        # Add profile image and case_id_code dynamically
        case.profile_image = profile_image
        case.case_id_code = case_id_code or (f"CASE-#{case.case_id}" if case.case_id else None)
        if not case.case_number and case_no:
            case.case_number = case_no

        assigned_cases.append(case)

    return assigned_cases

# Get single assigned case
def get_assigned_case_by_id(
    db: Session,
    case_id: int
):
    result = (
        db.query(AssignedCase, Advocate.profile_image, Case.case_id, Case.case_no)
        .outerjoin(Advocate, AssignedCase.advocate_name == Advocate.advocate_name)
        .outerjoin(Case, AssignedCase.case_id == Case.id)
        .filter(AssignedCase.id == case_id)
        .first()
    )

    if result:
        case, profile_image, case_id_code, case_no = result
        case.assigned_documents = json.loads(
            case.assigned_documents or "[]"
        )
        case.appearances = json.loads(
            case.appearances or "[]"
        )
        case.profile_image = profile_image
        case.case_id_code = case_id_code or (f"CASE-#{case.case_id}" if case.case_id else None)
        if not case.case_number and case_no:
            case.case_number = case_no
        return case

    return None



# Delete assigned case
def delete_assigned_case(
    db: Session,
    case_id: int
):
    assigned_case = db.query(
        AssignedCase
    ).filter(
        AssignedCase.id == case_id
    ).first()

    if not assigned_case:
        return None

    assigned_case.status = "Unassigned"
    db.commit()

    c_title = assigned_case.case_title or assigned_case.case_name or ""
    if assigned_case.advocate_name:
        notify_advocate_case_event(db, assigned_case.advocate_name, c_title, "unassigned")
    if assigned_case.secondary_advocate_name:
        notify_advocate_case_event(db, assigned_case.secondary_advocate_name, c_title, "unassigned")

    return {
        "message": "Assigned case unassigned successfully"
    }


# Update assigned case
def update_assigned_case(
    db: Session,
    case_id: int,
    case_data: AssignedCaseCreate
):
    assigned_case = get_assigned_case_by_id(
        db,
        case_id
    )

    if not assigned_case:
        return None

    case_dict = case_data.model_dump(
        exclude_unset=True
    )

    if "assigned_documents" in case_dict and isinstance(case_dict["assigned_documents"], (list, dict)):
        case_dict["assigned_documents"] = json.dumps(
            case_dict.get("assigned_documents", [])
        )
    if "appearances" in case_dict and isinstance(case_dict["appearances"], (list, dict)):
        case_dict["appearances"] = json.dumps(
            case_dict.get("appearances", [])
        )

    for key, value in case_dict.items():
        setattr(assigned_case, key, value)

    if isinstance(assigned_case.assigned_documents, (list, dict)):
        assigned_case.assigned_documents = json.dumps(assigned_case.assigned_documents)
    if isinstance(assigned_case.appearances, (list, dict)):
        assigned_case.appearances = json.dumps(assigned_case.appearances)

    db.commit()
    db.refresh(assigned_case)

    assigned_case.assigned_documents = json.loads(
        assigned_case.assigned_documents or "[]"
    )
    assigned_case.appearances = json.loads(
        assigned_case.appearances or "[]"
    )


    return assigned_case