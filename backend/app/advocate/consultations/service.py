# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from typing import Optional
from fastapi import BackgroundTasks

from app.utils.email import send_email, send_email_sync
from .models import Consultation
from .schemas import ConsultationCreate, ConsultationReschedule, ConsultationStart
from app.authapp.models import User
from app.advocate.case_management.models import Case

def find_user_by_name(db: Session, name: str) -> Optional[User]:
    if not name:
        return None
    
    clean_name = name.lower().replace(" ", "")
    clean_name_underscore = name.lower().replace(" ", "_")
    
    # pyrefly: ignore [missing-import]
    from sqlalchemy import func
    user = db.query(User).filter(
        (User.username.ilike(name)) | 
        (User.email.ilike(name)) |
        (User.username.ilike(clean_name)) |
        (User.username.ilike(clean_name_underscore)) |
        (User.first_name.ilike(name)) |
        (User.last_name.ilike(name)) |
        (func.concat(User.first_name, ' ', User.last_name).ilike(name)) |
        (func.concat(User.first_name, User.last_name).ilike(clean_name))
    ).first()

    if user:
        return user
        
    # Fallback 2: Check Case table (for clients)
    client_case = db.query(Case).filter(
        (Case.client_name.ilike(name)) |
        (Case.client_name.ilike(f"%{name}%"))
    ).first()
    if client_case and client_case.email_id:
        user_by_case_email = db.query(User).filter(User.email.ilike(client_case.email_id)).first()
        if user_by_case_email:
            return user_by_case_email

    return None

def find_client_email_by_name(db: Session, client_name: str = "", client_id: Optional[int] = None, explicit_email: Optional[str] = None) -> Optional[str]:
    if explicit_email and "@" in explicit_email:
        return explicit_email.strip()

    if client_id:
        u = db.query(User).filter(User.id == client_id).first()
        if u and u.email and "@" in u.email:
            return u.email.strip()

    if not client_name:
        return None

    clean = client_name.strip()
    u = find_user_by_name(db, clean)
    if u and u.email and "@" in u.email:
        return u.email.strip()

    # Check Client model in client_management
    try:
        from app.advocate.client_management.models import Client as ClientModel
        c = db.query(ClientModel).filter(
            (ClientModel.full_name.ilike(clean)) |
            (ClientModel.full_name.ilike(f"%{clean}%"))
        ).first()
        if c and c.email and "@" in c.email:
            return c.email.strip()
    except Exception:
        pass

    # Check Case model
    try:
        from app.advocate.client_management.models import Case as ClientCaseModel
        cs = db.query(ClientCaseModel).filter(
            (ClientCaseModel.client_name.ilike(clean)) |
            (ClientCaseModel.client_name.ilike(f"%{clean}%"))
        ).first()
        if cs and hasattr(cs, "email_id") and cs.email_id and "@" in cs.email_id:
            return cs.email_id.strip()
    except Exception:
        pass

    try:
        cs = db.query(Case).filter(
            (Case.client_name.ilike(clean)) |
            (Case.client_name.ilike(f"%{clean}%"))
        ).first()
        if cs and hasattr(cs, "email_id") and cs.email_id and "@" in cs.email_id:
            return cs.email_id.strip()
    except Exception:
        pass

    return None

