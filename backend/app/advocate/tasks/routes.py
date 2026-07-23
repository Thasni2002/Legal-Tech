from fastapi import APIRouter, Depends, HTTPException, Header
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

async def _notify_task_assigned(task, junior_email: str):
    subject = f"📋 New Task Assigned: {task['title']}"
    body = f"""
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
      <h2 style="color:#2563eb;">New Task Assigned</h2>
      <p>Hello,</p>
      <p>A new task has been assigned to you by <strong>{task['senior_name']}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <tr><td style="padding:8px;color:#64748b;font-weight:600;">Task</td><td style="padding:8px;">{task['title']}</td></tr>
        <tr style="background:#fff;"><td style="padding:8px;color:#64748b;font-weight:600;">Priority</td><td style="padding:8px;">{task['priority']}</td></tr>
        <tr><td style="padding:8px;color:#64748b;font-weight:600;">Due Date</td><td style="padding:8px;">{task['due_date'] or 'N/A'}</td></tr>
        {'<tr style="background:#fff;"><td style="padding:8px;color:#64748b;font-weight:600;">Linked Case</td><td style="padding:8px;">' + task['case_title'] + '</td></tr>' if task.get('case_title') else ''}
      </table>
      <p style="margin-top:16px;color:#64748b;">Please log in to Legal-Tech to view your task board.</p>
    </div>
    """
    try:
        await send_email(junior_email, subject, body)
    except Exception as e:
        print(f"[Tasks] Email send error (assigned): {e}")


async def _notify_status_change(task, recipient_email: str, new_status: str, changed_by: str):
    label_map = {"todo": "To Do", "progress": "In Progress", "review": "Review", "completed": "Completed"}
    label = label_map.get(new_status, new_status.title())
    subject = f"🔄 Task Status Updated: {task['title']} → {label}"
    body = f"""
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
      <h2 style="color:#2563eb;">Task Status Changed</h2>
      <p><strong>{changed_by}</strong> updated the status of task <strong>"{task['title']}"</strong> to <strong>{label}</strong>.</p>
      <p style="margin-top:16px;color:#64748b;">Log in to Legal-Tech to view the full task board.</p>
    </div>
    """
    try:
        await send_email(recipient_email, subject, body)
    except Exception as e:
        print(f"[Tasks] Email send error (status): {e}")


async def _notify_new_message(task, recipient_email: str, sender_name: str, message_text: str):
    subject = f"💬 New Message on Task: {task['title']}"
    body = f"""
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
      <h2 style="color:#2563eb;">New Task Message</h2>
      <p><strong>{sender_name}</strong> posted a message on task <strong>"{task['title']}"</strong>:</p>
      <blockquote style="border-left:4px solid #2563eb;margin:16px 0;padding:12px 16px;background:#fff;border-radius:6px;color:#1e293b;">
        {message_text}
      </blockquote>
      <p style="color:#64748b;">Log in to Legal-Tech to reply or view the full task.</p>
    </div>
    """
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
    task_dict = svc.task_to_dict(task)

    # Send email notification to junior / assignee
    junior = db.query(User).filter(User.id == data.junior_advocate_id).first()
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
    Junior: only tasks assigned to them.
    """
    role = (current_user.role or "").lower()
    is_junior = "junior" in role
    if is_junior:
        tasks = svc.get_tasks_for_junior(db, current_user.id)
    else:
        tasks = svc.get_all_tasks(db)

    return [svc.task_to_dict(t) for t in tasks]


@router.get("/{task_id}")
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = svc.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Access control: junior can only see their own tasks
    role = (current_user.role or "").lower()
    if "junior" in role and task.junior_advocate_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    messages = svc.get_task_messages(db, task_id)
    return svc.task_to_dict(task, messages)


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

    role = (current_user.role or "").lower()
    is_senior_or_admin = "junior" not in role

    # Juniors can only update status of their own tasks
    if not is_senior_or_admin and task.junior_advocate_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    updated = svc.update_task(db, task_id, data)
    return svc.task_to_dict(updated)


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

    role = (current_user.role or "").lower()
    is_junior = "junior" in role
    if is_junior and task.junior_advocate_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    updated = svc.update_task_status(db, task_id, data.status)
    task_dict = svc.task_to_dict(updated)

    changer_name = current_user.username or "Advocate"

    # Notify the OTHER party via email
    if is_junior:
        senior = db.query(User).filter(User.id == task.senior_advocate_id).first()
        if senior and senior.email:
            await _notify_status_change(task_dict, senior.email, data.status, changer_name)
    else:
        junior = db.query(User).filter(User.id == task.junior_advocate_id).first()
        if junior and junior.email:
            await _notify_status_change(task_dict, junior.email, data.status, changer_name)

    return task_dict


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = (current_user.role or "").lower()
    if "junior" in role:
        raise HTTPException(status_code=403, detail="Only Senior Advocates can delete tasks")

    success = svc.delete_task(db, task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}


# ─────────────────────────────────────────────────────────────
# Messages
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

    role = (current_user.role or "").lower()
    if "junior" in role and task.junior_advocate_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    msgs = svc.get_task_messages(db, task_id)
    return [
        {
            "id": m.id,
            "task_id": m.task_id,
            "sender_id": m.sender_id,
            "sender_name": m.sender_name,
            "sender_role": m.sender_role,
            "message": m.message,
            "message_type": m.message_type,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in msgs
    ]


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

    role = (current_user.role or "").lower()
    is_junior = "junior" in role
    if is_junior and task.junior_advocate_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    sender_name = current_user.username or "Unknown"
    msg = svc.add_task_message(db, task_id, current_user.id, sender_name, current_user.role or "", data)
    task_dict = svc.task_to_dict(task)

    # Notify the other party
    if is_junior:
        senior = db.query(User).filter(User.id == task.senior_advocate_id).first()
        if senior and senior.email:
            await _notify_new_message(task_dict, senior.email, sender_name, data.message)
    else:
        junior = db.query(User).filter(User.id == task.junior_advocate_id).first()
        if junior and junior.email:
            await _notify_new_message(task_dict, junior.email, sender_name, data.message)

    return {
        "id": msg.id,
        "task_id": msg.task_id,
        "sender_id": msg.sender_id,
        "sender_name": msg.sender_name,
        "sender_role": msg.sender_role,
        "message": msg.message,
        "message_type": msg.message_type,
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
    }
