from sqlalchemy.orm import Session
from typing import Optional
from .models import Consultation
from .schemas import ConsultationCreate, ConsultationReschedule, ConsultationStart
from app.authapp.models import User

def find_user_by_name(db: Session, name: str) -> Optional[User]:
    if not name:
        return None
    # Lookup by exact username, email, or a partial match on username
    return db.query(User).filter(
        (User.username.ilike(name)) | 
        (User.email.ilike(name)) |
        (User.username.ilike(name.replace(" ", "")))
    ).first()

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
            query = query.filter(
                (Consultation.client_id == client_id) | 
                (Consultation.client_name.ilike(user.username))
            )
        else:
            query = query.filter(Consultation.client_id == client_id)
    if advocate_id is not None:
        query = query.filter(Consultation.advocate_id == advocate_id)
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
    consultation = get_consultation_by_id(db, consultation_id)
    if not consultation:
        return None
    consultation.date = data.date
    consultation.time = data.time
    consultation.reschedule_reason = data.reason
    consultation.status = "Rescheduled"
    db.commit()
    db.refresh(consultation)
    return consultation

def update_consultation_status(db: Session, consultation_id: int, status: str):
    consultation = get_consultation_by_id(db, consultation_id)
    if not consultation:
        return None
    if status == "Approved" and consultation.status == "Pending Client":
        consultation.reschedule_reason = "Approved by client"
    consultation.status = status
    db.commit()
    db.refresh(consultation)
    return consultation

def start_instant_consultation(db: Session, data: ConsultationStart, advocate_id: Optional[int] = None, advocate_name: Optional[str] = None):
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
        status=data.status if data.status else "Pending"
    )
    db.add(new_consultation)
    db.commit()
    db.refresh(new_consultation)
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