def get_consultations(
    db: Session,
    client_id: Optional[int] = None,
    status: Optional[str] = None
):
    query = db.query(Consultation)
    if client_id is not None:
        user = db.query(User).filter(User.id == client_id).first()
        if user:
            clean_username = user.username.replace("_", " ")
            first_name = (user.first_name or "").strip()
            last_name = (user.last_name or "").strip()
            full_name = f"{first_name} {last_name}".strip()

            from sqlalchemy import or_
            filters = [
                (Consultation.client_id == client_id),
                (Consultation.client_name.ilike(user.username)),
                (Consultation.client_name.ilike(clean_username)),
                (Consultation.client_name.ilike(user.username.replace(" ", "")))
            ]
            if first_name:
                filters.append(Consultation.client_name.ilike(first_name))
                filters.append(Consultation.client_name.ilike(f"%{first_name}%"))
            if last_name:
                filters.append(Consultation.client_name.ilike(last_name))
            if full_name:
                filters.append(Consultation.client_name.ilike(full_name))
                filters.append(Consultation.client_name.ilike(f"%{full_name}%"))
            
            client_cases = db.query(Case).filter(
                (Case.email_id.ilike(user.email if user.email else "")) |
                (Case.client_name.ilike(user.username)) |
                (Case.client_name.ilike(clean_username)) |
                (Case.client_name.ilike(first_name if first_name else "___never___")) |
                (Case.client_name.ilike(full_name if full_name else "___never___"))
            ).all()
            for c in client_cases:
                if c.client_name:
                    filters.append(Consultation.client_name.ilike(c.client_name))
                    filters.append(Consultation.client_name.ilike(f"%{c.client_name}%"))

            query = query.filter(or_(*filters))

            # Auto-link unlinked consultations to user.id if matched
            matched_consults = query.all()
            updated_any = False
            for consult in matched_consults:
                if consult.client_id is None:
                    consult.client_id = client_id
                    updated_any = True
            if updated_any:
                try:
                    db.commit()
                except Exception:
                    db.rollback()
        else:
            query = query.filter(Consultation.client_id == client_id)
    
    if status is not None:
        query = query.filter(Consultation.status == status)
    return query.order_by(Consultation.date.desc(), Consultation.time.desc()).all()

def get_consultation_by_id(db: Session, consultation_id: int):
    return db.query(Consultation).filter(Consultation.id == consultation_id).first()

def create_consultation(db: Session, data: ConsultationCreate, background_tasks: Optional[BackgroundTasks] = None):
    # Lookup client if client_id is not provided
    client_id = data.client_id
    if not client_id and data.client_name:
        client = find_user_by_name(db, data.client_name)
        if client:
            client_id = client.id

    meet_link = data.meeting_link
    if not meet_link and ("video" in (data.type or "").lower()):
        from app.utils.google_calendar import generate_google_meet_link
        meet_link = generate_google_meet_link(data.client_name, str(data.date), str(data.time))

    new_consultation = Consultation(
        client_id=client_id,
        client_name=data.client_name,
        date=data.date,
        time=data.time,
        type=data.type,
        meeting_link=meet_link,
        issue=data.issue,
        fee=data.fee,
        status="Pending Advocate"
    )
    db.add(new_consultation)
    db.commit()
    db.refresh(new_consultation)

    import os
    advocate_recipients = set()
    
    # Query all senior advocates & admins
    advocate_users = db.query(User).filter(
        (User.role.ilike("%senior advocate%")) |
        (User.role.ilike("%senioradvocate%")) |
        (User.role.ilike("%admin%")) |
        (User.username == "admin")
    ).all()
    for adv in advocate_users:
        if adv and adv.email and "@" in adv.email:
            advocate_recipients.add(adv.email.strip())

    mail_user = os.getenv("MAIL_USERNAME")
    if mail_user and "@" in mail_user:
        advocate_recipients.add(mail_user.strip())
    advocate_recipients.add("shiyaxxx3@gmail.com")

    # Resolve Client Email
    client_email = find_client_email_by_name(db, data.client_name, client_id, data.client_email)

    print(f"[BOOKING EMAIL TRIGGER] Advocate recipients: {list(advocate_recipients)}, Client email: {client_email}")

    if background_tasks:
        from app.utils.email_templates import build_client_booking_email, render_base_template
        advocate_html = build_client_booking_email(
            client_name=data.client_name,
            date_str=str(data.date),
            time_str=str(data.time),
            type_str=data.type or "Consultation",
            issue=data.issue or "",
            consultation_id=new_consultation.id,
            frontend_url="http://localhost:3000"
        )
        for target_email in advocate_recipients:
            background_tasks.add_task(
                send_email_sync,
                to_email=target_email,
                subject=f"Action Required: New Consultation Request from {data.client_name}",
                body=advocate_html
            )

        # Send confirmation email to client if available
        if client_email:
            client_html = render_base_template(
                title="Consultation Request Received",
                badge_label="Booking Received",
                content_html=f"""
                <h2 style="color: #0F172A; font-size: 22px; font-weight: 700; margin-top: 0;">Consultation Booking Request Received</h2>
                <p>Dear <strong>{data.client_name}</strong>,</p>
                <p>Your request for a legal consultation has been submitted successfully and is currently pending advocate review.</p>

                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; margin: 24px 0;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="padding-bottom: 12px; color: #64748B; font-size: 13px; font-weight: 600; text-transform: uppercase;" width="35%">Requested Date & Time</td>
                      <td style="padding-bottom: 12px; color: #0F172A; font-weight: 700;" width="65%">{data.date} at {data.time}</td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 12px; color: #64748B; font-size: 13px; font-weight: 600; text-transform: uppercase;">Meeting Type</td>
                      <td style="padding-bottom: 12px; color: #0F172A; font-weight: 600;">{data.type or 'Consultation'}</td>
                    </tr>
                    <tr>
                      <td style="color: #64748B; font-size: 13px; font-weight: 600; text-transform: uppercase;">Status</td>
                      <td style="color: #D97706; font-weight: 700;">Pending Advocate Review</td>
                    </tr>
                  </table>
                </div>

                <p>You will receive a notification email as soon as the advocate approves or updates your consultation details.</p>
                """
            )
            background_tasks.add_task(
                send_email_sync,
                to_email=client_email,
                subject=f"Consultation Booking Received - Legal-Tech",
                body=client_html
            )

    return new_consultation

