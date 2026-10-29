from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    registration_id = Column(Integer, ForeignKey("registrations.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    # Statuses: "present", "absent"
    status = Column(String(20), nullable=False, default="present")
    marked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    marked_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    registration = relationship("Registration", back_populates="attendance")
    marked_by = relationship("User", foreign_keys=[marked_by_id])
