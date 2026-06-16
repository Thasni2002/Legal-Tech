from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import SessionLocal
from .schemas import ConsultationCreate, ConsultationStart, ConsultationReschedule, ConsultationUpdateStatus, ConsultationOut, ConsultationStats
from . import service

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
    advocate_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return service.get_consultations(db, client_id=client_id, advocate_id=advocate_id, status=status)

@router.post("/book", response_model=ConsultationOut)
def book_consultation(data: ConsultationCreate, db: Session = Depends(get_db)):
    return service.create_consultation(db, data)

@router.post("/start", response_model=ConsultationOut)
def start_consultation(
    data: ConsultationStart,
    advocate_id: Optional[int] = Query(None),
    advocate_name: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return service.start_instant_consultation(db, data, advocate_id=advocate_id, advocate_name=advocate_name)

@router.put("/{consultation_id}/status", response_model=ConsultationOut)
def update_status(consultation_id: int, data: ConsultationUpdateStatus, db: Session = Depends(get_db)):
    consultation = service.update_consultation_status(db, consultation_id, data.status)
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return consultation

@router.put("/{consultation_id}/reschedule", response_model=ConsultationOut)
def reschedule(consultation_id: int, data: ConsultationReschedule, db: Session = Depends(get_db)):
    consultation = service.reschedule_consultation(db, consultation_id, data)
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return consultation

@router.get("/stats", response_model=ConsultationStats)
def get_stats(
    advocate_id: Optional[int] = Query(None),
    client_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return service.get_consultation_stats(db, advocate_id=advocate_id, client_id=client_id)