def process_public_action(db: Session, consultation_id: int, data: any, background_tasks: Optional[BackgroundTasks] = None):
    consultation = get_consultation_by_id(db, consultation_id)
    if not consultation:
        return None

    if data.action == "approve":
        consultation.status = "Approved"
        consultation.reschedule_reason = "Approved via email quick action"
    elif data.action == "reschedule":
        if data.date:
            consultation.date = data.date
        if data.time:
            consultation.time = data.time
        if data.reason:
            consultation.reschedule_reason = data.reason
        else:
            consultation.reschedule_reason = "Rescheduled via email quick action"
        consultation.status = "Rescheduled"

    from datetime import datetime
    consultation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(consultation)

    # ── Notify BOTH Client and Senior Advocate / Admin via Email ──────────────
    if background_tasks:
        import os
        from app.utils.email_templates import build_consultation_email, render_base_template

        # 1. Resolve Client Email
        c_email = find_client_email_by_name(db, consultation.client_name, consultation.client_id)

        # 2. Resolve Advocate / Admin Emails
        advocate_recipients = set()
        advocate_users = db.query(User).filter(
            (User.role.ilike("%senior advocate%")) |
            (User.role.ilike("%senioradvocate%")) |
            (User.role.ilike("%admin%")) |
            (User.username == "admin")
        ).all()
        for adv in advocate_users:
            if adv and adv.email and "@" in adv.email:
                advocate_recipients.add(adv.email.strip())

        mail_user = os.getenv("MAIL_USERNAME")
        if mail_user and "@" in mail_user:
            advocate_recipients.add(mail_user.strip())
        advocate_recipients.add("shiyaxxx3@gmail.com")

        # HTML Body for Client
        client_html = build_consultation_email(
            client_name=consultation.client_name,
            advocate_name="Senior Advocate",
            date_str=str(consultation.date),
            time_str=str(consultation.time),
            meeting_link=consultation.meeting_link or "",
            consultation_id=consultation.id,
            frontend_url="http://localhost:3000"
        )

        # Send to Client if found
        if c_email:
            subj = f"Consultation Appointment {consultation.status} - Legal-Tech"
            background_tasks.add_task(send_email_sync, to_email=c_email, subject=subj, body=client_html)
            print(f"[PUBLIC ACTION EMAIL] Sent notification to client: {c_email}")

        # Send to Advocates / Admins
        adv_subj = f"Consultation Status Updated ({consultation.status}) - {consultation.client_name}"
        adv_html = render_base_template(
            title=adv_subj,
            badge_label="Status Updated",
            content_html=f"""
            <h2 style="color: #0F172A; font-size: 22px; font-weight: 700; margin-top: 0;">Consultation {consultation.status}</h2>
            <p>The consultation appointment for client <strong>{consultation.client_name}</strong> has been updated to <strong>{consultation.status}</strong>.</p>
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0;">🗓️ <strong>Date & Time:</strong> {consultation.date} at {consultation.time}</p>
              <p style="margin: 0 0 8px 0;">💬 <strong>Mode:</strong> {consultation.type}</p>
              <p style="margin: 0;">🔗 <strong>Meeting Link:</strong> <a href="{consultation.meeting_link}" target="_blank">{consultation.meeting_link or 'N/A'}</a></p>
            </div>
            """
        )
        for target_email in advocate_recipients:
            background_tasks.add_task(send_email_sync, to_email=target_email, subject=adv_subj, body=adv_html)
            print(f"[PUBLIC ACTION EMAIL] Sent notification to advocate: {target_email}")
    # ──────────────────────────────────────────────────────────────────────────

    return {
        "id": consultation.id,
        "client_name": consultation.client_name,
        "date": str(consultation.date),
        "time": str(consultation.time),
        "type": consultation.type,
        "status": consultation.status,
        "meeting_link": consultation.meeting_link,
        "reschedule_reason": consultation.reschedule_reason
    }

