from sqlalchemy.orm import Session
from app.clerk.physical_filing.models import ClerkPhysicalFilingRecord
from app.clerk.physical_filing.schemas import PhysicalFilingCreate, PhysicalFilingUpdate

def get_physical_filings(db: Session):
    return db.query(ClerkPhysicalFilingRecord).order_by(ClerkPhysicalFilingRecord.id.desc()).all()

def create_physical_filing(db: Session, data: PhysicalFilingCreate):
    filing = ClerkPhysicalFilingRecord(**data.dict())
    db.add(filing)
    db.commit()
    db.refresh(filing)
    return filing

def update_physical_filing(db: Session, filing_id: int, data: PhysicalFilingUpdate):
    filing = db.query(ClerkPhysicalFilingRecord).filter(ClerkPhysicalFilingRecord.id == filing_id).first()
    if not filing:
        return None
    for k, v in data.dict(exclude_unset=True).items():
        setattr(filing, k, v)
    db.commit()
    db.refresh(filing)
    return filing

def delete_physical_filing(db: Session, filing_id: int):
    filing = db.query(ClerkPhysicalFilingRecord).filter(ClerkPhysicalFilingRecord.id == filing_id).first()
    if not filing:
        return False
    db.delete(filing)
    db.commit()
    return True
