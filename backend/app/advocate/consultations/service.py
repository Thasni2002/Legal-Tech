from sqlalchemy.orm import Session
from typing import Optional
from .models import Consultation
from .schemas import ConsultationCreate, ConsultationReschedule, ConsultationStart

def get_consultations(
    db: Session,
    client_id: Optional[int] = None,
    advocate_id: Optional[int] = None,
    status: Optional[str] = None
):
    query = db.query(Consultation)
    if client_id is not None:
        query = query.filter(Consultation.client_id == client_id)
    if advocate_id is not None:
        query = query.filter(Consultation.advocate_id == advocate_id)
    if status is not None:
        query = query.filter(Consultation.status == status)
    return query.order_by(Consultation.date.desc(), Consultation.time.desc()).all()

def get_consultation_by_id(db: Session, consultation_id: int):
    return db.query(Consultation).filter(Consultation.id == consultation_id).first()

def create_consultation(db: Session, data: ConsultationCreate):
    new_consultation = Consultation(
        client_id=data.client_id,
        client_name=data.client_name,
        advocate_id=data.advocate_id,
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
    consultation.status = status
    db.commit()
    db.refresh(consultation)
    return consultation

def start_instant_consultation(db: Session, data: ConsultationStart, advocate_id: Optional[int] = None, advocate_name: Optional[str] = None):
    new_consultation = Consultation(
        client_name=data.client_name,
        type=data.type,
        date=data.date,
        time=data.time,
        advocate_id=advocate_id,
        advocate_name=advocate_name,
        status="Scheduled"
    )
    db.add(new_consultation)
    db.commit()
    db.refresh(new_consultation)
    return new_consultation

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
