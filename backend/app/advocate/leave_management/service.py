from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import date, datetime
from typing import List, Optional

from app.authapp.models import User
from app.advocate.leave_management.models import LeaveRequest, LeaveBalance
from app.advocate.leave_management.schemas import (
    LeaveApplySchema,
    LeaveStatusUpdateSchema,
    LeaveBalanceOutSchema,
    LeaveBalanceItem,
)


def get_or_create_user_balance(db: Session, user_id: int) -> LeaveBalance:
    balance = (
        db.query(LeaveBalance)
        .filter(
            LeaveBalance.user_id == user_id,
            LeaveBalance.financial_year == "FY 2026-27",
        )
        .first()
    )
    if not balance:
        balance = LeaveBalance(
            user_id=user_id,
            financial_year="FY 2026-27",
            emergency_leave_total=6.0,
            emergency_leave_used=0.0,
            sick_leave_total=4.0,
            sick_leave_used=0.0,
            floater_leave_total=2.0,
            floater_leave_used=0.0,
        )
        db.add(balance)
        db.commit()
        db.refresh(balance)
    return balance


def format_user_balance_out(balance: LeaveBalance) -> LeaveBalanceOutSchema:
    return LeaveBalanceOutSchema(
        financial_year=balance.financial_year,
        emergency_leave=LeaveBalanceItem(
            total=balance.emergency_leave_total,
            used=balance.emergency_leave_used,
            remaining=max(0.0, balance.emergency_leave_total - balance.emergency_leave_used),
        ),
        sick_leave=LeaveBalanceItem(
            total=balance.sick_leave_total,
            used=balance.sick_leave_used,
            remaining=max(0.0, balance.sick_leave_total - balance.sick_leave_used),
        ),
        floater_leave=LeaveBalanceItem(
            total=balance.floater_leave_total,
            used=balance.floater_leave_used,
            remaining=max(0.0, balance.floater_leave_total - balance.floater_leave_used),
        ),
    )


def get_leave_requests(
    db: Session,
    current_user: User,
    status_filter: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    view_mode: Optional[str] = "senior",
    scope: Optional[str] = "all",
) -> List[LeaveRequest]:
    query = db.query(LeaveRequest)

    role_norm = (current_user.role or "").lower().replace(" ", "")

    if view_mode == "junior" or role_norm not in ["senioradvocate", "clerk", "admin"]:
        query = query.filter(LeaveRequest.user_id == current_user.id)
    elif view_mode == "clerk":
        if scope == "own":
            query = query.filter(LeaveRequest.user_id == current_user.id)
        elif scope == "team":
            # Clerk reviewing Junior Advocate requests
            query = query.filter(LeaveRequest.user_id != current_user.id)
    # senior view_mode gets all requests

    if status_filter and status_filter.lower() != "all":
        query = query.filter(LeaveRequest.status.ilike(status_filter))

    if from_date:
        query = query.filter(LeaveRequest.from_date >= from_date)

    if to_date:
        query = query.filter(LeaveRequest.to_date <= to_date)

    return query.order_by(desc(LeaveRequest.created_at)).all()


def apply_leave(db: Session, current_user: User, data: LeaveApplySchema) -> LeaveRequest:
    # Ensure balance record exists
    get_or_create_user_balance(db, current_user.id)

    # Calculate days if not supplied
    delta_days = (data.to_date - data.from_date).days + 1
    total_days = data.total_days if data.total_days and data.total_days > 0 else float(max(1, delta_days))

    new_request = LeaveRequest(
        user_id=current_user.id,
        applicant_name=f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.username or "User",
        applicant_role=current_user.role or "Junior Advocate",
        leave_type=data.leave_type,
        subject=data.subject,
        description=data.description,
        from_date=data.from_date,
        to_date=data.to_date,
        total_days=total_days,
        is_half_day=data.is_half_day or "None",
        status="Pending",
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request


def update_leave_status(
    db: Session,
    approver: User,
    leave_id: int,
    data: LeaveStatusUpdateSchema,
) -> LeaveRequest:
    leave_req = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave_req:
        raise ValueError("Leave request not found.")

    old_status = leave_req.status
    leave_req.status = data.status
    leave_req.approved_by_id = approver.id
    leave_req.approver_name = f"{approver.first_name or ''} {approver.last_name or ''}".strip() or approver.username or "Approver"

    if data.rejection_reason:
        leave_req.rejection_reason = data.rejection_reason

    # If status transitioned to Approved from non-Approved state, update leave balance
    if data.status == "Approved" and old_status != "Approved":
        balance = get_or_create_user_balance(db, leave_req.user_id)
        lt_lower = (leave_req.leave_type or "").lower()
        if "emergency" in lt_lower or "casual" in lt_lower:
            balance.emergency_leave_used += leave_req.total_days
        elif "sick" in lt_lower:
            balance.sick_leave_used += leave_req.total_days
        elif "floater" in lt_lower:
            balance.floater_leave_used += leave_req.total_days
        else:
            balance.emergency_leave_used += leave_req.total_days

    # If previously approved and now rejected/cancelled, revert balance deduction
    if old_status == "Approved" and data.status in ["Rejected", "Cancelled"]:
        balance = get_or_create_user_balance(db, leave_req.user_id)
        lt_lower = (leave_req.leave_type or "").lower()
        if "emergency" in lt_lower or "casual" in lt_lower:
            balance.emergency_leave_used = max(0.0, balance.emergency_leave_used - leave_req.total_days)
        elif "sick" in lt_lower:
            balance.sick_leave_used = max(0.0, balance.sick_leave_used - leave_req.total_days)
        elif "floater" in lt_lower:
            balance.floater_leave_used = max(0.0, balance.floater_leave_used - leave_req.total_days)

    db.commit()
    db.refresh(leave_req)
    return leave_req


def cancel_leave(db: Session, current_user: User, leave_id: int) -> LeaveRequest:
    leave_req = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave_req:
        raise ValueError("Leave request not found.")

    if leave_req.user_id != current_user.id:
        role_norm = (current_user.role or "").lower().replace(" ", "")
        if role_norm not in ["senioradvocate", "admin"]:
            raise PermissionError("You can only cancel your own leave requests.")

    if leave_req.status == "Approved":
        balance = get_or_create_user_balance(db, leave_req.user_id)
        lt_lower = (leave_req.leave_type or "").lower()
        if "emergency" in lt_lower or "casual" in lt_lower:
            balance.emergency_leave_used = max(0.0, balance.emergency_leave_used - leave_req.total_days)
        elif "sick" in lt_lower:
            balance.sick_leave_used = max(0.0, balance.sick_leave_used - leave_req.total_days)
        elif "floater" in lt_lower:
            balance.floater_leave_used = max(0.0, balance.floater_leave_used - leave_req.total_days)

    leave_req.status = "Cancelled"
    db.commit()
    db.refresh(leave_req)
    return leave_req
