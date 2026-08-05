"""
Confidential Vault — Business Logic
====================================
Handles:
  • Unlocking a confidential case (bcrypt verify → issue vault JWT)
  • OTP-based case-password reset
  • Admin-initiated password invalidation (without content access)
  • Audit log writes
"""

import os
import random
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from fastapi import HTTPException, Request
from jose import jwt
from sqlalchemy.orm import Session

from app.authapp.models import User
from app.advocate.case_management.models import Case
from .models import ConfidentialCaseAuditLog, AuditAction


# ─── Secrets ─────────────────────────────────────────────────────────────────
VAULT_SECRET   = os.getenv("VAULT_SECRET_KEY", "vault-secret-change-in-production")
VAULT_ALGO     = "HS256"
VAULT_EXPIRE_S = 30 * 60       # 30 minutes

# ─── In-memory OTP store: { (case_id, user_id) → {otp, expires_at} } ────────
_otp_store: dict = {}
OTP_EXPIRE_MINUTES = 4


# ─────────────────────────────────────────────────────────────────────────────
# Audit helpers
# ─────────────────────────────────────────────────────────────────────────────

def write_audit(
    db: Session,
    case_id: int,
    action: str,
    request: Optional[Request] = None,
    user_id: Optional[int] = None,
    extra: Optional[dict] = None,
):
    """Write a single audit log entry. Safe — never raises."""
    try:
        ip = None
        ua = None
        if request:
            ip = (request.client.host if request.client else None)
            ua = request.headers.get("user-agent")
        log = ConfidentialCaseAuditLog(
            case_id=case_id,
            user_id=user_id,
            action=action,
            ip_address=ip,
            user_agent=ua,
            extra_data=extra,
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"[vault] audit write error: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _get_case_or_404(db: Session, case_id: int) -> Case:
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


def _require_owner(case: Case, user: User):
    """Raise 404 (not 403) so case existence is not leaked."""
    if not case.is_confidential:
        raise HTTPException(status_code=400, detail="Case is not confidential")
    if case.confidential_owner_id != user.id:
        raise HTTPException(status_code=404, detail="Case not found")


def _issue_vault_token(case_id: int, owner_id: int) -> str:
    payload = {
        "case_id":  case_id,
        "owner_id": owner_id,
        "exp":      datetime.utcnow() + timedelta(seconds=VAULT_EXPIRE_S),
    }
    return jwt.encode(payload, VAULT_SECRET, algorithm=VAULT_ALGO)


def verify_vault_token(case_id: int, vault_token: Optional[str]) -> dict:
    """
    Called by the middleware dependency.
    Returns the decoded payload if valid, raises 401/403 otherwise.
    """
    if not vault_token:
        raise HTTPException(status_code=401, detail="Vault token required")
    try:
        payload = jwt.decode(vault_token, VAULT_SECRET, algorithms=[VAULT_ALGO])
    except Exception:
        raise HTTPException(status_code=401, detail="Vault token invalid or expired")
    if payload.get("case_id") != case_id:
        raise HTTPException(status_code=403, detail="Vault token mismatch")
    return payload


# ─────────────────────────────────────────────────────────────────────────────
# Unlock
# ─────────────────────────────────────────────────────────────────────────────

def unlock_case(
    db: Session,
    case_id: int,
    password: str,
    current_user: User,
    request: Optional[Request] = None,
) -> dict:
    case = _get_case_or_404(db, case_id)
    _require_owner(case, current_user)

    if not case.confidential_password_hash:
        raise HTTPException(status_code=400, detail="No password set for this case")

    # Verify password
    ok = bcrypt.checkpw(
        password[:72].encode("utf-8"),
        case.confidential_password_hash.encode("utf-8"),
    )

    if not ok:
        write_audit(db, case_id, AuditAction.UNLOCK_FAILED, request, current_user.id,
                    extra={"reason": "wrong_password"})
        raise HTTPException(status_code=401, detail="Incorrect case password")

    token = _issue_vault_token(case_id, current_user.id)
    write_audit(db, case_id, AuditAction.UNLOCK_SUCCESS, request, current_user.id)
    return {"vault_token": token, "expires_in": VAULT_EXPIRE_S, "message": "Case unlocked"}


# ─────────────────────────────────────────────────────────────────────────────
# Password Reset — OTP flow
# ─────────────────────────────────────────────────────────────────────────────

async def send_reset_otp(
    db: Session,
    case_id: int,
    current_user: User,
    request: Optional[Request] = None,
) -> dict:
    case = _get_case_or_404(db, case_id)
    _require_owner(case, current_user)

    otp = str(random.randint(100000, 999999))
    key = (case_id, current_user.id)
    _otp_store[key] = {
        "otp":        otp,
        "expires_at": datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES),
    }

    # Send email using existing email utility
    try:
        from app.utils.email import send_email
        body = _build_vault_otp_email(current_user.username or current_user.first_name or "Advocate", otp)
        await send_email(
            to_email=current_user.email,
            subject="🔐 Case Vault Password Reset OTP",
            body=body,
        )
    except Exception as e:
        print(f"[vault] OTP email failed: {e} — OTP: {otp}")

    write_audit(db, case_id, AuditAction.PASSWORD_RESET_OTP_SENT, request, current_user.id)
    return {"message": "OTP sent to your registered email", "email": current_user.email}


