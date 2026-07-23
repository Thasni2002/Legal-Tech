from sqlalchemy.orm import Session
from app.clerk.task_assignment.models import ClerkTaskAssignmentRecord
from app.clerk.task_assignment.schemas import TaskAssignmentCreate, TaskAssignmentUpdate

def get_assigned_tasks(db: Session):
    return db.query(ClerkTaskAssignmentRecord).order_by(ClerkTaskAssignmentRecord.id.desc()).all()

def create_assigned_task(db: Session, data: TaskAssignmentCreate):
    record = ClerkTaskAssignmentRecord(**data.dict())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def update_assigned_task(db: Session, task_id: int, data: TaskAssignmentUpdate):
    record = db.query(ClerkTaskAssignmentRecord).filter(ClerkTaskAssignmentRecord.id == task_id).first()
    if not record:
        return None
    for k, v in data.dict(exclude_unset=True).items():
        setattr(record, k, v)
    db.commit()
    db.refresh(record)
    return record

def delete_assigned_task(db: Session, task_id: int):
    record = db.query(ClerkTaskAssignmentRecord).filter(ClerkTaskAssignmentRecord.id == task_id).first()
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True
