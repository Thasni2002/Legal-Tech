from sqlalchemy import Column, Integer, String, JSON, Boolean, DateTime
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100))
    email = Column(String(100), unique=True)
    password = Column(String(255))
    role = Column(String(50))
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    temp_password = Column(String(100), nullable=True)
    custom_permissions = Column(JSON, nullable=True, default=dict)
    document_access = Column(JSON, nullable=True, default=list)
    google_refresh_token = Column(String(500), nullable=True)


class UserNotificationRead(Base):
    __tablename__ = "user_notification_reads"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    notification_id = Column(String(255), index=True)


class AppNotification(Base):
    __tablename__ = "app_notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=True)
    target_name = Column(String(255), index=True, nullable=True)
    target_role = Column(String(50), nullable=True)
    icon = Column(String(50), default="⚖️")
    title = Column(String(500), nullable=False)
    time_str = Column(String(50), default="Just now")
    color = Column(String(50), default="text-indigo-600")
    bg = Column(String(50), default="bg-indigo-50")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)



