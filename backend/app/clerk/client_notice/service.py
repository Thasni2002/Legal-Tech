from sqlalchemy.orm import Session
from app.clerk.client_notice.models import ClerkClientNoticeRecord
from app.clerk.client_notice.schemas import ClientNoticeCreate, ClientNoticeUpdate

def get_client_notices(db: Session):
    return db.query(ClerkClientNoticeRecord).order_by(ClerkClientNoticeRecord.id.desc()).all()

def create_client_notice(db: Session, data: ClientNoticeCreate):
    record = ClerkClientNoticeRecord(**data.dict())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def update_client_notice(db: Session, notice_id: int, data: ClientNoticeUpdate):
    record = db.query(ClerkClientNoticeRecord).filter(ClerkClientNoticeRecord.id == notice_id).first()
    if not record:
        return None
    for k, v in data.dict(exclude_unset=True).items():
        setattr(record, k, v)
    db.commit()
    db.refresh(record)
    return record

def delete_client_notice(db: Session, notice_id: int):
    record = db.query(ClerkClientNoticeRecord).filter(ClerkClientNoticeRecord.id == notice_id).first()
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True
