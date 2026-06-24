from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.dialects.mysql import LONGTEXT
from app.database import Base


class Advocate(Base):
    __tablename__ = "advocates"

    id = Column(Integer, primary_key=True, index=True)
    advocate_name = Column(String(100))
    bar_council_id = Column(String(100))
    enrollment_number = Column(String(100))
    phone_number = Column(String(20))
    email_address = Column(String(100))
    specialization = Column(String(100))
    city = Column(String(100))
    status = Column(String(20), default="Active")

    # New fields
    date_of_birth = Column(String(50), nullable=True)
    gender = Column(String(20), nullable=True)
    aadhaar_number = Column(String(20), nullable=True)
    pan_number = Column(String(20), nullable=True)
    practice_area = Column(String(100), nullable=True)
    court_type = Column(String(100), nullable=True)
    years_of_experience = Column(String(20), nullable=True)
    languages_known = Column(String(200), nullable=True)
    law_firm_name = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)
    chambers_address = Column(String(500), nullable=True)
    about = Column(String(1000), nullable=True)
    profile_image = Column(LONGTEXT, nullable=True)



class AssignedCase(Base):
    __tablename__ = "assigned_cases"

    id = Column(Integer, primary_key=True, index=True)
    case_name = Column(String(255))
    case_number = Column(String(100))
    case_title = Column(String(255))
    advocate_name = Column(String(255))
    practice_area = Column(String(100))
    priority = Column(String(50))
    due_date = Column(String(50))
    assignment_notes = Column(String(500))   
    status = Column(String(50), default="Active")
    assigned_documents = Column(Text, nullable=True)
