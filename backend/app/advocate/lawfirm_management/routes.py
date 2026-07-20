from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from .schemas import (
    AdvocateCreate,
    AdvocateUpdate,
    AdvocateOut,
    AssignedCaseCreate,
    AssignedCaseOut,
    AssignedCaseStatusUpdate
)
from .service import (
    get_all_advocates,
    get_advocate_by_id,
    create_advocate,
    update_advocate,
    delete_advocate,
    create_assigned_case,
    get_assigned_cases,
    get_assigned_case_by_id,
    delete_assigned_case,
    update_assigned_case
)

router = APIRouter(
    prefix="/lawfirm-management",
    tags=["Law Firm Management"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Get all advocates
@router.get(
    "/",
    response_model=list[AdvocateOut],
    response_model_by_alias=True
)
def get_advocates(db: Session = Depends(get_db)):
    return get_all_advocates(db)


# Add advocate
@router.post(
    "/",
    response_model=AdvocateOut,
    response_model_by_alias=True
)
async def add_advocate(
    advocate: AdvocateCreate,
    db: Session = Depends(get_db)
):
    new_adv = create_advocate(db, advocate)

    if advocate.password:
        # Auto-provision the advocate as a user in the `users` table so they can log in immediately
        try:
            from app.advocate.permissions.schemas import UserProvision
            from app.advocate.permissions.service import provision_user
            
            # Extract first and last names
            name_parts = (new_adv.advocate_name or "").strip().split(" ")
            first_name = name_parts[0] if name_parts else "Junior"
            last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else "Advocate"
            
            # Generate username
            username = (new_adv.advocate_name or "").lower().replace(" ", "")
            
            prov_data = UserProvision(
                firstName=first_name,
                lastName=last_name,
                phone=new_adv.phone_number or "",
                username=username,
                email=new_adv.email_address,
                role=new_adv.role or "Junior Advocate",
                tempPassword=advocate.password
            )
            provision_user(db, prov_data)
        except Exception as prov_err:
            print(f"Auto-provisioning failed for advocate {new_adv.email_address}: {prov_err}")

        # Send onboarding credentials email
        try:
            from app.utils.email import send_email
            role_label = new_adv.role or "Junior Advocate"
            subject = f"Your {role_label} Credentials"
            body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2>Welcome to Legal-Tech</h2>
                    <p>Dear {new_adv.advocate_name},</p>
                    <p>Your {role_label} account has been successfully created. Below are your login credentials:</p>
                    <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #2563EB; margin: 15px 0;">
                        <p style="margin: 5px 0;"><strong>Login URL:</strong> <a href="http://localhost:3000/login">http://localhost:3000/login</a></p>
                        <p style="margin: 5px 0;"><strong>Username / Email:</strong> {new_adv.email_address}</p>
                        <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">{advocate.password}</code></p>
                    </div>
                    <p>Please log in and update your password under your profile settings.</p>
                    <p>Best regards,<br/>The Legal-Tech Team</p>
                </body>
            </html>
            """
            await send_email(new_adv.email_address, subject, body)
        except Exception as email_err:
            print(f"Failed to send email to advocate {new_adv.email_address}: {email_err}")

    return new_adv


# Assign case
@router.post(
    "/assign-case",
    response_model=AssignedCaseOut
)
def assign_case(
    data: AssignedCaseCreate,
    db: Session = Depends(get_db)
):
    return create_assigned_case(db, data)


# Get all assigned cases
@router.get(
    "/assigned-cases",
    response_model=list[AssignedCaseOut]
)
def fetch_assigned_cases(
    db: Session = Depends(get_db)
):
    return get_assigned_cases(db)


# Get single assigned case
@router.get(
    "/assigned-cases/{case_id}",
    response_model=AssignedCaseOut
)
def fetch_single_assigned_case(
    case_id: int,
    db: Session = Depends(get_db)
):
    assigned_case = get_assigned_case_by_id(
        db,
        case_id
    )

    if not assigned_case:
        raise HTTPException(
            status_code=404,
            detail="Assigned case not found"
        )

    return assigned_case


# Delete assigned case
@router.delete("/assigned-cases/{case_id}")
def remove_assigned_case(
    case_id: int,
    db: Session = Depends(get_db)
):
    deleted = delete_assigned_case(
        db,
        case_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Assigned case not found"
        )

    return deleted


# Update assigned case
@router.put(
    "/assigned-cases/{case_id}",
    response_model=AssignedCaseOut
)
def edit_assigned_case(
    case_id: int,
    data: AssignedCaseCreate,
    db: Session = Depends(get_db)
):
    updated = update_assigned_case(
        db,
        case_id,
        data
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Assigned case not found"
        )

    return updated


# Update assigned case status
@router.put(
    "/assigned-cases/{case_id}/status"
)
def edit_assigned_case_status(
    case_id: int,
    data: AssignedCaseStatusUpdate,
    db: Session = Depends(get_db)
):
    # 1. Update status of AssignedCase in the database
    from .models import AssignedCase
    assigned_case = db.query(AssignedCase).filter(AssignedCase.id == case_id).first()
    if not assigned_case:
        raise HTTPException(
            status_code=404,
            detail="Assigned case not found"
        )
    
    assigned_case.status = data.status
    
    # 2. Find the corresponding case in Case Management table
    from app.advocate.case_management.models import Case
    related_case = db.query(Case).filter(Case.case_no == assigned_case.case_number).first()
    if related_case:
        # Sync status: Active <-> Active, In Progress <-> Pending, Closed <-> Closed
        if data.status == "In Progress":
            related_case.status = "Pending"
        elif data.status == "Closed":
            related_case.status = "Closed"
        else:
            related_case.status = data.status
            
    db.commit()
    db.refresh(assigned_case)
    
    return {"message": "Status updated successfully", "status": assigned_case.status}


# Get single advocate
@router.get(
    "/{advocate_id}",
    response_model=AdvocateOut,
    response_model_by_alias=True
)
def get_advocate(
    advocate_id: int,
    db: Session = Depends(get_db)
):
    advocate = get_advocate_by_id(
        db,
        advocate_id
    )

    if not advocate:
        raise HTTPException(
            status_code=404,
            detail="Advocate not found"
        )

    return advocate


# Update advocate
@router.put(
    "/{advocate_id}",
    response_model=AdvocateOut,
    response_model_by_alias=True
)
def edit_advocate(
    advocate_id: int,
    advocate: AdvocateUpdate,
    db: Session = Depends(get_db)
):
    updated = update_advocate(
        db,
        advocate_id,
        advocate
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Advocate not found"
        )

    return updated


# Delete advocate
@router.delete("/{advocate_id}")
def remove_advocate(
    advocate_id: int,
    db: Session = Depends(get_db)
):
    deleted = delete_advocate(
        db,
        advocate_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Advocate not found"
        )

    return deleted