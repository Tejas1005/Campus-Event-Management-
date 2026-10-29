from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, model_validator
from app.schemas.user import UserOut
from app.schemas.category import CategoryOut


class EventBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: str = Field(..., min_length=2)
    category_id: Optional[int] = None
    venue: str = Field(..., min_length=1, max_length=200)
    start_time: datetime
    end_time: datetime
    capacity: int = Field(..., gt=0, le=50000)
    banner_url: Optional[str] = None


class EventCreate(EventBase):
    submit_for_approval: Optional[bool] = False
    publish_now: Optional[bool] = False

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_time <= self.start_time:
            raise ValueError("Event end time must be after start time.")
        return self


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    venue: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    capacity: Optional[int] = None
    banner_url: Optional[str] = None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_time and self.end_time and self.end_time <= self.start_time:
            raise ValueError("Event end time must be after start time.")
        return self


class EventRejection(BaseModel):
    reason: str = Field(..., min_length=5, max_length=500)


class EventCancellation(BaseModel):
    reason: str = Field(..., min_length=5, max_length=500)


class EventOut(EventBase):
    id: int
    coordinator_id: int
    status: str
    rejection_reason: Optional[str] = None
    cancellation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Computed metadata
    registered_count: Optional[int] = 0
    available_seats: Optional[int] = 0
    category_name: Optional[str] = None
    coordinator_name: Optional[str] = None
    is_user_registered: Optional[bool] = False
    user_registration_id: Optional[int] = None

    model_config = {"from_attributes": True}


class EventDetailOut(EventOut):
    coordinator: Optional[UserOut] = None
    category: Optional[CategoryOut] = None
    average_rating: Optional[float] = None
    feedback_count: Optional[int] = 0
