from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class NotificationCreate(BaseModel):
    recipient_id: int
    title: str = Field(..., min_length=2, max_length=200)
    message: str = Field(..., min_length=2)
    type: Optional[str] = "info"


class BroadcastAnnouncement(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    message: str = Field(..., min_length=2)
    type: Optional[str] = "alert"


class NotificationOut(BaseModel):
    id: int
    recipient_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
