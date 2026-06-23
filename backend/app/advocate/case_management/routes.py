from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db

from .schemas import CaseCreate
from .service import create_case, get_all_cases

router = APIRouter(
    prefix="/case-management",
    tags=["Case Management"]
)


@router.post("/")
def add_case(
    data: CaseCreate,
    db: Session = Depends(get_db)
):
    return create_case(db, data)


@router.get("/")
def fetch_cases(
    db: Session = Depends(get_db)
):
    return get_all_cases(db)