from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_no = Column(String(50), unique=True, index=True)
    title = Column(String(255), nullable=False)
    client_name = Column(String(150), nullable=False)
    type = Column(String(100), nullable=False)  # e.g. "Civil", "Criminal"
    court = Column(String(255), nullable=False)
    status = Column(String(50), default="Active")  # "Active", "Pending", "Hearing", "Closed"
    advocate_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    advocate = relationship("User", foreign_keys=[advocate_id])

class Hearing(Base):
    __tablename__ = "hearings"

    id = Column(Integer, primary_key=True, index=True)
    case_no = Column(String(50), nullable=True)
    case_title = Column(String(255), nullable=False)
    court = Column(String(255), nullable=False)
    advocate_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    advocate_name = Column(String(150), nullable=True)
    date = Column(Date, nullable=False)
    time = Column(String(50), nullable=False)
    status = Column(String(50), default="Scheduled")

    advocate = relationship("User", foreign_keys=[advocate_id])

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    timestamp_str = Column(String(100), nullable=False)  # e.g. "10 mins ago"
    type = Column(String(50), nullable=True)
    advocate_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    advocate = relationship("User", foreign_keys=[advocate_id])

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    case_no = Column(String(50), nullable=True)
    advocate_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    advocate = relationship("User", foreign_keys=[advocate_id])
