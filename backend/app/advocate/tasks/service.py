from sqlalchemy.orm import Session
from typing import List, Optional
from .models import Task, TaskMessage, TaskReadState
from .schemas import TaskCreate, TaskUpdate, TaskStatusUpdate, TaskMessageCreate
from app.authapp.models import User
from datetime import datetime


# ─────────────────────────────────────────────────────────────
# Task CRUD
# ─────────────────────────────────────────────────────────────

def create_task(db: Session, data: TaskCreate, senior_id: int, senior_name: str) -> Task:
    junior = db.query(User).filter(User.id == data.junior_advocate_id).first()
    if junior:
        if junior.first_name or junior.last_name:
            junior_name = f"{junior.first_name or ''} {junior.last_name or ''}".strip()
        else:
            junior_name = junior.username
    else:
        junior_name = "Junior Advocate"

    task = Task(
        title=data.title,
        description=data.description,
        priority=data.priority or "Medium",
        status="todo",
        due_date=data.due_date,
        senior_advocate_id=senior_id,
        junior_advocate_id=data.junior_advocate_id,
        case_id=data.case_id,
        case_title=data.case_title,
        case_no=data.case_no,
        is_pinned=getattr(data, "is_pinned", False),
        workflow_document_id=data.workflow_document_id,
        senior_name=senior_name,
        junior_name=junior_name,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_task(db: Session, task_id: int) -> Optional[Task]:
    return db.query(Task).filter(Task.id == task_id).first()


def get_all_tasks(db: Session) -> List[Task]:
    """All tasks — for Senior Advocate / Superadmin view."""
    return db.query(Task).order_by(Task.created_at.desc()).all()


def get_tasks_for_junior(db: Session, junior_id: int) -> List[Task]:
    """Only tasks assigned to a specific junior."""
    return db.query(Task).filter(
        Task.junior_advocate_id == junior_id
    ).order_by(Task.created_at.desc()).all()


def update_task(db: Session, task_id: int, data: TaskUpdate) -> Optional[Task]:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        return None
    for field, value in data.dict(exclude_unset=True).items():
        setattr(task, field, value)
        if field == "junior_advocate_id":
            junior = db.query(User).filter(User.id == value).first()
            if junior:
                if junior.first_name or junior.last_name:
                    task.junior_name = f"{junior.first_name or ''} {junior.last_name or ''}".strip()
                else:
                    task.junior_name = junior.username
            else:
                task.junior_name = "Junior Advocate"
    db.commit()
    db.refresh(task)
    return task


def update_task_status(db: Session, task_id: int, status: str) -> Optional[Task]:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        return None
    task.status = status
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task_id: int) -> bool:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        return False
    # Cascade delete messages & read states
    db.query(TaskMessage).filter(TaskMessage.task_id == task_id).delete()
    db.query(TaskReadState).filter(TaskReadState.task_id == task_id).delete()
    db.delete(task)
    db.commit()
    return True


# ─────────────────────────────────────────────────────────────
# Task Messages & Read State
# ─────────────────────────────────────────────────────────────

def get_task_messages(db: Session, task_id: int) -> List[TaskMessage]:
    return db.query(TaskMessage).filter(
        TaskMessage.task_id == task_id
    ).order_by(TaskMessage.created_at.asc()).all()


def add_task_message(
    db: Session,
    task_id: int,
    sender_id: int,
    sender_name: str,
    sender_role: str,
    data: TaskMessageCreate
) -> TaskMessage:
    msg = TaskMessage(
        task_id=task_id,
        sender_id=sender_id,
        sender_name=sender_name,
        sender_role=sender_role,
        message=data.message,
        message_type=data.message_type or "general",
        file_url=getattr(data, "file_url", None),
        file_name=getattr(data, "file_name", None),
        file_type=getattr(data, "file_type", None),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # Auto mark sender's own message as read for themselves
    mark_task_messages_as_read(db, sender_id, task_id)

    return msg


def mark_task_messages_as_read(db: Session, user_id: int, task_id: int):
    """Mark all messages for a task as read for a given user."""
    latest_msg = (
        db.query(TaskMessage.id)
        .filter(TaskMessage.task_id == task_id)
        .order_by(TaskMessage.id.desc())
        .first()
    )
    last_id = latest_msg[0] if latest_msg else 0

    state = (
        db.query(TaskReadState)
        .filter(TaskReadState.task_id == task_id, TaskReadState.user_id == user_id)
        .first()
    )
    if state:
        state.last_read_message_id = max(state.last_read_message_id, last_id)
        state.updated_at = datetime.utcnow()
    else:
        state = TaskReadState(task_id=task_id, user_id=user_id, last_read_message_id=last_id)
        db.add(state)
    db.commit()


def get_task_messages_with_read_status(db: Session, task: Task) -> List[dict]:
    """Fetch task messages and determine read receipts (is_read: True/False)."""
    msgs = get_task_messages(db, task.id)
    if not msgs:
        return []

    read_states = (
        db.query(TaskReadState)
        .filter(TaskReadState.task_id == task.id)
        .all()
    )
    user_read_map = {rs.user_id: rs.last_read_message_id for rs in read_states}
    task_users = {task.senior_advocate_id, task.junior_advocate_id}

    result = []
    for m in msgs:
        recipients = task_users - {m.sender_id}
        if not recipients:
            is_read = False
        else:
            max_recipient_read = max([user_read_map.get(uid, 0) for uid in recipients], default=0)
            is_read = m.id <= max_recipient_read

        result.append({
            "id": m.id,
            "task_id": m.task_id,
            "sender_id": m.sender_id,
            "sender_name": m.sender_name,
            "sender_role": m.sender_role,
            "message": m.message,
            "message_type": m.message_type,
            "file_url": m.file_url,
            "file_name": m.file_name,
            "file_type": m.file_type,
            "created_at": f"{m.created_at.isoformat()}Z" if m.created_at else None,
            "is_read": is_read,
        })
    return result


# ─────────────────────────────────────────────────────────────
# Serialisation helper (attach messages & unread_count to task dict)
# ─────────────────────────────────────────────────────────────

def task_to_dict(
    task: Task,
    messages: List[TaskMessage] = None,
    current_user_id: Optional[int] = None,
    db: Optional[Session] = None
) -> dict:
    unread_count = 0
    if db and current_user_id:
        state = (
            db.query(TaskReadState)
            .filter(TaskReadState.task_id == task.id, TaskReadState.user_id == current_user_id)
            .first()
        )
        last_read_id = state.last_read_message_id if state else 0

        unread_count = (
            db.query(TaskMessage)
            .filter(
                TaskMessage.task_id == task.id,
                TaskMessage.sender_id != current_user_id,
                TaskMessage.id > last_read_id,
            )
            .count()
        )

    base = {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "priority": task.priority,
        "status": task.status,
        "due_date": task.due_date,
        "senior_advocate_id": task.senior_advocate_id,
        "junior_advocate_id": task.junior_advocate_id,
        "case_id": task.case_id,
        "case_title": task.case_title,
        "case_no": task.case_no,
        "is_pinned": task.is_pinned,
        "senior_name": task.senior_name,
        "junior_name": task.junior_name,
        "created_at": f"{task.created_at.isoformat()}Z" if task.created_at else None,
        "updated_at": f"{task.updated_at.isoformat()}Z" if task.updated_at else None,
        "unread_count": unread_count,
        "messages": [],
    }
    if messages is not None and db is not None:
        base["messages"] = get_task_messages_with_read_status(db, task)
    return base