def reschedule_consultation(db: Session, consultation_id: int, data: ConsultationReschedule, background_tasks: Optional[BackgroundTasks] = None):
    from datetime import datetime
    consultation = get_consultation_by_id(db, consultation_id)
    if not consultation:
        return None
    consultation.date = data.date
    consultation.time = data.time
    consultation.reschedule_reason = data.reason
    consultation.status = data.status if data.status else "Rescheduled"
    consultation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(consultation)

    if background_tasks:
        import os
        from app.utils.email_templates import build_consultation_email, render_base_template

        c_email = find_client_email_by_name(db, consultation.client_name, consultation.client_id)
        if c_email:
            client_html = build_consultation_email(
                client_name=consultation.client_name,
                advocate_name="Senior Advocate",
                date_str=str(consultation.date),
                time_str=str(consultation.time),
                meeting_link=consultation.meeting_link or "",
                consultation_id=consultation.id,
                frontend_url="http://localhost:3000"
            )
            background_tasks.add_task(send_email_sync, to_email=c_email, subject=f"Consultation Rescheduled to {consultation.date} at {consultation.time}", body=client_html)

        advocate_recipients = set()
        advocate_users = db.query(User).filter(
            (User.role.ilike("%senior advocate%")) |
            (User.role.ilike("%senioradvocate%")) |
            (User.role.ilike("%admin%")) |
            (User.username == "admin")
        ).all()
        for adv in advocate_users:
            if adv and adv.email and "@" in adv.email:
                advocate_recipients.add(adv.email.strip())

        mail_user = os.getenv("MAIL_USERNAME")
        if mail_user and "@" in mail_user:
            advocate_recipients.add(mail_user.strip())
        advocate_recipients.add("shiyaxxx3@gmail.com")

        adv_subj = f"Consultation Rescheduled - {consultation.client_name}"
        adv_html = render_base_template(
            title=adv_subj,
            badge_label="Rescheduled",
            content_html=f"""
            <h2 style="color: #0F172A; font-size: 22px; font-weight: 700; margin-top: 0;">Consultation Rescheduled</h2>
            <p>The consultation appointment for client <strong>{consultation.client_name}</strong> has been rescheduled.</p>
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0;">🗓️ <strong>New Date & Time:</strong> {consultation.date} at {consultation.time}</p>
              <p style="margin: 0 0 8px 0;">💬 <strong>Mode:</strong> {consultation.type}</p>
              <p style="margin: 0 0 8px 0;">📝 <strong>Reason / Note:</strong> {consultation.reschedule_reason or 'None'}</p>
            </div>
            """
        )
        for target_email in advocate_recipients:
            background_tasks.add_task(send_email_sync, to_email=target_email, subject=adv_subj, body=adv_html)

    return consultation

