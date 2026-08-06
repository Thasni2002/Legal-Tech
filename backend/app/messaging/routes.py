import os
import uuid
import shutil
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Header, Query, UploadFile, File, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.database import get_db
from app.authapp.models import User
from app.authapp.service import SECRET_KEY, ALGORITHM
from . import service as svc
from .schemas import (
    ConversationCreate, ConversationAssign, ConversationStatusUpdate, 
    ConversationPriorityUpdate, ConversationOut, MessageCreate, MessageEdit, 
    MessageOut, AuditLogOut, UnreadCountOut
)
from .websocket_manager import manager

router = APIRouter(
    tags=["Client Messaging Hub"]
)

# ─────────────────────────────────────────────────────────────
# Auth Dependency
# ─────────────────────────────────────────────────────────────

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def get_user_from_token_string(token: str, db: Session) -> Optional[User]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("id")
        if not user_id:
            return None
        return db.query(User).filter(User.id == user_id).first()
    except JWTError:
        return None

# ─────────────────────────────────────────────────────────────
# REST Endpoints
# ─────────────────────────────────────────────────────────────

@router.get("/messaging/conversations", response_model=List[ConversationOut])
def list_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return svc.get_conversations_for_user(current_user, db)

@router.post("/messaging/conversations", response_model=ConversationOut)
def create_conversation(data: ConversationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return svc.create_conversation(data, current_user, db)

@router.get("/messaging/conversations/{conversation_id}", response_model=ConversationOut)
def get_conversation(conversation_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conv = svc.get_conversation_or_404(conversation_id, current_user, db)
    unread_cnt = db.query(svc.MessagingMessage).filter(
        svc.MessagingMessage.conversation_id == conv.id,
        svc.MessagingMessage.sender_id != current_user.id,
        ~svc.MessagingMessage.id.in_(
            db.query(svc.MessagingMessageRead.message_id).filter(svc.MessagingMessageRead.reader_id == current_user.id)
        )
    ).count()
    
    return {
        "id": conv.id,
        "case_id": conv.case_id,
        "case_title": conv.case_title,
        "case_no": conv.case_no,
        "client_user_id": conv.client_user_id,
        "client_name": conv.client_name,
        "assigned_junior_id": conv.assigned_junior_id,
        "assigned_junior_name": conv.assigned_junior_name,
        "title": conv.title,
        "status": conv.status,
        "priority": conv.priority,
        "is_pinned": conv.is_pinned,
        "last_message": conv.last_message,
        "last_message_at": conv.last_message_at,
        "created_at": conv.created_at,
        "updated_at": conv.updated_at,
        "unread_count": unread_cnt
    }

@router.put("/messaging/conversations/{conversation_id}/assign", response_model=ConversationOut)
def assign_conversation(conversation_id: int, data: ConversationAssign, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return svc.assign_conversation(conversation_id, data, current_user, db)

@router.put("/messaging/conversations/{conversation_id}/pin", response_model=ConversationOut)
def pin_conversation(conversation_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return svc.toggle_pin_conversation(conversation_id, current_user, db)

@router.put("/messaging/conversations/{conversation_id}/status", response_model=ConversationOut)
def update_status(conversation_id: int, data: ConversationStatusUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return svc.update_conversation_status(conversation_id, data.status, current_user, db)

@router.put("/messaging/conversations/{conversation_id}/priority", response_model=ConversationOut)
def update_priority(conversation_id: int, data: ConversationPriorityUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return svc.update_conversation_priority(conversation_id, data.priority, current_user, db)

@router.get("/messaging/conversations/{conversation_id}/cases")
def get_cases_for_conversation(conversation_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return svc.get_cases_for_conversation(conversation_id, current_user, db)

@router.get("/messaging/conversations/{conversation_id}/messages", response_model=List[MessageOut])
def get_messages(conversation_id: int, skip: int = 0, limit: int = 200, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return svc.get_messages(conversation_id, current_user, db, skip, limit)

@router.post("/messaging/conversations/{conversation_id}/messages", response_model=MessageOut)
async def send_message(conversation_id: int, data: MessageCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    msg = svc.send_message(conversation_id, data, current_user, db)
    
    # Broadcast to websocket subscribers
    ws_payload = {
        "event": "new_message",
        "data": msg
    }
    await manager.broadcast_to_conversation(conversation_id, ws_payload)
    return msg

@router.put("/messaging/messages/{message_id}", response_model=MessageOut)
async def edit_message(message_id: int, data: MessageEdit, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    msg = svc.edit_message(message_id, data, current_user, db)
    ws_payload = {
        "event": "edit_message",
        "data": msg
    }
    await manager.broadcast_to_conversation(msg["conversation_id"], ws_payload)
    return msg

@router.delete("/messaging/messages/{message_id}")
async def delete_message(message_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    msg_obj = db.query(svc.MessagingMessage).filter(svc.MessagingMessage.id == message_id).first()
    conv_id = msg_obj.conversation_id if msg_obj else None
    
    svc.delete_message(message_id, current_user, db)
    
    if conv_id:
        ws_payload = {
            "event": "delete_message",
            "data": {"id": message_id, "conversation_id": conv_id}
        }
        await manager.broadcast_to_conversation(conv_id, ws_payload)
    return {"status": "success", "message": "Message deleted"}

@router.post("/messaging/conversations/{conversation_id}/read")
def mark_read(conversation_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    svc.mark_messages_read(conversation_id, current_user, db)
    return {"status": "success"}

@router.get("/messaging/conversations/{conversation_id}/search")
def search_messages(conversation_id: int, q: str = Query(..., min_length=1), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return svc.search_messages(conversation_id, q, current_user, db)

@router.get("/messaging/unread-count", response_model=UnreadCountOut)
def unread_count(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    count = svc.get_unread_count(current_user, db)
    return {"unread_count": count}

@router.get("/messaging/audit-logs/{conversation_id}", response_model=List[AuditLogOut])
def get_audit_logs(conversation_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return svc.get_audit_logs(conversation_id, current_user, db)

@router.post("/messaging/upload")
async def upload_file(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    # Determine base uploads path
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    uploads_folder = os.path.join(base_dir, "uploads", "messaging")
    os.makedirs(uploads_folder, exist_ok=True)
    
    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(uploads_folder, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_url = f"/uploads/messaging/{unique_filename}"
    file_size_mb = round(os.path.getsize(file_path) / (1024 * 1024), 2)
    size_str = f"{file_size_mb} MB" if file_size_mb >= 1 else f"{round(os.path.getsize(file_path) / 1024, 1)} KB"

    return {
        "file_url": file_url,
        "file_name": file.filename,
        "file_size": size_str,
        "content_type": file.content_type
    }

# ─────────────────────────────────────────────────────────────
# WebSocket Endpoint
# ─────────────────────────────────────────────────────────────

@router.websocket("/ws/messaging/{conversation_id}")
async def websocket_messaging(websocket: WebSocket, conversation_id: int, token: str = Query(...), db: Session = Depends(get_db)):
    user = get_user_from_token_string(token, db)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        svc.get_conversation_or_404(conversation_id, user, db)
    except HTTPException:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, conversation_id, user.id)

    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("event")
            
            if event_type == "typing":
                # Broadcast typing status to room
                await manager.broadcast_to_conversation(conversation_id, {
                    "event": "typing",
                    "data": {
                        "user_id": user.id,
                        "username": f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username,
                        "is_typing": data.get("is_typing", True)
                    }
                })
            elif event_type == "mark_read":
                svc.mark_messages_read(conversation_id, user, db)
                await manager.broadcast_to_conversation(conversation_id, {
                    "event": "messages_read",
                    "data": {"reader_id": user.id, "conversation_id": conversation_id}
                })
    except WebSocketDisconnect:
        manager.disconnect(websocket, conversation_id, user.id)
    except Exception as e:
        manager.disconnect(websocket, conversation_id, user.id)
