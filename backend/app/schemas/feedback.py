from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.user import UserOut


class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class FeedbackOut(BaseModel):
    id: int
    student_id: int
    event_id: int
    rating: int
    comment: Optional[str] = None
    submitted_at: datetime
    student: Optional[UserOut] = None

    model_config = {"from_attributes": True}


class EventFeedbackSummary(BaseModel):
    average_rating: float
    total_feedbacks: int
    feedbacks: list[FeedbackOut]
