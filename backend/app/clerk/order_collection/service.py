from sqlalchemy.orm import Session
from app.clerk.order_collection.models import ClerkOrderCollectionRecord
from app.clerk.order_collection.schemas import OrderCollectionCreate, OrderCollectionUpdate

def get_order_collections(db: Session):
    return db.query(ClerkOrderCollectionRecord).order_by(ClerkOrderCollectionRecord.id.desc()).all()

def create_order_collection(db: Session, data: OrderCollectionCreate):
    record = ClerkOrderCollectionRecord(**data.dict())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def update_order_collection(db: Session, order_id: int, data: OrderCollectionUpdate):
    record = db.query(ClerkOrderCollectionRecord).filter(ClerkOrderCollectionRecord.id == order_id).first()
    if not record:
        return None
    for k, v in data.dict(exclude_unset=True).items():
        setattr(record, k, v)
    db.commit()
    db.refresh(record)
    return record

def delete_order_collection(db: Session, order_id: int):
    record = db.query(ClerkOrderCollectionRecord).filter(ClerkOrderCollectionRecord.id == order_id).first()
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True
