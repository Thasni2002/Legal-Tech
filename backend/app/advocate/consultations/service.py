from sqlalchemy.orm import Session
from typing import Optional
from fastapi import BackgroundTasks
import asyncio
from app.utils.email import send_email
from .models import Consultation
from .schemas import ConsultationCreate, ConsultationReschedule, ConsultationStart
from app.authapp.models import User
from app.advocate.lawfirm_management.models import Advocate
from app.advocate.case_management.models import Case

def find_user_by_name(db: Session, name: str) -> Optional[User]:
    if not name:
        return None
    
    clean_name = name.lower().replace(" ", "")
    clean_name_underscore = name.lower().replace(" ", "_")
    
    user = db.query(User).filter(
        (User.username.ilike(name)) | 
        (User.email.ilike(name)) |
        (User.username.ilike(clean_name)) |
        (User.username.ilike(clean_name_underscore))
    ).first()

    if user:
        return user
        
    # Fallback 1: Check Advocate table
    advocate = db.query(Advocate).filter(Advocate.advocate_name.ilike(name)).first()
    if advocate and advocate.email_address:
        user_by_adv_email = db.query(User).filter(User.email.ilike(advocate.email_address)).first()
        if user_by_adv_email:
            return user_by_adv_email
            
    # Fallback 2: Check Case table (for clients)
    client_case = db.query(Case).filter(Case.client_name.ilike(name)).first()
    if client_case and client_case.email_id:
        user_by_case_email = db.query(User).filter(User.email.ilike(client_case.email_id)).first()
        if user_by_case_email:
            return user_by_case_email

    return None

def get_consultations(
    db: Session,
    client_id: Optional[int] = None,
    advocate_id: Optional[int] = None,
    status: Optional[str] = None
):
    query = db.query(Consultation)
    if client_id is not None:
        user = db.query(User).filter(User.id == client_id).first()
        if user:
            clean_username = user.username.replace("_", " ")
            query = query.filter(
                (Consultation.client_id == client_id) | 
                (Consultation.client_name.ilike(user.username)) |
                (Consultation.client_name.ilike(clean_username)) |
                (Consultation.client_name.ilike(user.username.replace(" ", "")))
            )
        else:
            query = query.filter(Consultation.client_id == client_id)
    if advocate_id is not None:
        user = db.query(User).filter(User.id == advocate_id).first()
        if user and user.role != "Senior Advocate":
            clean_username = user.username.replace("_", " ")
            query = query.filter(
                (Consultation.advocate_id == advocate_id) |
                (Consultation.advocate_name.ilike(user.username)) |
                (Consultation.advocate_name.ilike(clean_username)) |
                (Consultation.advocate_name.ilike(user.username.replace(" ", "")))
            )
        elif not user:
            query = query.filter(Consultation.advocate_id == advocate_id)
        # If user.role == "Senior Advocate", we do NOT apply the filter, letting them see all cases
    if status is not None:
        query = query.filter(Consultation.status == status)
    return query.order_by(Consultation.date.desc(), Consultation.time.desc()).all()

def get_consultation_by_id(db: Session, consultation_id: int):
    return db.query(Consultation).filter(Consultation.id == consultation_id).first()

def create_consultation(db: Session, data: ConsultationCreate):
    # Lookup client and advocate if they are not provided but names are
    client_id = data.client_id
    if not client_id and data.client_name:
        client = find_user_by_name(db, data.client_name)
        if client:
            client_id = client.id

    advocate_id = data.advocate_id
    if not advocate_id and data.advocate_name:
        # Strip prefixes like "Adv. " when searching
        clean_name = data.advocate_name.replace("Adv.", "").strip()
        advocate = find_user_by_name(db, clean_name)
        if advocate:
            advocate_id = advocate.id

    new_consultation = Consultation(
        client_id=client_id,
        client_name=data.client_name,
        advocate_id=advocate_id,
        advocate_name=data.advocate_name,

        date=data.date,
        time=data.time,
        type=data.type,
        issue=data.issue,
        fee=data.fee,
        status="Pending"
    )
    db.add(new_consultation)
    db.commit()
    db.refresh(new_consultation)
    return new_consultation

