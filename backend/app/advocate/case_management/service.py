from sqlalchemy.orm import Session
import json
from datetime import datetime

from .models import Case
from .schemas import CaseCreate, CaseUpdate


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

        status=data.status,

        selected_advocate=data.selectedAdvocate,
        documents=json.dumps(
            [doc.dict() for doc in data.documents]
        ) if data.documents else "[]",
        next_hearing_date=data.nextHearingDate,
        cnr_number=data.cnrNumber
    )

    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    return new_case


def get_all_cases(db: Session):
    cases = db.query(Case).all()

    for case in cases:
        case.documents = json.loads(case.documents or "[]")

    return cases


def get_case(db: Session, case_id: int):
    case = db.query(Case).filter(Case.id == case_id).first()

    if case:
        case.documents = json.loads(case.documents or "[]")

    return case


def update_case(db: Session, case_id: int, data: CaseUpdate):
    case = db.query(Case).filter(Case.id == case_id).first()

    if not case:
        return None

    if data.caseId is not None:
        case.case_id = data.caseId
    if data.caseTitle is not None:
        case.case_title = data.caseTitle
    if data.caseNo is not None:
        case.case_no = data.caseNo
    if data.caseType is not None:
        case.case_type = data.caseType
    if data.caseDes is not None:
        case.case_description = data.caseDes
    if data.clientName is not None:
        case.client_name = data.clientName
    if data.contactNumber is not None:
        case.contact_number = data.contactNumber
    if data.emailId is not None:
        case.email_id = data.emailId
    if data.courtName is not None:
        case.court_name = data.courtName
    if data.courtType is not None:
        case.court_type = data.courtType
    if data.status is not None:
        case.status = data.status
    if data.selectedAdvocate is not None:
        case.selected_advocate = data.selectedAdvocate
    if data.documents is not None:
        case.documents = json.dumps(
            [doc.dict() for doc in data.documents]
        )
    if data.nextHearingDate is not None:
        case.next_hearing_date = data.nextHearingDate
    if data.cnrNumber is not None:
        case.cnr_number = data.cnrNumber

    case.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(case)

    case.documents = json.loads(case.documents or "[]")

    return case


def delete_case(db: Session, case_id: int):
    case = db.query(Case).filter(Case.id == case_id).first()

    if not case:
        return None

    db.delete(case)
    db.commit()

    return case