from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="student")  # "student", "coordinator", "admin"
    status = Column(String(20), nullable=False, default="active")  # "active", "inactive"
    department = Column(String(100), nullable=True)
    student_id_number = Column(String(50), nullable=True)
    phone = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    events_coordinated = relationship("Event", back_populates="coordinator", cascade="all, delete-orphan")
    registrations = relationship("Registration", back_populates="student", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="recipient", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="student", cascade="all, delete-orphan")
