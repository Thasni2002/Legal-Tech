from sqlalchemy.orm import Session
from app.clerk.next_posting.models import ClerkNextPosting
from app.clerk.next_posting.schemas import NextPostingCreate, NextPostingUpdate
from app.advocate.case_management.models import Case

def get_next_postings(db: Session, case_no: str = None):
    query = db.query(ClerkNextPosting)
    if case_no:
        query = query.filter(ClerkNextPosting.case_no.ilike(f"%{case_no}%"))
    return query.order_by(ClerkNextPosting.id.desc()).all()

def create_next_posting(db: Session, data: NextPostingCreate):
    db_posting = ClerkNextPosting(**data.dict())
    db.add(db_posting)
    db.commit()
    db.refresh(db_posting)

    # Sync with Case Management Case if case_id or case_no matches
    target_case = None
    if data.case_id:
        target_case = db.query(Case).filter(Case.id == data.case_id).first()
    if not target_case and data.case_no:
        target_case = db.query(Case).filter(Case.case_no == data.case_no).first()

    if target_case:
        target_case.next_hearing_date = data.next_hearing_date
        db.commit()

    return db_posting

def update_next_posting(db: Session, posting_id: int, data: NextPostingUpdate):
    db_posting = db.query(ClerkNextPosting).filter(ClerkNextPosting.id == posting_id).first()
    if not db_posting:
        return None
    
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_posting, key, value)
    
    db.commit()
    db.refresh(db_posting)

    # Sync with Case Management Case if case_no or case_id matches
    target_case = None
    if db_posting.case_id:
        target_case = db.query(Case).filter(Case.id == db_posting.case_id).first()
    if not target_case and db_posting.case_no:
        target_case = db.query(Case).filter(Case.case_no == db_posting.case_no).first()

    if target_case and db_posting.next_hearing_date:
        target_case.next_hearing_date = db_posting.next_hearing_date
        db.commit()

    return db_posting

def delete_next_posting(db: Session, posting_id: int):
    db_posting = db.query(ClerkNextPosting).filter(ClerkNextPosting.id == posting_id).first()
    if not db_posting:
        return False
    db.delete(db_posting)
    db.commit()
    return True
