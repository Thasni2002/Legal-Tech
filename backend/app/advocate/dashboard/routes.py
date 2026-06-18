from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import SessionLocal
from .schemas import DashboardResponse
from . import service

router = APIRouter(prefix="/advocate/dashboard", tags=["Dashboard"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("", response_model=DashboardResponse)
def get_dashboard(
    advocate_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return service.get_dashboard_data(db, advocate_id=advocate_id)
