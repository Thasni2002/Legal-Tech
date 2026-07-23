from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base
from datetime import datetime

class ClerkTaskAssignmentRecord(Base):
    __tablename__ = "clerk_assigned_tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    assignee_role = Column(String(100), nullable=False)  # Typist, Junior Advocate, Office Staff
    assignee_name = Column(String(255), nullable=True)
    due_date = Column(String(100), nullable=True)
    priority = Column(String(50), default="Medium")
    status = Column(String(50), default="Pending")
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