def reset_case_password(
    db: Session,
    case_id: int,
    otp: str,
    new_password: str,
    current_user: User,
    request: Optional[Request] = None,
) -> dict:
    case = _get_case_or_404(db, case_id)
    _require_owner(case, current_user)

    key = (case_id, current_user.id)
    stored = _otp_store.get(key)
    if not stored:
        raise HTTPException(status_code=400, detail="No OTP found. Please request a new one.")
    if datetime.utcnow() > stored["expires_at"]:
        _otp_store.pop(key, None)
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    if stored["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # Hash and save new password
    pwd_hash = bcrypt.hashpw(new_password[:72].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    case.confidential_password_hash = pwd_hash
    case.needs_password_reset = False
    db.commit()

    _otp_store.pop(key, None)
    write_audit(db, case_id, AuditAction.PASSWORD_RESET_COMPLETED, request, current_user.id)
    return {"message": "Case password reset successfully"}


# ─────────────────────────────────────────────────────────────────────────────
# Admin Reset (clears hash so owner must set a new password)
# ─────────────────────────────────────────────────────────────────────────────

def admin_reset_vault(
    db: Session,
    case_id: int,
    admin_user: User,
    note: Optional[str] = None,
    request: Optional[Request] = None,
) -> dict:
    case = db.query(Case).filter(Case.id == case_id, Case.is_confidential == True).first()
    if not case:
        raise HTTPException(status_code=404, detail="Confidential case not found")

    role = (admin_user.role or "").lower()
    if "admin" not in role:
        raise HTTPException(status_code=403, detail="Only Firm Administrators can initiate vault resets")

    # Clear the hash — owner must set a new password on next login
    case.confidential_password_hash = None
    case.needs_password_reset = True
    db.commit()

    write_audit(db, case_id, AuditAction.ADMIN_RESET_INITIATED, request, admin_user.id,
                extra={"admin_note": note})
    return {
        "message": "Vault password has been cleared. The case owner must set a new password to regain access.",
        "needs_password_reset": True,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Email template
# ─────────────────────────────────────────────────────────────────────────────

def _build_vault_otp_email(username: str, otp: str) -> str:
    return f"""
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:auto;background:#0f172a;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#1e40af,#4f46e5);padding:32px;text-align:center;">
    <div style="font-size:40px;margin-bottom:8px;">🔐</div>
    <h2 style="color:#fff;margin:0;font-size:20px;font-weight:700;">Case Vault Password Reset</h2>
    <p style="color:#93c5fd;margin:8px 0 0;font-size:13px;">Legal Tech Platform</p>
  </div>
  <div style="padding:28px 32px;">
    <p style="color:#e2e8f0;font-size:15px;margin:0 0 16px;">Hello <strong style="color:#fff">{username}</strong>,</p>
    <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;">
      You requested a password reset for a <strong style="color:#c4b5fd">Confidential Case Vault</strong>. Use the OTP below to reset your case password. This code expires in <strong style="color:#fbbf24">4 minutes</strong>.
    </p>
    <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
      <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Your OTP Code</p>
      <p style="font-size:36px;font-weight:900;letter-spacing:12px;color:#a78bfa;margin:0;font-family:'Courier New',monospace;">{otp}</p>
    </div>
    <p style="color:#64748b;font-size:12px;margin:0;">If you did not request this, your account may be at risk. Contact your administrator immediately.</p>
  </div>
  <div style="border-top:1px solid #1e293b;padding:16px 32px;text-align:center;">
    <p style="color:#475569;font-size:11px;margin:0;">Legal Tech Platform — Confidential Case Vault Security System</p>
  </div>
</div>
"""
