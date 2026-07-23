from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TaskAssignmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    assignee_role: str
    assignee_name: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = "Medium"
    status: Optional[str] = "Pending"
    comments: Optional[str] = None

class TaskAssignmentCreate(TaskAssignmentBase):
    pass

class TaskAssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignee_role: Optional[str] = None
    assignee_name: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    comments: Optional[str] = None

class TaskAssignmentOut(TaskAssignmentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
