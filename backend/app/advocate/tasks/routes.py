import os
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
from jose import jwt, JWTError

from app.database import get_db
from app.authapp.models import User
from app.authapp.service import SECRET_KEY, ALGORITHM
from app.utils.email import send_email

from .schemas import TaskCreate, TaskUpdate, TaskStatusUpdate, TaskMessageCreate
from . import service as svc

router = APIRouter(
    prefix="/advocate/tasks",
    tags=["Advocate Tasks"],
)


# ─────────────────────────────────────────────────────────────
# Auth helper
# ─────────────────────────────────────────────────────────────

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ─────────────────────────────────────────────────────────────
# Email helpers
# ─────────────────────────────────────────────────────────────

def user_can_access_task(task, user: User, db: Session) -> bool:
    role = (user.role or "").lower()
    if "senior" in role or "admin" in role or user.id == task.senior_advocate_id:
        return True
    if task.junior_advocate_id == user.id:
        return True
    assignees = svc.get_task_assignees(db, task.id)
    return any(a["user_id"] == user.id for a in assignees)


# ─────────────────────────────────────────────────────────────
# Email helpers
# ─────────────────────────────────────────────────────────────

from app.utils.email_templates import (
    build_task_assignment_email,
    build_task_status_email,
    build_task_message_email
)

async def _notify_task_assigned(task, junior_email: str):
    subject = f"📋 New Task Assigned: {task['title']}"
    body = build_task_assignment_email(
        senior_name=task.get('senior_name', 'Senior Advocate'),
        task_title=task['title'],
        priority=task.get('priority', 'Medium'),
        due_date=str(task.get('due_date', 'N/A')),
        case_title=task.get('case_title', '')
    )
    try:
        await send_email(junior_email, subject, body)
    except Exception as e:
        print(f"[Tasks] Email send error (assigned): {e}")


async def _notify_status_change(task, recipient_email: str, new_status: str, changed_by: str):
    label_map = {"todo": "To Do", "progress": "In Progress", "review": "Review", "completed": "Completed"}
    label = label_map.get(new_status, new_status.title())
    subject = f"🔄 Task Status Updated: {task['title']} → {label}"
    body = build_task_status_email(
        task_title=task['title'],
        changed_by=changed_by,
        new_status_label=label
    )
    try:
        await send_email(recipient_email, subject, body)
    except Exception as e:
        print(f"[Tasks] Email send error (status): {e}")


async def _notify_new_message(task, recipient_email: str, sender_name: str, message_text: str):
    subject = f"💬 New Message on Task: {task['title']}"
    body = build_task_message_email(
        task_title=task['title'],
        sender_name=sender_name,
        message_text=message_text
    )
    try:
        await send_email(recipient_email, subject, body)
    except Exception as e:
        print(f"[Tasks] Email send error (message): {e}")


# ─────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────

