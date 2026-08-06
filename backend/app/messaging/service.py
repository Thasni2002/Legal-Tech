from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, desc
from fastapi import HTTPException, status
from datetime import datetime
from typing import List, Optional

from app.authapp.models import User
from app.advocate.case_management.models import Case
from app.advocate.lawfirm_management.models import AssignedCase, Advocate
from app.advocate.client_management.models import Client as ClientModel
from .models import MessagingConversation, MessagingMessage, MessagingMessageRead, MessagingAuditLog
from .schemas import ConversationCreate, ConversationAssign, MessageCreate, MessageEdit

def log_audit(db: Session, conversation_id: Optional[int], actor: User, action: str, details: Optional[str] = None):
    try:
        actor_name = f"{actor.first_name or ''} {actor.last_name or ''}".strip() or actor.username
        audit = MessagingAuditLog(
            conversation_id=conversation_id,
            actor_id=actor.id,
            actor_name=actor_name,
            actor_role=actor.role,
            action=action,
            details=details
        )
        db.add(audit)
        db.commit()
    except Exception as e:
        print(f"Error logging audit: {e}")

def normalize_role(role: str) -> str:
    if not role:
        return ""
    return role.lower().replace(" ", "").replace("_", "")

def auto_populate_conversations(db: Session):
    try:
        # 1. First, deduplicate any duplicate MessagingConversation entries
        all_convs = db.query(MessagingConversation).order_by(MessagingConversation.id.asc()).all()
        seen = {}
        for c in all_convs:
            # Key by client_name (normalized) or client_user_id or case_id
            key = None
            if c.client_user_id:
                key = f"user_{c.client_user_id}"
            elif c.client_name:
                key = f"name_{c.client_name.strip().lower()}"
            elif c.case_id:
                key = f"case_{c.case_id}"

            if key and key in seen:
                # Move messages from duplicate conversation to original conversation
                original_id = seen[key]
                db.query(MessagingMessage).filter(MessagingMessage.conversation_id == c.id).update(
                    {MessagingMessage.conversation_id: original_id}, synchronize_session=False
                )
                db.delete(c)
            elif key:
                seen[key] = c.id
        db.commit()

        # 2. Sync from Case Management cases
        cases = db.query(Case).all()
        for case in cases:
            c_name = (case.client_name or "Client").strip()
            # Check if conversation exists by case_id OR by client_name OR by email
            existing = db.query(MessagingConversation).filter(
                or_(
                    MessagingConversation.case_id == case.id,
                    func.lower(MessagingConversation.client_name) == c_name.lower()
                )
            ).first()

            if not existing:
                client_user = db.query(User).filter(
                    or_(
                        func.lower(User.email) == (case.email_id or "").lower(),
                        func.lower(User.username) == c_name.lower(),
                        func.concat(User.first_name, ' ', User.last_name) == c_name
                    )
                ).first()
                
                assigned = db.query(AssignedCase).filter(AssignedCase.case_id == case.id).first()
                assigned_junior_id = None
                assigned_junior_name = case.selected_advocate
                
                if assigned:
                    assigned_junior_name = assigned.advocate_name or case.selected_advocate
                    adv_user = db.query(User).filter(
                        or_(
                            func.lower(User.username) == (assigned.advocate_name or "").lower(),
                            func.concat(User.first_name, ' ', User.last_name) == assigned.advocate_name
                        )
                    ).first()
                    if adv_user:
                        assigned_junior_id = adv_user.id
                elif case.selected_advocate:
                    adv_user = db.query(User).filter(
                        or_(
                            func.lower(User.username) == (case.selected_advocate or "").lower(),
                            func.concat(User.first_name, ' ', User.last_name) == case.selected_advocate
                        )
                    ).first()
                    if adv_user:
                        assigned_junior_id = adv_user.id
                        
                conv = MessagingConversation(
                    case_id=case.id,
                    case_title=case.case_title,
                    case_no=case.case_no,
                    client_user_id=client_user.id if client_user else None,
                    client_name=c_name,
                    assigned_junior_id=assigned_junior_id,
                    assigned_junior_name=assigned_junior_name or "Senior Advocate / Legal Team",
                    title=f"Client Consultation: {c_name}",
                    status="Active",
                    priority="Medium",
                    last_message="Thread initialized for case communication.",
                    last_message_at=datetime.utcnow()
                )
                db.add(conv)
                db.commit()
            elif existing and not existing.case_id:
                # Link existing client conversation to case if unlinked
                existing.case_id = case.id
                existing.case_title = case.case_title
                existing.case_no = case.case_no
                if case.selected_advocate and not existing.assigned_junior_name:
                    existing.assigned_junior_name = case.selected_advocate
                db.commit()

        # 3. Sync from Client Management clients table
        clients = db.query(ClientModel).all()
        for cl in clients:
            cl_name = (cl.full_name or "").strip()
            if not cl_name:
                continue
            existing = db.query(MessagingConversation).filter(
                func.lower(MessagingConversation.client_name) == cl_name.lower()
            ).first()
            if not existing:
                cl_user = db.query(User).filter(
                    or_(
                        func.lower(User.email) == (cl.email or "").lower(),
                        func.lower(User.username) == cl_name.lower()
                    )
                ).first()
                conv = MessagingConversation(
                    client_user_id=cl_user.id if cl_user else None,
                    client_name=cl_name,
                    assigned_junior_name="Senior Advocate / Legal Team",
                    title=f"Client Consultation: {cl_name}",
                    status="Active",
                    priority="Medium",
                    last_message="Client consultation thread opened.",
                    last_message_at=datetime.utcnow()
                )
                db.add(conv)
                db.commit()

        # 4. Sync for client users in system
        client_users = db.query(User).filter(User.role.ilike("%client%")).all()
        for cu in client_users:
            cu_name = f"{cu.first_name or ''} {cu.last_name or ''}".strip() or cu.username
            existing = db.query(MessagingConversation).filter(
                or_(
                    MessagingConversation.client_user_id == cu.id,
                    func.lower(MessagingConversation.client_name) == cu_name.lower(),
                    func.lower(MessagingConversation.client_name) == (cu.email or "").lower()
                )
            ).first()
            if not existing:
                conv = MessagingConversation(
                    client_user_id=cu.id,
                    client_name=cu_name,
                    assigned_junior_name="Senior Advocate / Legal Team",
                    title=f"Consultation with {cu_name}",
                    status="Active",
                    priority="Medium",
                    last_message="Welcome to Legal-Tech. How can our legal team assist you today?",
                    last_message_at=datetime.utcnow()
                )
                db.add(conv)
                db.commit()
            elif existing and not existing.client_user_id:
                existing.client_user_id = cu.id
                db.commit()
    except Exception as e:
        print(f"Error auto-populating conversations: {e}")

