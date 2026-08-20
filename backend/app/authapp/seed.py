from sqlalchemy.orm import Session
from .models import User
from .service import hash_password

def create_default_user(db: Session):
    target_email = "shiyaxxx3@gmail.com"
    target_username = "admin"
    target_password = "admin123"

    existing_user = db.query(User).filter(
        (User.email == target_email) | (User.username == target_username)
    ).first()

    if existing_user:
        if existing_user.email != target_email:
            existing_user.email = target_email
            db.commit()
            print(f"Updated default admin user email to {target_email}")
        else:
            print(f"Default admin user already exists.")
    else:
        default_user = User(
            username=target_username,
            email=target_email,
            password=hash_password(target_password),
            role="Senior Advocate",
            first_name="Admin",
            last_name="System",
            phone="",
            temp_password=target_password,
            custom_permissions={},
            document_access=[]
        )

        db.add(default_user)
        db.commit()
        print("Default admin created!")