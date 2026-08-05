"""
Confidential Vault — API Routes
================================
Endpoints:
  POST /vault/cases/{case_id}/unlock
  POST /vault/cases/{case_id}/forgot-password/send-otp
  POST /vault/cases/{case_id}/forgot-password/reset
  POST /vault/cases/{case_id}/admin-reset
  GET  /vault/cases/{case_id}/audit-log
"""

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.authapp.models import User
from app.authapp.service import SECRET_KEY, ALGORITHM
from jose import jwt, JWTError

from .schemas import (
    VaultUnlockRequest, VaultUnlockResponse,
    VaultResetVerifyOtpRequest, VaultResetPasswordRequest,
    AdminVaultResetRequest, AuditLogEntry,
)
from . import service as svc
from .models import ConfidentialCaseAuditLog

router = APIRouter(prefix="/vault", tags=["Confidential Vault"])


# ─────────────────────────────────────────────────────────────────────────────
# Auth dependency (reuse same pattern as tasks/routes.py)
# ─────────────────────────────────────────────────────────────────────────────

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
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


# ─────────────────────────────────────────────────────────────────────────────
# Unlock
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/cases/{case_id}/unlock", response_model=VaultUnlockResponse)
def unlock_case(
    case_id: int,
    body: VaultUnlockRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Verify the case password and issue a short-lived vault JWT.
    Only the Senior Advocate who created the confidential case can unlock it.
    Wrong passwords are logged in the audit trail.
    """
    return svc.unlock_case(db, case_id, body.password, current_user, request)


# ─────────────────────────────────────────────────────────────────────────────
# Password Reset — OTP flow (2-step)
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/cases/{case_id}/forgot-password/send-otp")
async def vault_forgot_send_otp(
    case_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Step 1 — Send a 6-digit OTP to the owner's registered email."""
    return await svc.send_reset_otp(db, case_id, current_user, request)


@router.post("/cases/{case_id}/forgot-password/reset")
def vault_reset_password(
    case_id: int,
    body: VaultResetPasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Step 2 — Verify OTP and set a new case password."""
    return svc.reset_case_password(db, case_id, body.otp, body.new_password, current_user, request)


# ─────────────────────────────────────────────────────────────────────────────
# Admin Reset (clears hash — never grants content access)
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/cases/{case_id}/admin-reset")
def admin_reset_vault(
    case_id: int,
    body: AdminVaultResetRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Firm Administrator can clear a vault password so the owner can set a new one.
    The admin NEVER gains access to the case contents.
    """
    return svc.admin_reset_vault(db, case_id, current_user, note=body.admin_note, request=request)


# ─────────────────────────────────────────────────────────────────────────────
# Audit Log — Owner only
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/cases/{case_id}/audit-log", response_model=List[AuditLogEntry])
def get_audit_log(
    case_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns the full audit trail for a confidential case.
    Only accessible to the owning Senior Advocate.
    """
    from app.advocate.case_management.models import Case
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case or not case.is_confidential or case.confidential_owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Case not found")

    logs = (
        db.query(ConfidentialCaseAuditLog)
        .filter(ConfidentialCaseAuditLog.case_id == case_id)
        .order_by(ConfidentialCaseAuditLog.created_at.desc())
        .limit(200)
        .all()
    )
    return logs
