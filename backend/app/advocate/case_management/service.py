from sqlalchemy.orm import Session

from .models import Case
from .schemas import CaseCreate


def create_case(db: Session, data: CaseCreate):

    new_case = Case(
        case_id=data.caseId,
        case_title=data.caseTitle,
        case_no=data.caseNo,
        case_type=data.caseType,
        case_description=data.caseDes,

        client_name=data.clientName,
        contact_number=data.contactNumber,
        email_id=data.emailId,

        court_name=data.courtName,
        court_type=data.courtType,

        status=data.status
    )

    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    return new_case


def get_all_cases(db: Session):
    return db.query(Case).all()


def get_case(db: Session, case_id: int):
    return db.query(Case).filter(
        Case.id == case_id
    ).first()