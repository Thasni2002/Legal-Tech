from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ─── Unlock ───────────────────────────────────────────────────────────────────

class VaultUnlockRequest(BaseModel):
    password: str


class VaultUnlockResponse(BaseModel):
    vault_token: str
    expires_in: int  # seconds
    message: str


# ─── Password Reset (OTP flow) ────────────────────────────────────────────────

class VaultResetSendOtpRequest(BaseModel):
    """Step 1 — send OTP to the owner's email."""
    pass  # case_id is in path param; owner identified by JWT


class VaultResetVerifyOtpRequest(BaseModel):
    """Step 2 — verify the OTP."""
    otp: str


class VaultResetPasswordRequest(BaseModel):
    """Step 3 — set the new case password."""
    otp: str
    new_password: str


# ─── Admin Reset ──────────────────────────────────────────────────────────────

class AdminVaultResetRequest(BaseModel):
    """Firm Admin clears the case password hash so the owner sets a new one."""
    admin_note: Optional[str] = None


# ─── Audit Log ────────────────────────────────────────────────────────────────

class AuditLogEntry(BaseModel):
    id: int
    case_id: int
    user_id: Optional[int]
    action: str
    ip_address: Optional[str]
    user_agent: Optional[str]
    extra_data: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True
