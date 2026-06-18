import re
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, List, Any, Optional

from app.authapp.models import User
from app.authapp.service import hash_password
from .models import Role, Permission
from .schemas import RoleCreate, RoleUpdate, UserProvision, UserUpdate

# --- ROLES SERVICE ---

def get_roles(db: Session) -> List[Role]:
    return db.query(Role).all()

def get_role_by_id(db: Session, role_id: str) -> Optional[Role]:
    return db.query(Role).filter(Role.id == role_id).first()

def get_role_by_name(db: Session, name: str) -> Optional[Role]:
    return db.query(Role).filter(func.lower(Role.name) == name.lower()).first()

def create_role(db: Session, data: RoleCreate) -> Role:
    # Generate ID: lowercase, alphanumeric only
    role_id = re.sub(r'[^a-zA-Z0-9]', '', data.name.lower())
    
    # Check if exists
    existing = get_role_by_id(db, role_id)
    if existing:
        return existing
        
    db_role = Role(
        id=role_id,
        name=data.name.strip(),
        description=data.description.strip() if data.description else ""
    )
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

def update_role(db: Session, role_id: str, data: RoleUpdate) -> Optional[Role]:
    db_role = get_role_by_id(db, role_id)
    if not db_role:
        return None
    
    # Do not allow renaming Core Role IDs to protect system integrity
    if role_id in ["senioradvocate", "junioradvocate", "client"] and data.name.lower() != db_role.name.lower():
        # Keep name same, only update description
        db_role.description = data.description.strip() if data.description else ""
    else:
        db_role.name = data.name.strip()
        db_role.description = data.description.strip() if data.description else ""
        
    db.commit()
    db.refresh(db_role)
    return db_role

def delete_role(db: Session, role_id: str) -> bool:
    if role_id in ["senioradvocate", "junioradvocate", "client"]:
        return False
        
    db_role = get_role_by_id(db, role_id)
    if not db_role:
        return False
        
    db.delete(db_role)
    db.commit()
    return True


# --- PERMISSIONS SERVICE ---

def get_permissions_matrix(db: Session) -> Dict[str, Dict[str, Dict[str, bool]]]:
    """
    Returns full default permissions matrix grouped by Role Name.
    Format:
    {
       "Senior Advocate": {
          "Dashboard": {"view": True, "add": True, "edit": True, "delete": True},
          ...
       },
       ...
    }
    """
    roles = get_roles(db)
    matrix = {}
    for role in roles:
        matrix[role.name] = {}
        # Fetch permissions for this role
        perms = db.query(Permission).filter(Permission.role_id == role.id).all()
        for perm in perms:
            matrix[role.name][perm.module] = {
                "view": perm.view,
                "add": perm.add,
                "edit": perm.edit,
                "delete": perm.delete
            }
    return matrix

def update_role_permissions(db: Session, role_name: str, new_permissions: Dict[str, Any]) -> bool:
    """
    Replaces permissions matrix for a role name.
    """
    db_role = get_role_by_name(db, role_name)
    if not db_role:
        return False

    # Delete existing permission configurations for this role
    db.query(Permission).filter(Permission.role_id == db_role.id).delete()

    # Create new permissions
    for module_key, actions in new_permissions.items():
        db_perm = Permission(
            role_id=db_role.id,
            module=module_key,
            view=actions.get("view", False),
            add=actions.get("add", False),
            edit=actions.get("edit", False),
            delete=actions.get("delete", False)
        )
        db.add(db_perm)

    db.commit()
    return True


# --- USERS SERVICE ---

def get_users(db: Session) -> List[User]:
    return db.query(User).all()

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def provision_user(db: Session, data: UserProvision) -> User:
    # Check if exists
    existing = db.query(User).filter((User.username == data.username) | (User.email == data.email)).first()
    if existing:
        raise ValueError("Username or Email already exists in the system")

    # Default documents
    default_docs = [
        { "docId": "doc_1", "name": "Smith v. State - Case Brief.pdf", "type": "Case File", "view": True, "upload": True, "edit": False, "delete": False },
        { "docId": "doc_2", "name": "Land Title Deed - John Doe.pdf", "type": "Property Document", "view": True, "upload": False, "edit": False, "delete": False },
        { "docId": "doc_3", "name": "Consultation Agreement - TechCorp.pdf", "type": "Contract", "view": True, "upload": True, "edit": True, "delete": False },
        { "docId": "doc_4", "name": "Divorce Decree - Final.pdf", "type": "Court Order", "view": False, "upload": False, "edit": False, "delete": False }
    ]

    db_user = User(
        username=data.username.strip(),
        email=data.email.strip(),
        password=hash_password(data.tempPassword),
        role=data.role,
        first_name=data.firstName.strip() if data.firstName else "",
        last_name=data.lastName.strip() if data.lastName else "",
        phone=data.phone.strip() if data.phone else "",
        temp_password=data.tempPassword,
        custom_permissions={},
        document_access=default_docs
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, data: UserUpdate) -> Optional[User]:
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None

    if data.firstName is not None:
        db_user.first_name = data.firstName
    if data.lastName is not None:
        db_user.last_name = data.lastName
    if data.phone is not None:
        db_user.phone = data.phone
    if data.username is not None:
        db_user.username = data.username
    if data.email is not None:
        db_user.email = data.email
    if data.tempPassword is not None:
        db_user.temp_password = data.tempPassword
        db_user.password = hash_password(data.tempPassword)
    if data.customPermissions is not None:
        # customPermissions is incoming Dict[str, PermissionSchema]
        # We store it raw as dict
        db_user.custom_permissions = {
            mod: {
                "view": act.view if hasattr(act, 'view') else act.get("view", False),
                "add": act.add if hasattr(act, 'add') else act.get("add", False),
                "edit": act.edit if hasattr(act, 'edit') else act.get("edit", False),
                "delete": act.delete if hasattr(act, 'delete') else act.get("delete", False),
            } for mod, act in data.customPermissions.items()
        }
    if data.documentAccess is not None:
        db_user.document_access = data.documentAccess

    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int) -> bool:
    # Protect system administrator or user_1
    if user_id == 1 or str(user_id) == "user_1":
        return False
        
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        # Try finding by string ID if stored that way, or matching username
        return False
        
    db.delete(db_user)
    db.commit()
    return True


# --- AUTHORIZATION/CHECKING SERVICE ---

def check_user_permission(db: Session, user_id: int, module: str, action: str) -> bool:
    """
    Checks if user is authorized to perform action on a module.
    Logic:
      1. Check direct user custom overrides. If configured, return the override.
      2. Otherwise, check the user's role's default permission.
    """
    user = get_user_by_id(db, user_id)
    if not user:
        return False
        
    # 1. Custom permissions check
    custom_perms = user.custom_permissions or {}
    if module in custom_perms:
        module_override = custom_perms[module]
        if action in module_override:
            return bool(module_override[action])

    # 2. Role permissions check
    role = get_role_by_name(db, user.role)
    if not role:
        return False

    perm = db.query(Permission).filter(
        Permission.role_id == role.id,
        Permission.module == module
    ).first()

    if not perm:
        return False

    return bool(getattr(perm, action, False))
