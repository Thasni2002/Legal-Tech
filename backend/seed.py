import sys
import os

# Add the parent directory of backend/app to Python path to allow absolute imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, Base, engine
from app.authapp.models import User
from app.authapp.service import hash_password

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    default_users = [
        {
            "username": "rahulsharma",
            "email": "rahul@legaltech.com",
            "password": "temp_Rahul123!",
            "role": "Senior Advocate"
        },
        {
            "username": "priyanair",
            "email": "priya@legaltech.com",
            "password": "temp_Priya456!",
            "role": "Junior Advocate"
        },
        {
            "username": "amitverma",
            "email": "amit@legaltech.com",
            "password": "temp_Amit789!",
            "role": "Client"
        }
    ]

    for user_data in default_users:
        exists = db.query(User).filter(User.email == user_data["email"]).first()
        if not exists:
            user = User(
                username=user_data["username"],
                email=user_data["email"],
                password=hash_password(user_data["password"]),
                role=user_data["role"]
            )
            db.add(user)
            print(f"Created user {user.username} with role {user.role}")
        else:
            # Update role and password if they already exist
            exists.role = user_data["role"]
            exists.password = hash_password(user_data["password"])
            db.add(exists)
            print(f"Updated user {exists.username} with role {exists.role}")

    db.commit()
    db.close()
    print("Database seeding completed.")

if __name__ == "__main__":
    seed_database()