@router.post("/")
async def create_task(
    data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a task. Senior Advocates, Admins, and Clerks can create tasks."""
    role = (current_user.role or "").lower()
    is_junior = "junior" in role
    if is_junior:
        raise HTTPException(status_code=403, detail="Only Senior Advocates, Admins, and Clerks can create tasks")

    if current_user.first_name or current_user.last_name:
        senior_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip()
    else:
        senior_name = current_user.username or "Assigner"
    task = svc.create_task(db, data, current_user.id, senior_name)
    task_dict = svc.task_to_dict(task, current_user_id=current_user.id, db=db)

    # Notify assignees
    assigned_uids = [a["user_id"] for a in task_dict.get("assignees", [])] or ([data.junior_advocate_id] if data.junior_advocate_id else [])
    for uid in assigned_uids:
        junior = db.query(User).filter(User.id == uid).first()
        if junior and junior.email:
            await _notify_task_assigned(task_dict, junior.email)

    return task_dict


@router.get("/")
def list_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Senior/Admin: all tasks.
    Junior/Clerk: tasks assigned to them (single or group).
    """
    role = (current_user.role or "").lower()
    is_senior_or_admin = "senior" in role or "admin" in role
    if is_senior_or_admin:
        tasks = svc.get_all_tasks(db)
    else:
        tasks = svc.get_tasks_for_junior(db, current_user.id)

    return [svc.task_to_dict(t, current_user_id=current_user.id, db=db) for t in tasks]


@router.get("/{task_id}")
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = svc.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not user_can_access_task(task, current_user, db):
        raise HTTPException(status_code=403, detail="Access denied")

    messages = svc.get_task_messages(db, task_id)
    return svc.task_to_dict(task, messages, current_user_id=current_user.id, db=db)


@router.put("/{task_id}")
async def edit_task(
    task_id: int,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = svc.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not user_can_access_task(task, current_user, db):
        raise HTTPException(status_code=403, detail="Access denied")

    updated = svc.update_task(db, task_id, data)
    return svc.task_to_dict(updated, current_user_id=current_user.id, db=db)


@router.patch("/{task_id}/status")
async def update_status(
    task_id: int,
    data: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = svc.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not user_can_access_task(task, current_user, db):
        raise HTTPException(status_code=403, detail="Access denied")

    updated = svc.update_task_status(db, task_id, data.status)
    task_dict = svc.task_to_dict(updated, current_user_id=current_user.id, db=db)

    changer_name = current_user.username or "User"

    # Notify other assignees + senior
    recipients_uids = set([a["user_id"] for a in task_dict.get("assignees", [])]) | {task.senior_advocate_id}
    recipients_uids.discard(current_user.id)
    for uid in recipients_uids:
        u = db.query(User).filter(User.id == uid).first()
        if u and u.email:
            await _notify_status_change(task_dict, u.email, data.status, changer_name)

    return task_dict


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = (current_user.role or "").lower()
    if "junior" in role:
        raise HTTPException(status_code=403, detail="Only Senior Advocates and Admins can delete tasks")

    success = svc.delete_task(db, task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}


# ─────────────────────────────────────────────────────────────
# Messages & Read Status
# ─────────────────────────────────────────────────────────────

@router.get("/{task_id}/messages")
def list_messages(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = svc.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not user_can_access_task(task, current_user, db):
        raise HTTPException(status_code=403, detail="Access denied")

    return svc.get_task_messages_with_read_status(db, task)


@router.post("/upload-attachment")
async def upload_task_attachment(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload any file attachment from system for task messages."""
    upload_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
        "uploads",
        "task_attachments",
    )
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir, exist_ok=True)

    safe_filename = f"{int(datetime.utcnow().timestamp())}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(upload_dir, safe_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_url = f"/uploads/task_attachments/{safe_filename}"
    return {
        "file_url": file_url,
        "file_name": file.filename,
        "file_type": file.content_type or file.filename.split(".")[-1],
    }


@router.post("/{task_id}/messages")
async def post_message(
    task_id: int,
    data: TaskMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = svc.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not user_can_access_task(task, current_user, db):
        raise HTTPException(status_code=403, detail="Access denied")

    sender_name = current_user.username or "Unknown"
    msg = svc.add_task_message(db, task_id, current_user.id, sender_name, current_user.role or "", data)
    task_dict = svc.task_to_dict(task, current_user_id=current_user.id, db=db)

    # Notify other assignees + senior
    recipients_uids = set([a["user_id"] for a in task_dict.get("assignees", [])]) | {task.senior_advocate_id}
    recipients_uids.discard(current_user.id)
    for uid in recipients_uids:
        u = db.query(User).filter(User.id == uid).first()
        if u and u.email:
            await _notify_new_message(task_dict, u.email, sender_name, data.message)

    return {
        "id": msg.id,
        "task_id": msg.task_id,
        "sender_id": msg.sender_id,
        "sender_name": msg.sender_name,
        "sender_role": msg.sender_role,
        "message": msg.message,
        "message_type": msg.message_type,
        "file_url": msg.file_url,
        "file_name": msg.file_name,
        "file_type": msg.file_type,
        "created_at": f"{msg.created_at.isoformat()}Z" if msg.created_at else None,
    }


@router.post("/{task_id}/read")
def mark_task_read(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = svc.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not user_can_access_task(task, current_user, db):
        raise HTTPException(status_code=403, detail="Access denied")

    svc.mark_task_messages_as_read(db, current_user.id, task_id)
    return {"status": "ok", "task_id": task_id, "unread_count": 0}

