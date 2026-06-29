from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.dialects.mysql import LONGTEXT
from app.database import Base

class Case(Base):
    __tablename__ = "case_management_cases"

    id = Column(Integer, primary_key=True, index=True)

    case_id = Column(String(100))
    case_title = Column(String(255))
    case_no = Column(String(100))
    case_type = Column(String(100))
    case_description = Column(Text)

    client_name = Column(String(255))
    contact_number = Column(String(50))
    email_id = Column(String(255))

    court_name = Column(String(255))
    court_type = Column(String(100))

    status = Column(String(50))
    selected_advocate = Column(String(255), nullable=True)
    documents = Column(LONGTEXT, nullable=True)
    next_hearing_date = Column(String(100), nullable=True)