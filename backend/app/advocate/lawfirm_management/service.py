from sqlalchemy.orm import Session
from .models import Advocate, AssignedCase
from .schemas import AdvocateCreate, AdvocateUpdate


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
    new_advocate = Advocate(
        **advocate.model_dump(by_alias=False)
    )

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

    for key, value in advocate_data.model_dump(
        by_alias=False
    ).items():
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

    db.delete(advocate)
    db.commit()

    return {
        "message": "Advocate deleted successfully"
    }


# Create assigned case
def create_assigned_case(
    db: Session,
    case_data
):
    new_case = AssignedCase(
        **case_data.model_dump()
    )

    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    return new_case


# Get all assigned cases
def get_assigned_cases(
    db: Session
):
    return db.query(
        AssignedCase
    ).all()


# Get single assigned case
def get_assigned_case_by_id(
    db: Session,
    case_id: int
):
    return db.query(
        AssignedCase
    ).filter(
        AssignedCase.id == case_id
    ).first()


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

    db.delete(assigned_case)
    db.commit()

    return {
        "message": "Assigned case deleted successfully"
    }