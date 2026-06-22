from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from .schemas import (
    AdvocateCreate,
    AdvocateUpdate,
    AdvocateOut,
    AssignedCaseCreate,
    AssignedCaseOut
)
from .service import (
    get_all_advocates,
    get_advocate_by_id,
    create_advocate,
    update_advocate,
    delete_advocate,
    create_assigned_case,
    get_assigned_cases,
    get_assigned_case_by_id,
    delete_assigned_case
)

router = APIRouter(
    prefix="/lawfirm-management",
    tags=["Law Firm Management"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Get all advocates
@router.get(
    "/",
    response_model=list[AdvocateOut],
    response_model_by_alias=True
)
def get_advocates(db: Session = Depends(get_db)):
    return get_all_advocates(db)


# Add advocate
@router.post(
    "/",
    response_model=AdvocateOut,
    response_model_by_alias=True
)
def add_advocate(
    advocate: AdvocateCreate,
    db: Session = Depends(get_db)
):
    return create_advocate(db, advocate)


# Assign case
@router.post(
    "/assign-case",
    response_model=AssignedCaseOut
)
def assign_case(
    data: AssignedCaseCreate,
    db: Session = Depends(get_db)
):
    return create_assigned_case(db, data)


# Get all assigned cases
@router.get(
    "/assigned-cases",
    response_model=list[AssignedCaseOut]
)
def fetch_assigned_cases(
    db: Session = Depends(get_db)
):
    return get_assigned_cases(db)


# Get single assigned case
@router.get(
    "/assigned-cases/{case_id}",
    response_model=AssignedCaseOut
)
def fetch_single_assigned_case(
    case_id: int,
    db: Session = Depends(get_db)
):
    assigned_case = get_assigned_case_by_id(
        db,
        case_id
    )

    if not assigned_case:
        raise HTTPException(
            status_code=404,
            detail="Assigned case not found"
        )

    return assigned_case


# Delete assigned case
@router.delete("/assigned-cases/{case_id}")
def remove_assigned_case(
    case_id: int,
    db: Session = Depends(get_db)
):
    deleted = delete_assigned_case(
        db,
        case_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Assigned case not found"
        )

    return deleted


# Get single advocate
@router.get(
    "/{advocate_id}",
    response_model=AdvocateOut,
    response_model_by_alias=True
)
def get_advocate(
    advocate_id: int,
    db: Session = Depends(get_db)
):
    advocate = get_advocate_by_id(
        db,
        advocate_id
    )

    if not advocate:
        raise HTTPException(
            status_code=404,
            detail="Advocate not found"
        )

    return advocate


# Update advocate
@router.put(
    "/{advocate_id}",
    response_model=AdvocateOut,
    response_model_by_alias=True
)
def edit_advocate(
    advocate_id: int,
    advocate: AdvocateUpdate,
    db: Session = Depends(get_db)
):
    updated = update_advocate(
        db,
        advocate_id,
        advocate
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Advocate not found"
        )

    return updated


# Delete advocate
@router.delete("/{advocate_id}")
def remove_advocate(
    advocate_id: int,
    db: Session = Depends(get_db)
):
    deleted = delete_advocate(
        db,
        advocate_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Advocate not found"
        )

    return deleted