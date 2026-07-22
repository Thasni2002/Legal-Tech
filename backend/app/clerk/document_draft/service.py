from sqlalchemy.orm import Session
from .models import ClerkDocumentDraft
from .schemas import ClerkDocumentDraftCreate, ClerkDocumentDraftUpdate

def get_document_drafts(db: Session):
    return db.query(ClerkDocumentDraft).all()

def get_document_draft(db: Session, draft_id: int):
    return db.query(ClerkDocumentDraft).filter(ClerkDocumentDraft.id == draft_id).first()

def create_document_draft(db: Session, data: ClerkDocumentDraftCreate):
    db_draft = ClerkDocumentDraft(
        template_type=data.template_type,
        client_name=data.client_name,
        advocate_name=data.advocate_name,
        case_title=data.case_title,
        court_name=data.court_name,
        batta_fee=data.batta_fee,
        mode_of_summons=data.mode_of_summons,
        number_of_summons=data.number_of_summons,
        content=data.content
    )
    db.add(db_draft)
    db.commit()
    db.refresh(db_draft)
    return db_draft

def update_document_draft(db: Session, draft_id: int, data: ClerkDocumentDraftUpdate):
    db_draft = db.query(ClerkDocumentDraft).filter(ClerkDocumentDraft.id == draft_id).first()
    if not db_draft:
        return None
    for field, value in data.dict(exclude_unset=True).items():
        setattr(db_draft, field, value)
    db.commit()
    db.refresh(db_draft)
    return db_draft

def delete_document_draft(db: Session, draft_id: int):
    db_draft = db.query(ClerkDocumentDraft).filter(ClerkDocumentDraft.id == draft_id).first()
    if not db_draft:
        return False
    db.delete(db_draft)
    db.commit()
    return True