def reschedule_consultation(db: Session, consultation_id: int, data: ConsultationReschedule):
    from datetime import datetime
    consultation = get_consultation_by_id(db, consultation_id)
    if not consultation:
        return None
    consultation.date = data.date
    consultation.time = data.time
    consultation.reschedule_reason = data.reason
    consultation.status = "Rescheduled"
    consultation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(consultation)
    return consultation

def update_consultation_status(db: Session, consultation_id: int, status: str):
    from datetime import datetime
    consultation = get_consultation_by_id(db, consultation_id)
    if not consultation:
        return None
    if status == "Approved":
        if consultation.status == "Pending Client":
            consultation.reschedule_reason = "Approved by client"
        elif consultation.status == "Pending":
            consultation.reschedule_reason = "Approved by advocate"
    consultation.status = status
    consultation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(consultation)
    return consultation

def start_instant_consultation(db: Session, data: ConsultationStart, background_tasks: BackgroundTasks, advocate_id: Optional[int] = None, advocate_name: Optional[str] = None):
    # Lookup client ID by client_name
    client_id = None
    if data.client_name:
        client = find_user_by_name(db, data.client_name)
        if client:
            client_id = client.id

    new_consultation = Consultation(
        client_id=client_id,
        client_name=data.client_name,
        type=data.type,
        date=data.date,
        time=data.time,
        advocate_id=advocate_id,
        advocate_name=advocate_name,
        meeting_link=data.meeting_link,

        status=data.status if data.status else "Pending"
    )
    db.add(new_consultation)
    db.commit()
    db.refresh(new_consultation)
    
    # Send Email to client
    if data.client_email:
        advocate_display = advocate_name if advocate_name else "Senior Advocate"
        subject = f"Action Required: Consultation Scheduled with {advocate_display}"
        
        # We assume frontend runs on localhost:3000 for development. You can change this using env vars later.
        frontend_url = "http://localhost:3000"
        
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563EB;">Consultation Scheduled</h2>
                <p>Hello <strong>{data.client_name}</strong>,</p>
                <p>A new consultation has been scheduled for you by {advocate_display}. Please review the details below:</p>
                
                <div style="background-color: #F8FAFC; padding: 15px; border-radius: 8px; border: 1px solid #E2E8F0; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Date:</strong> {data.date}</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> {data.time}</p>
                    <p style="margin: 5px 0;"><strong>Type:</strong> {data.type}</p>
                       <p style="margin: 5px 0;"><strong>Google Meet:</strong> 
                       <a href="{data.meeting_link}">{data.meeting_link}</a></p>
                </div>
                
                <p>Please confirm your availability by clicking one of the buttons below:</p>
                
                <div style="margin-top: 30px; display: flex; gap: 15px;">
                    <a href="{frontend_url}/client-action?id={new_consultation.id}&action=approve" style="background-color: #16A34A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Approve</a>
                    <a href="{frontend_url}/client-action?id={new_consultation.id}&action=reschedule" style="background-color: #D97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-left: 10px;">Reschedule</a>
                </div>

                
                
                <p style="margin-top: 40px; font-size: 12px; color: #64748B;">This is an automated message. Please do not reply directly to this email.</p>
            </body>
        </html>
        """
        
        # fastapi-mail async functions must be awaited in a sync block or wrapped properly.
        # Since we are adding it to BackgroundTasks, we can just pass the async function directly.
        background_tasks.add_task(send_email, to_email=data.client_email, subject=subject, body=html_body)

    return new_consultation

def delete_consultation(db: Session, consultation_id: int) -> bool:
    consultation = get_consultation_by_id(db, consultation_id)
    if not consultation:
        return False
    db.delete(consultation)
    db.commit()
    return True

def get_consultation_stats(db: Session, advocate_id: Optional[int] = None, client_id: Optional[int] = None):
    query = db.query(Consultation)
    if advocate_id is not None:
        query = query.filter(Consultation.advocate_id == advocate_id)
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
