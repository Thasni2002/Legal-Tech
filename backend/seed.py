import sys
import os
from datetime import date, datetime, timedelta

# Add the parent directory of backend/app to Python path to allow absolute imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, Base, engine
from app.authapp.models import User
from app.authapp.service import hash_password
from app.advocate.dashboard.models import Case, Hearing, Activity, Document
from app.advocate.finance_management.models import Invoice
from app.advocate.consultations.models import Consultation

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Clear all existing data to prevent duplicate primary keys or extra rows
    print("Clearing existing database tables...")
    db.query(Invoice).delete()
    db.query(Consultation).delete()
    db.query(Case).delete()
    db.query(Hearing).delete()
    db.query(Activity).delete()
    db.query(Document).delete()
    db.query(User).delete()
    db.commit()

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

    # Insert default users
    user_objects = {}
    for user_data in default_users:
        user = User(
            username=user_data["username"],
            email=user_data["email"],
            password=hash_password(user_data["password"]),
            role=user_data["role"]
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        user_objects[user.username] = user
        print(f"Created user {user.username} with role {user.role}")

    # Seed additional advocates to make total advocates count 23 (we have 2, so seed 21 more)
    print("Seeding additional advocates to reach 23 total advocates...")
    advocate_names = [
        "Aditya Birla", "Karan Johar", "Vikram Malhotra", "Rohan Gupta", "Sneha Iyer",
        "Pooja Sharma", "Rajesh Khanna", "Amitabh Bachchan", "Shah Rukh Khan", "Salman Khan",
        "Aamir Khan", "Ranbir Kapoor", "Ranveer Singh", "Deepika Padukone", "Alia Bhatt",
        "Priyanka Chopra", "Katrina Kaif", "Katrina Kaif", "Kareena Kapoor", "Aishwarya Rai",
        "Sushmita Sen", "Lara Dutta"
    ]
    # Note: Katrina Kaif was duplicated in the previous array list, let's make it 21 unique names:
    advocate_names = [
        "Aditya Birla", "Karan Johar", "Vikram Malhotra", "Rohan Gupta", "Sneha Iyer",
        "Pooja Sharma", "Rajesh Khanna", "Amitabh Bachchan", "Shah Rukh Khan", "Salman Khan",
        "Aamir Khan", "Ranbir Kapoor", "Ranveer Singh", "Deepika Padukone", "Alia Bhatt",
        "Priyanka Chopra", "Katrina Kaif", "Kareena Kapoor", "Aishwarya Rai", "Sushmita Sen",
        "Lara Dutta"
    ]
    for i, name in enumerate(advocate_names, start=3):
        email = f"advocate{i}@legaltech.com"
        username = name.lower().replace(" ", "")
        user = User(
            username=username,
            email=email,
            password=hash_password("temp_Advocate123!"),
            role="Junior Advocate"
        )
        db.add(user)
        print(f"Created additional advocate: {name}")
    db.commit()

    # Get primary advocate users for assigning cases/hearings
    rahul = db.query(User).filter(User.username == "rahulsharma").first()
    priya = db.query(User).filter(User.username == "priyanair").first()

    print("Seeding cases...")
    # 2. Seed active cases (target: 156 active cases for Rahul Sharma)
    # Specific cases for Rahul
    c1 = Case(
        case_no="CIV/101",
        title="Arun Kumar vs. State",
        client_name="Arun Kumar",
        type="Civil",
        court="District Court",
        status="Hearing",
        advocate_id=rahul.id
    )
    c2 = Case(
        case_no="CR/202",
        title="State Of Kerala vs. Suresh",
        client_name="State Of Kerala",
        type="Criminal",
        court="Sessions Court",
        status="Active",
        advocate_id=rahul.id
    )
    db.add_all([c1, c2])
    db.commit()

    # Seed remaining active cases programmatically to reach exactly 156
    # Note: CIV/101 (Hearing) and CR/202 (Active) are both active/hearing cases for Rahul.
    # We will generate 154 more active cases for Rahul.
    for i in range(1, 155):
        case = Case(
            case_no=f"CIV/ACT/{i}",
            title=f"Active Case Title {i} vs. Respondent",
            client_name=f"Active Client {i}",
            type="Civil" if i % 2 == 0 else "Criminal",
            court="District Court" if i % 3 == 0 else "Sessions Court",
            status="Active",
            advocate_id=rahul.id
        )
        db.add(case)
    db.commit()

    # Seed 28 pending cases for Rahul Sharma
    for i in range(1, 29):
        case = Case(
            case_no=f"CIV/PEND/{i}",
            title=f"Pending Case Title {i} vs. Respondent",
            client_name=f"Pending Client {i}",
            type="Civil" if i % 2 == 0 else "Criminal",
            court="District Court" if i % 3 == 0 else "Sessions Court",
            status="Pending",
            advocate_id=rahul.id
        )
        db.add(case)
    db.commit()

    print("Seeding hearings...")
    # 3. Seed upcoming hearings (target: 14 upcoming hearings for Rahul Sharma)
    # Specific hearings:
    # 1. 20 Jun (future), Property Dispute, District Court, Rahul Sharma, 10:30 AM
    # 2. 22 Jun (future), Theft Case, Sessions Court, Priya Nair, 11:00 AM (assigned to Priya)
    # The rest will be assigned to Rahul to reach exactly 14 upcoming hearings for Rahul
    h1 = Hearing(
        case_no="CIV/101",
        case_title="Property Dispute",
        court="District Court",
        advocate_id=rahul.id,
        advocate_name="Rahul Sharma",
        date=date.today() + timedelta(days=3),
        time="10:30 AM",
        status="Scheduled"
    )
    h2 = Hearing(
        case_no="CR/202",
        case_title="Theft Case",
        court="Sessions Court",
        advocate_id=priya.id,
        advocate_name="Priya Nair",
        date=date.today() + timedelta(days=5),
        time="11:00 AM",
        status="Scheduled"
    )
    db.add_all([h1, h2])
    db.commit()

    # Generate 13 more upcoming hearings for Rahul to make it exactly 14 for him
    for i in range(1, 14):
        hearing = Hearing(
            case_no=f"CIV/ACT/{i}",
            case_title=f"General Dispute Case {i}",
            court="District Court" if i % 2 == 0 else "High Court",
            advocate_id=rahul.id,
            advocate_name="Rahul Sharma",
            date=date.today() + timedelta(days=7 + i),
            time="11:30 AM",
            status="Scheduled"
        )
        db.add(hearing)
    db.commit()

    print("Seeding activities...")
    # 4. Seed recent activities for Rahul Sharma (3 activities)
    a1 = Activity(
        title="New Case Assigned",
        timestamp_str="10 mins ago",
        type="case",
        advocate_id=rahul.id
    )
    a2 = Activity(
        title="Hearing Completed",
        timestamp_str="1 hour ago",
        type="hearing",
        advocate_id=rahul.id
    )
    a3 = Activity(
        title="Client Meeting Scheduled",
        timestamp_str="Today",
        type="meeting",
        advocate_id=rahul.id
    )
    db.add_all([a1, a2, a3])
    db.commit()

    print("Seeding documents...")
    # 5. Seed recent documents for Rahul Sharma (4 documents)
    docs = [
        Document(filename="Petition_CIV101.pdf", case_no="CIV/101", advocate_id=rahul.id),
        Document(filename="Affidavit_CR202.pdf", case_no="CR/202", advocate_id=rahul.id),
        Document(filename="Evidence_FAM301.pdf", case_no="FAM/301", advocate_id=rahul.id),
        Document(filename="Agreement_CORP111.pdf", case_no="CORP/111", advocate_id=rahul.id)
    ]
    db.add_all(docs)
    db.commit()

    db.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_database()
