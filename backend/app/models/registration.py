from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base


class Registration(Base):
    __tablename__ = "registrations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    registration_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Statuses: "confirmed", "cancelled"
    status = Column(String(20), nullable=False, default="confirmed", index=True)
    cancellation_reason = Column(String(255), nullable=True)

    # Relationships
    student = relationship("User", back_populates="registrations")
    event = relationship("Event", back_populates="registrations")
    attendance = relationship("Attendance", back_populates="registration", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("student_id", "event_id", name="uq_student_event_registration"),
    )
