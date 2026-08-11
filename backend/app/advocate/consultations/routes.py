from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import SessionLocal
from .schemas import (
    ConsultationCreate, ConsultationStart, ConsultationReschedule, ConsultationUpdateStatus, 
    ConsultationOut, ConsultationStats, MeetingNoteCreate, MeetingNoteUpdate, MeetingNoteOut
)
from . import service
from app.utils.google_calendar import generate_google_meet_link

router = APIRouter(prefix="/consultations", tags=["Consultations"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("", response_model=List[ConsultationOut])
def get_consultations(
    client_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return service.get_consultations(db, client_id=client_id, status=status)

from pydantic import BaseModel

class PublicActionData(BaseModel):
    action: str
    date: Optional[str] = None
    time: Optional[str] = None
    reason: Optional[str] = None

@router.post("/book", response_model=ConsultationOut)
def book_consultation(
    data: ConsultationCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    return service.create_consultation(db, data, background_tasks)

@router.get("/{consultation_id}/public-details")
def get_public_details(consultation_id: int, db: Session = Depends(get_db)):
    consultation = service.get_consultation_by_id(db, consultation_id)
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return {
        "id": consultation.id,
        "client_name": consultation.client_name,
        "date": str(consultation.date),
        "time": str(consultation.time),
        "type": consultation.type,
        "status": consultation.status,
        "meeting_link": consultation.meeting_link,
        "issue": consultation.issue,
        "fee": consultation.fee
    }

@router.post("/{consultation_id}/public-action")
def perform_public_action(
    consultation_id: int,
    data: PublicActionData,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    result = service.process_public_action(db, consultation_id, data, background_tasks)
    if not result:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return result

@router.post("/start", response_model=ConsultationOut)
def start_consultation(
    data: ConsultationStart,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    return service.start_instant_consultation(db, data, background_tasks)

@router.put("/{consultation_id}/status", response_model=ConsultationOut)
def update_status(consultation_id: int, data: ConsultationUpdateStatus, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    consultation = service.update_consultation_status(db, consultation_id, data.status, background_tasks)
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return consultation

@router.put("/{consultation_id}/reschedule", response_model=ConsultationOut)
def reschedule(consultation_id: int, data: ConsultationReschedule, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    consultation = service.reschedule_consultation(db, consultation_id, data, background_tasks)
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return consultation

@router.get("/generate-meet-link")
def generate_meet_link(
    client_name: str = Query(...),
    date: str = Query(...),
    time: str = Query(...),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    from app.advocate.tasks.routes import get_current_user
    user_id = None
    if authorization:
        try:
            current_user = get_current_user(authorization=authorization, db=db)
            user_id = current_user.id
        except Exception:
            pass
            
    meet_link = generate_google_meet_link(client_name=client_name, date_str=date, time_str=time, user_id=user_id)
    return {"meeting_link": meet_link}


@router.get("/stats", response_model=ConsultationStats)
def get_stats(
    client_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return service.get_consultation_stats(db, client_id=client_id)

@router.delete("/{consultation_id}", status_code=204)
def delete_consultation(consultation_id: int, db: Session = Depends(get_db)):
    success = service.delete_consultation(db, consultation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return

# --- MEETING NOTES ENDPOINTS ---

@router.post("/notes", response_model=MeetingNoteOut)
def create_meeting_note(
    data: MeetingNoteCreate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    from app.advocate.tasks.routes import get_current_user
    current_user = None
    if authorization:
        try:
            current_user = get_current_user(authorization=authorization, db=db)
        except Exception:
            pass
    return service.create_meeting_note(db, data, current_user=current_user)

@router.get("/notes", response_model=List[MeetingNoteOut])
def get_meeting_notes(
    consultation_id: Optional[int] = Query(None),
    case_id: Optional[int] = Query(None),
    client_id: Optional[int] = Query(None),
    advocate_id: Optional[int] = Query(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    from app.advocate.tasks.routes import get_current_user
    is_client = False
    if authorization:
        try:
            curr = get_current_user(authorization=authorization, db=db)
            if curr and (getattr(curr, "role", "") or "").lower() == "client":
                is_client = True
        except Exception:
            pass

    return service.get_meeting_notes(
        db,
        consultation_id=consultation_id,
        case_id=case_id,
        client_id=client_id,
        advocate_id=advocate_id,
        is_client=is_client
    )

@router.get("/notes/{note_id}", response_model=MeetingNoteOut)
def get_meeting_note(note_id: int, db: Session = Depends(get_db)):
    note = service.get_meeting_note_by_id(db, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Meeting note not found")
    return note

@router.put("/notes/{note_id}", response_model=MeetingNoteOut)
def update_meeting_note(note_id: int, data: MeetingNoteUpdate, db: Session = Depends(get_db)):
    note = service.update_meeting_note(db, note_id, data)
    if not note:
        raise HTTPException(status_code=404, detail="Meeting note not found")
    return note

@router.delete("/notes/{note_id}", status_code=204)
def delete_meeting_note(note_id: int, db: Session = Depends(get_db)):
    success = service.delete_meeting_note(db, note_id)
    if not success:
        raise HTTPException(status_code=404, detail="Meeting note not found")
    return

