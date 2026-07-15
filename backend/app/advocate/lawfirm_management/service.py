from sqlalchemy.orm import Session
import json
from .models import Advocate, AssignedCase
from .schemas import (
    AdvocateCreate,
    AdvocateUpdate,
    AssignedCaseCreate
)
from passlib.context import CryptContext
from app.authapp.models import User
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


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
    advocate_data = advocate.model_dump(
    by_alias=False,
    exclude={"confirm_password"}
)

    password = advocate_data.pop("password", None)

    if password:
        advocate_data["hashed_password"] = pwd_context.hash(password)
        advocate_data["temp_password"] = password

    new_advocate = Advocate(**advocate_data)

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

    update_data = advocate_data.model_dump(
    exclude_unset=True,
    by_alias=False,
    exclude={"confirm_password"}
)

    password = update_data.pop("password", None)

    if password:
        advocate.hashed_password = pwd_context.hash(password)
        advocate.temp_password = password

    for key, value in update_data.items():
        setattr(advocate, key, value)

    db.commit()
    db.refresh(advocate)

    return advocate


# Delete advocate
def delete_advocate(
    db: Session,
    advocate_id: int
):
    advocate = get_advocate_by_id(db, advocate_id)

    if not advocate:
        return None

    try:
        # Find linked provisioned user
        user = db.query(User).filter(
            func.lower(User.email) == func.lower(advocate.email_address)
        ).first()

        # Delete user first
        if user and user.id != 1:
            db.delete(user)

        # Delete advocate
        db.delete(advocate)

        db.commit()

        return {
            "message": "Advocate and linked user deleted successfully"
        }

    except IntegrityError:
        db.rollback()
        raise ValueError("Unable to delete advocate because related records exist.")
# Create assigned case
def create_assigned_case(
    db: Session,
    case_data: AssignedCaseCreate
):
    case_dict = case_data.model_dump()

    case_dict["assigned_documents"] = json.dumps(
        case_dict.get("assigned_documents", [])
    )

    # Check for existing assignment to prevent duplicates
    existing = db.query(AssignedCase).filter(
        AssignedCase.case_number == case_data.case_number,
        AssignedCase.advocate_name == case_data.advocate_name
    ).first()

    if existing:
        # Update fields instead of inserting a duplicate
        existing.case_name = case_dict.get("case_name")
        existing.case_title = case_dict.get("case_title")
        existing.practice_area = case_dict.get("practice_area")
        existing.priority = case_dict.get("priority")
        existing.due_date = case_dict.get("due_date")
        existing.assignment_notes = case_dict.get("assignment_notes")
        existing.status = case_dict.get("status", existing.status)
        existing.assigned_documents = case_dict.get("assigned_documents")
        db.commit()
        db.refresh(existing)
        existing.assigned_documents = json.loads(existing.assigned_documents or "[]")
        return existing

    new_case = AssignedCase(
        **case_dict
    )

    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    new_case.assigned_documents = json.loads(
        new_case.assigned_documents or "[]"
    )

    return new_case


# Get all assigned cases
def get_assigned_cases(
    db: Session
):
    assigned_cases = db.query(
        AssignedCase
    ).all()

    for case in assigned_cases:
        case.assigned_documents = json.loads(
            case.assigned_documents or "[]"
        )

    return assigned_cases


# Get single assigned case
def get_assigned_case_by_id(
    db: Session,
    case_id: int
):
    assigned_case = db.query(
        AssignedCase
    ).filter(
        AssignedCase.id == case_id
    ).first()

    if assigned_case:
        assigned_case.assigned_documents = json.loads(
            assigned_case.assigned_documents or "[]"
        )

    return assigned_case


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


# Update assigned case
def update_assigned_case(
    db: Session,
    case_id: int,
    case_data: AssignedCaseCreate
):
    assigned_case = get_assigned_case_by_id(
        db,
        case_id
    )

    if not assigned_case:
        return None

    case_dict = case_data.model_dump(
        exclude_unset=True
    )

    if "assigned_documents" in case_dict:
        case_dict["assigned_documents"] = json.dumps(
            case_dict.get("assigned_documents", [])
        )

    for key, value in case_dict.items():
        setattr(assigned_case, key, value)

    if isinstance(assigned_case.assigned_documents, (list, dict)):
        assigned_case.assigned_documents = json.dumps(assigned_case.assigned_documents)

    db.commit()
    db.refresh(assigned_case)

    assigned_case.assigned_documents = json.loads(
        assigned_case.assigned_documents or "[]"
    )

    return assigned_case