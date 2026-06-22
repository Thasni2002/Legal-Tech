import sys
import os
from datetime import date, datetime, timedelta

# Add the parent directory of backend/app to Python path to allow absolute imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, Base, engine
from app.authapp.models import User
from app.authapp.service import hash_password
from app.advocate.client_management.models import Case, Hearing, Activity, Document
from app.advocate.finance_management.models import Invoice
from app.advocate.consultations.models import Consultation

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear all existing data
    print("Clearing existing database tables...")
    db.query(Invoice).delete()
    db.query(Consultation).delete()
    db.query(Case).delete()
    db.query(Hearing).delete()
    db.query(Activity).delete()
    db.query(Document).delete()
    db.query(User).delete()
    db.commit()

    # Insert default admin user only
    admin = User(
        username="admin",
        email="admin@example.com",
        password=hash_password("admin123"),
        role="Senior Advocate"
    )
    db.add(admin)
    db.commit()
    print("Created default admin user.")

    db.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_database()