def update_consultation_status(db: Session, consultation_id: int, status: str, background_tasks: Optional[BackgroundTasks] = None):
    from datetime import datetime
    consultation = get_consultation_by_id(db, consultation_id)
    if not consultation:
        return None
    if status == "Approved":
        if consultation.status == "Pending Client":
            consultation.reschedule_reason = "Approved by client"
        elif consultation.status == "Pending":
            consultation.reschedule_reason = "Approved by advocate"
        elif consultation.status == "Pending Advocate":
            consultation.reschedule_reason = "Approved client reschedule"
    consultation.status = status
    consultation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(consultation)

    if background_tasks:
        import os
        from app.utils.email_templates import build_consultation_email, render_base_template

        c_email = find_client_email_by_name(db, consultation.client_name, consultation.client_id)
        if c_email:
            html_body = build_consultation_email(
                client_name=consultation.client_name,
                advocate_name="Legal Advocate",
                date_str=str(consultation.date),
                time_str=str(consultation.time),
                meeting_link=consultation.meeting_link or "",
                consultation_id=consultation.id,
                frontend_url="http://localhost:3000"
            )
            background_tasks.add_task(send_email_sync, to_email=c_email, subject=f"Consultation Status Updated: {status}", body=html_body)

        advocate_recipients = set()
        advocate_users = db.query(User).filter(
            (User.role.ilike("%senior advocate%")) |
            (User.role.ilike("%senioradvocate%")) |
            (User.role.ilike("%admin%")) |
            (User.username == "admin")
        ).all()
        for adv in advocate_users:
            if adv and adv.email and "@" in adv.email:
                advocate_recipients.add(adv.email.strip())

        mail_user = os.getenv("MAIL_USERNAME")
        if mail_user and "@" in mail_user:
            advocate_recipients.add(mail_user.strip())
        advocate_recipients.add("shiyaxxx3@gmail.com")

        adv_subj = f"Consultation Status Updated ({status}) - {consultation.client_name}"
        adv_html = render_base_template(
            title=adv_subj,
            badge_label="Status Updated",
            content_html=f"""
            <h2 style="color: #0F172A; font-size: 22px; font-weight: 700; margin-top: 0;">Consultation {status}</h2>
            <p>The consultation appointment for client <strong>{consultation.client_name}</strong> has been updated to <strong>{status}</strong>.</p>
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0;">🗓️ <strong>Date & Time:</strong> {consultation.date} at {consultation.time}</p>
              <p style="margin: 0 0 8px 0;">💬 <strong>Mode:</strong> {consultation.type}</p>
              <p style="margin: 0;">🔗 <strong>Meeting Link:</strong> <a href="{consultation.meeting_link}" target="_blank">{consultation.meeting_link or 'N/A'}</a></p>
            </div>
            """
        )
        for target_email in advocate_recipients:
            background_tasks.add_task(send_email_sync, to_email=target_email, subject=adv_subj, body=adv_html)

    return consultation

