from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from typing import List

from .schemas import TaskAssignmentCreate, TaskAssignmentUpdate, TaskAssignmentOut
from .service import get_assigned_tasks, create_assigned_task, update_assigned_task, delete_assigned_task

router = APIRouter(
    prefix="/clerk/task-assignment",
    tags=["Clerk Task Assignment"]
)

@router.get("", response_model=List[TaskAssignmentOut])
def read_assigned_tasks(db: Session = Depends(get_db)):
    return get_assigned_tasks(db)

@router.post("", response_model=TaskAssignmentOut, status_code=status.HTTP_201_CREATED)
def add_assigned_task(data: TaskAssignmentCreate, db: Session = Depends(get_db)):
    return create_assigned_task(db, data)

@router.put("/{task_id}", response_model=TaskAssignmentOut)
def modify_assigned_task(task_id: int, data: TaskAssignmentUpdate, db: Session = Depends(get_db)):
    updated = update_assigned_task(db, task_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Assigned task record not found")
    return updated

@router.delete("/{task_id}")
def remove_assigned_task(task_id: int, db: Session = Depends(get_db)):
    success = delete_assigned_task(db, task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Assigned task record not found")
    return {"detail": "Assigned task record deleted successfully"}