def get_conversations_for_user(user: User, db: Session) -> List[dict]:
    # Only run auto-populate if no conversations exist yet to avoid heavy DB queries on every poll
    if not db.query(MessagingConversation.id).first():
        auto_populate_conversations(db)
        
    role = normalize_role(user.role)
    query = db.query(MessagingConversation)

    if role in ["senioradvocate", "clerk", "admin"]:
        # View all conversations across organization
        conversations = query.order_by(desc(MessagingConversation.is_pinned), desc(MessagingConversation.last_message_at)).all()
    elif role == "junioradvocate":
        # Junior advocate sees conversations explicitly assigned to them OR linked to cases assigned to them
        adv_name = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username
        
        # Get assigned case IDs for this junior
        assigned_cases = db.query(AssignedCase).filter(
            or_(
                AssignedCase.advocate_name == adv_name,
                AssignedCase.secondary_advocate_name == adv_name
            )
        ).all()
        assigned_case_ids = [c.case_id for c in assigned_cases if c.case_id]

        conversations = query.filter(
            or_(
                MessagingConversation.assigned_junior_id == user.id,
                MessagingConversation.case_id.in_(assigned_case_ids) if assigned_case_ids else False
            )
        ).order_by(desc(MessagingConversation.is_pinned), desc(MessagingConversation.last_message_at)).all()
    elif role == "client":
        # Client sees only conversations belonging to them
        user_name = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username
        conversations = query.filter(
            or_(
                MessagingConversation.client_user_id == user.id,
                func.lower(MessagingConversation.client_name) == user_name.lower(),
                func.lower(MessagingConversation.client_name) == (user.email or "").lower()
            )
        ).order_by(desc(MessagingConversation.is_pinned), desc(MessagingConversation.last_message_at)).all()
    else:
        conversations = []

    # Calculate unread count per conversation for this user
    result = []
    for conv in conversations:
        # Total messages in conversation not sent by user
        unread_cnt = db.query(MessagingMessage).filter(
            MessagingMessage.conversation_id == conv.id,
            MessagingMessage.sender_id != user.id,
            ~MessagingMessage.id.in_(
                db.query(MessagingMessageRead.message_id).filter(MessagingMessageRead.reader_id == user.id)
            )
        ).count()

        conv_dict = {
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
        result.append(conv_dict)
        
    return result

def get_conversation_or_404(conversation_id: int, user: User, db: Session) -> MessagingConversation:
    conv = db.query(MessagingConversation).filter(MessagingConversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    role = normalize_role(user.role)
    if role in ["senioradvocate", "clerk", "admin"]:
        return conv
    
    if role == "junioradvocate":
        if conv.assigned_junior_id == user.id:
            return conv
        adv_name = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username
        assigned = db.query(AssignedCase).filter(
            AssignedCase.case_id == conv.case_id,
            or_(
                AssignedCase.advocate_name == adv_name,
                AssignedCase.secondary_advocate_name == adv_name
            )
        ).first()
        if assigned:
            return conv
        raise HTTPException(status_code=403, detail="Access denied to this conversation")
        
    if role == "client":
        user_name = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username
        if conv.client_user_id == user.id or (conv.client_name and conv.client_name.lower() == user_name.lower()):
            return conv
        raise HTTPException(status_code=403, detail="Access denied to this conversation")
        
    raise HTTPException(status_code=403, detail="Access denied")

def create_conversation(data: ConversationCreate, user: User, db: Session) -> MessagingConversation:
    case_obj = None
    if data.case_id:
        case_obj = db.query(Case).filter(Case.id == data.case_id).first()
        
    client_name = data.client_name
    client_user_id = data.client_user_id
    
    if case_obj:
        if not client_name:
            client_name = case_obj.client_name
        # Find client user account if exists
        client_user = db.query(User).filter(
            or_(
                func.lower(User.email) == (case_obj.email_id or "").lower(),
                func.lower(User.username) == (case_obj.client_name or "").lower()
            )
        ).first()
        if client_user:
            client_user_id = client_user.id
            
    if not client_name and user.role.lower() == "client":
        client_name = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username
        client_user_id = user.id

    # Check if a conversation already exists for this case or client
    existing = None
    if data.case_id:
        existing = db.query(MessagingConversation).filter(MessagingConversation.case_id == data.case_id).first()
    elif client_user_id:
        existing = db.query(MessagingConversation).filter(MessagingConversation.client_user_id == client_user_id).first()
        
    if existing:
        return existing

    # Find assigned junior advocate if case exists
    assigned_junior_id = None
    assigned_junior_name = None
    if case_obj:
        assigned = db.query(AssignedCase).filter(AssignedCase.case_id == case_obj.id).first()
        if assigned:
            assigned_junior_name = assigned.advocate_name
            adv_user = db.query(User).filter(
                or_(
                    func.lower(User.username) == assigned.advocate_name.lower(),
                    func.concat(User.first_name, ' ', User.last_name) == assigned.advocate_name
                )
            ).first()
            if adv_user:
                assigned_junior_id = adv_user.id

    conv_title = data.title or (f"Case #{case_obj.case_no}: {case_obj.case_title}" if case_obj else f"Conversation with {client_name or 'Client'}")

    conv = MessagingConversation(
        case_id=data.case_id,
        case_title=case_obj.case_title if case_obj else None,
        case_no=case_obj.case_no if case_obj else None,
        client_user_id=client_user_id,
        client_name=client_name or "Client",
        assigned_junior_id=assigned_junior_id,
        assigned_junior_name=assigned_junior_name,
        title=conv_title,
        status="Active",
        priority=data.priority or "Medium",
        last_message=data.initial_message or "Conversation started.",
        last_message_at=datetime.utcnow()
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)

    if data.initial_message:
        sender_name = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username
        msg = MessagingMessage(
            conversation_id=conv.id,
            sender_id=user.id,
            sender_name=sender_name,
            sender_role=user.role,
            content=data.initial_message,
            message_type="text"
        )
        db.add(msg)
        db.commit()

    log_audit(db, conv.id, user, "created", f"Created conversation: {conv.title}")
    return conv

def get_messages(conversation_id: int, user: User, db: Session, skip: int = 0, limit: int = 100) -> List[dict]:
    get_conversation_or_404(conversation_id, user, db)
    
    messages = db.query(MessagingMessage).filter(
        MessagingMessage.conversation_id == conversation_id
    ).order_by(MessagingMessage.created_at.asc()).offset(skip).limit(limit).all()

    # Read receipts for this user
    read_message_ids = set(
        r.message_id for r in db.query(MessagingMessageRead.message_id).filter(
            MessagingMessageRead.conversation_id == conversation_id,
            MessagingMessageRead.reader_id == user.id
        ).all()
    )

    # Check if recipient has read each message (for double ticks)
    all_read_ids = set(
        r.message_id for r in db.query(MessagingMessageRead.message_id).filter(
            MessagingMessageRead.conversation_id == conversation_id,
            MessagingMessageRead.reader_id != user.id
        ).all()
    )

    out = []
    for m in messages:
        out.append({
            "id": m.id,
            "conversation_id": m.conversation_id,
            "sender_id": m.sender_id,
            "sender_name": m.sender_name,
            "sender_role": m.sender_role,
            "content": m.content,
            "message_type": m.message_type,
            "file_url": m.file_url,
            "file_name": m.file_name,
            "file_size": m.file_size,
            "case_no": m.case_no,
            "case_title": m.case_title,
            "is_edited": m.is_edited,
            "is_deleted": m.is_deleted,
            "edited_at": m.edited_at,
            "created_at": m.created_at,
            "is_read": m.id in read_message_ids or m.id in all_read_ids or m.sender_id == user.id
        })

    # Auto-mark messages as read when fetched
    mark_messages_read(conversation_id, user, db)

    return out

def get_cases_for_conversation(conversation_id: int, user: User, db: Session) -> List[dict]:
    conv = get_conversation_or_404(conversation_id, user, db)
    
    # Query cases matching conversation's client_name or client_user_id or case_id
    query_filters = []
    if conv.case_id:
        query_filters.append(Case.id == conv.case_id)
    if conv.client_name:
        query_filters.append(func.lower(Case.client_name) == conv.client_name.strip().lower())
        query_filters.append(Case.client_name.ilike(f"%{conv.client_name.strip()}%"))
        
    matched_cases = db.query(Case).filter(or_(*query_filters)).all() if query_filters else []
    
    # Unique by case id
    unique_cases = {}
    for c in matched_cases:
        unique_cases[c.id] = {
            "id": c.id,
            "case_no": c.case_no,
            "case_title": c.case_title,
            "client_name": c.client_name,
            "status": c.status,
            "court_name": c.court_name
        }
    return list(unique_cases.values())

def send_message(conversation_id: int, data: MessageCreate, user: User, db: Session) -> dict:
    conv = get_conversation_or_404(conversation_id, user, db)
    
    sender_name = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username
    
    msg = MessagingMessage(
        conversation_id=conversation_id,
        sender_id=user.id,
        sender_name=sender_name,
        sender_role=user.role,
        content=data.content,
        message_type=data.message_type or "text",
        file_url=data.file_url,
        file_name=data.file_name,
        file_size=data.file_size,
        case_no=data.case_no,
        case_title=data.case_title
    )
    db.add(msg)
    
    # Update conversation last_message preview
    preview = data.content or f"[{data.message_type.capitalize()} Attachment]"
    if data.case_no:
        preview = f"[Case #{data.case_no}] {preview}"
    conv.last_message = preview
    conv.last_message_at = datetime.utcnow()
    conv.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(msg)

    # Self read receipt
    read_receipt = MessagingMessageRead(
        message_id=msg.id,
        conversation_id=conversation_id,
        reader_id=user.id
    )
    db.add(read_receipt)
    db.commit()

    log_audit(db, conversation_id, user, "sent", f"Sent message ID {msg.id} ({msg.message_type})")

    return {
        "id": msg.id,
        "conversation_id": msg.conversation_id,
        "sender_id": msg.sender_id,
        "sender_name": msg.sender_name,
        "sender_role": msg.sender_role,
        "content": msg.content,
        "message_type": msg.message_type,
        "file_url": msg.file_url,
        "file_name": msg.file_name,
        "file_size": msg.file_size,
        "case_no": msg.case_no,
        "case_title": msg.case_title,
        "is_edited": msg.is_edited,
        "is_deleted": msg.is_deleted,
        "edited_at": msg.edited_at,
        "created_at": msg.created_at,
        "is_read": True
    }

def mark_messages_read(conversation_id: int, user: User, db: Session):
    unread_messages = db.query(MessagingMessage.id).filter(
        MessagingMessage.conversation_id == conversation_id,
        MessagingMessage.sender_id != user.id,
        ~MessagingMessage.id.in_(
            db.query(MessagingMessageRead.message_id).filter(
                MessagingMessageRead.conversation_id == conversation_id,
                MessagingMessageRead.reader_id == user.id
            )
        )
    ).all()

    for (m_id,) in unread_messages:
        db.add(MessagingMessageRead(
            message_id=m_id,
            conversation_id=conversation_id,
            reader_id=user.id
        ))
    if unread_messages:
        db.commit()

def edit_message(message_id: int, data: MessageEdit, user: User, db: Session) -> dict:
    msg = db.query(MessagingMessage).filter(MessagingMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    role = normalize_role(user.role)
    if msg.sender_id != user.id and role not in ["senioradvocate", "admin"]:
        raise HTTPException(status_code=403, detail="Cannot edit someone else's message")
        
    msg.content = data.content
    msg.is_edited = True
    msg.edited_at = datetime.utcnow()
    db.commit()
    db.refresh(msg)
    
    log_audit(db, msg.conversation_id, user, "edited", f"Edited message ID {msg.id}")
    return {
        "id": msg.id,
        "conversation_id": msg.conversation_id,
        "sender_id": msg.sender_id,
        "sender_name": msg.sender_name,
        "sender_role": msg.sender_role,
        "content": msg.content,
        "message_type": msg.message_type,
        "file_url": msg.file_url,
        "file_name": msg.file_name,
        "file_size": msg.file_size,
        "is_edited": True,
        "is_deleted": msg.is_deleted,
        "edited_at": msg.edited_at,
        "created_at": msg.created_at,
        "is_read": True
    }

def delete_message(message_id: int, user: User, db: Session):
    msg = db.query(MessagingMessage).filter(MessagingMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    role = normalize_role(user.role)
    if msg.sender_id != user.id and role not in ["senioradvocate", "admin"]:
        raise HTTPException(status_code=403, detail="Cannot delete someone else's message")
        
    msg.is_deleted = True
    msg.content = "This message was deleted"
    msg.file_url = None
    db.commit()
    
    log_audit(db, msg.conversation_id, user, "deleted", f"Deleted message ID {msg.id}")

def assign_conversation(conversation_id: int, data: ConversationAssign, user: User, db: Session) -> MessagingConversation:
    role = normalize_role(user.role)
    if role not in ["senioradvocate", "clerk", "admin"]:
        raise HTTPException(status_code=403, detail="Only Senior Advocate, Clerk, or Admin can assign conversations")
        
    conv = get_conversation_or_404(conversation_id, user, db)
    junior_user = db.query(User).filter(User.id == data.assigned_junior_id).first()
    if not junior_user:
        raise HTTPException(status_code=404, detail="Junior Advocate user not found")
        
    junior_name = data.assigned_junior_name or f"{junior_user.first_name or ''} {junior_user.last_name or ''}".strip() or junior_user.username
    
    conv.assigned_junior_id = junior_user.id
    conv.assigned_junior_name = junior_name
    db.commit()
    db.refresh(conv)
    
    log_audit(db, conversation_id, user, "assigned", f"Assigned conversation to {junior_name}")
    return conv

def toggle_pin_conversation(conversation_id: int, user: User, db: Session) -> MessagingConversation:
    conv = get_conversation_or_404(conversation_id, user, db)
    conv.is_pinned = not conv.is_pinned
    db.commit()
    db.refresh(conv)
    
    action_str = "pinned" if conv.is_pinned else "unpinned"
    log_audit(db, conversation_id, user, action_str, f"{action_str.capitalize()} conversation")
    return conv

def update_conversation_status(conversation_id: int, status_val: str, user: User, db: Session) -> MessagingConversation:
    conv = get_conversation_or_404(conversation_id, user, db)
    conv.status = status_val
    db.commit()
    db.refresh(conv)
    log_audit(db, conversation_id, user, "status_changed", f"Changed status to {status_val}")
    return conv

def update_conversation_priority(conversation_id: int, priority_val: str, user: User, db: Session) -> MessagingConversation:
    conv = get_conversation_or_404(conversation_id, user, db)
    conv.priority = priority_val
    db.commit()
    db.refresh(conv)
    log_audit(db, conversation_id, user, "priority_changed", f"Changed priority to {priority_val}")
    return conv

def get_unread_count(user: User, db: Session) -> int:
    conversations = get_conversations_for_user(user, db)
    total_unread = sum(c["unread_count"] for c in conversations)
    return total_unread

def search_messages(conversation_id: int, query: str, user: User, db: Session) -> List[dict]:
    get_conversation_or_404(conversation_id, user, db)
    messages = db.query(MessagingMessage).filter(
        MessagingMessage.conversation_id == conversation_id,
        MessagingMessage.content.ilike(f"%{query}%"),
        MessagingMessage.is_deleted == False
    ).order_by(MessagingMessage.created_at.desc()).all()

    return [{
        "id": m.id,
        "conversation_id": m.conversation_id,
        "sender_name": m.sender_name,
        "content": m.content,
        "created_at": m.created_at
    } for m in messages]

def get_audit_logs(conversation_id: int, user: User, db: Session) -> List[MessagingAuditLog]:
    role = normalize_role(user.role)
    if role not in ["senioradvocate", "clerk", "admin"]:
        raise HTTPException(status_code=403, detail="Only management roles can view audit logs")
    return db.query(MessagingAuditLog).filter(MessagingAuditLog.conversation_id == conversation_id).order_by(desc(MessagingAuditLog.created_at)).all()