def start_instant_consultation(db: Session, data: ConsultationStart, background_tasks: BackgroundTasks):
    # ── Duplicate time-slot check ──────────────────────────────
    # Block booking if ANY client already has this date + time slot
    existing = db.query(Consultation).filter(
        Consultation.date == data.date,
        Consultation.time == data.time,
    ).first()

    if existing:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=409,
            detail=f"This time slot is already booked for \"{existing.client_name}\". Please choose a different time."
        )
    # ──────────────────────────────────────────────────────────

    # Lookup client ID by client_email or client_name
    client_id = None
    if data.client_email:
        client = db.query(User).filter(User.email.ilike(data.client_email)).first()
        if client:
            client_id = client.id

    if not client_id and data.client_name:
        client = find_user_by_name(db, data.client_name)
        if client:
            client_id = client.id

    new_consultation = Consultation(
        client_id=client_id,
        client_name=data.client_name,
        type=data.type,
        date=data.date,
        time=data.time,
        meeting_link=data.meeting_link,
        status=data.status if data.status else "Pending Client"
    )
    db.add(new_consultation)
    db.commit()
    db.refresh(new_consultation)
    
    # Resolve target email for client notification
    print(f"[SCHEDULE DEBUG] client_name='{data.client_name}', client_email='{data.client_email}', client_id={client_id}")
    to_email = find_client_email_by_name(db, data.client_name, client_id, data.client_email)
    print(f"[SCHEDULE DEBUG] find_client_email_by_name resolved to: {to_email!r}")

    # If still not resolved, try direct client_email if it looks valid
    if not to_email and data.client_email and "@" in str(data.client_email):
        to_email = data.client_email.strip()
        print(f"[SCHEDULE DEBUG] Falling back to direct client_email: {to_email}")

    # Send Email to client
    if to_email:
        subject = "Action Required: New Meeting Scheduled"
        frontend_url = "http://localhost:3000"
        from app.utils.email_templates import build_consultation_email, render_base_template

        html_body = render_base_template(
            title="New Consultation Appointment Scheduled",
            badge_label="Meeting Scheduled",
            content_html=f"""
            <h2 style="color: #0F172A; font-size: 22px; font-weight: 700; margin-top: 0;">New Consultation Scheduled</h2>
            <p>Dear <strong>{data.client_name}</strong>,</p>
            <p>Your senior advocate has scheduled a new consultation appointment for you. Please review the details below and confirm or request a different time.</p>

            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-bottom: 12px; color: #64748B; font-size: 13px; font-weight: 600; text-transform: uppercase;" width="35%">Date &amp; Time</td>
                  <td style="padding-bottom: 12px; color: #0F172A; font-weight: 700;" width="65%">{data.date} at {data.time}</td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px; color: #64748B; font-size: 13px; font-weight: 600; text-transform: uppercase;">Meeting Type</td>
                  <td style="padding-bottom: 12px; color: #0F172A; font-weight: 600;">{data.type or 'Consultation'}</td>
                </tr>
                {'<tr><td style="color: #64748B; font-size: 13px; font-weight: 600; text-transform: uppercase; padding-bottom: 12px;">Meeting Link</td><td style="padding-bottom: 12px;"><a href="' + str(data.meeting_link) + '" style="color: #2563EB; font-weight: 700;">' + str(data.meeting_link) + '</a></td></tr>' if data.meeting_link else ''}
                <tr>
                  <td style="color: #64748B; font-size: 13px; font-weight: 600; text-transform: uppercase;">Status</td>
                  <td style="color: #D97706; font-weight: 700;">Pending Your Confirmation</td>
                </tr>
              </table>
            </div>

            <p>Please log in to your account to <strong>confirm</strong> or <strong>request a different time</strong>.</p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="{frontend_url}/client-consultation" 
                 style="background: linear-gradient(135deg, #2563EB, #1D4ED8); color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block;">
                View Appointment
              </a>
            </div>
            """
        )

        background_tasks.add_task(send_email_sync, to_email=to_email, subject=subject, body=html_body)
        print(f"[SCHEDULE EMAIL TRIGGER] Queued consultation email to client: {to_email}")
    else:
        print(f"[SCHEDULE EMAIL WARNING] Could not resolve email address for client '{data.client_name}' — no email sent to client")

    return new_consultation


def delete_consultation(db: Session, consultation_id: int) -> bool:
    consultation = get_consultation_by_id(db, consultation_id)
    if not consultation:
        return False
    db.delete(consultation)
    db.commit()
    return True

def get_consultation_stats(db: Session, client_id: Optional[int] = None):
    query = db.query(Consultation)

    if client_id is not None:
        query = query.filter(Consultation.client_id == client_id)
    
    all_consults = query.all()
    
    total = len(all_consults)
    video = len([c for c in all_consults if c.type in ["Video Call", "Video Consultation"]])
    chat = len([c for c in all_consults if c.type in ["Chat", "Chat Consultation"]])
    
    return {
        "total_consultations": total,
        "video_calls": video,
        "chat_consultations": chat
    }
