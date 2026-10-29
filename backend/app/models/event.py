from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), index=True, nullable=False)
    description = Column(Text, nullable=False)
    category_id = Column(Integer, ForeignKey("event_categories.id", ondelete="SET NULL"), nullable=True)
    venue = Column(String(200), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    capacity = Column(Integer, nullable=False, default=100)
    coordinator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Statuses: draft, pending_approval, approved, rejected, published, cancelled
    status = Column(String(30), nullable=False, default="draft", index=True)
    rejection_reason = Column(Text, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    banner_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    coordinator = relationship("User", back_populates="events_coordinated")
    category = relationship("EventCategory", back_populates="events")
    registrations = relationship("Registration", back_populates="event", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="event", cascade="all, delete-orphan")
