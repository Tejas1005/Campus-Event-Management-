from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.event import EventOut
from app.schemas.user import UserOut


class RegistrationCreate(BaseModel):
    event_id: int


class RegistrationCancellation(BaseModel):
    reason: Optional[str] = "Student cancelled"


class AttendanceBrief(BaseModel):
    id: int
    status: str
    marked_at: datetime

    model_config = {"from_attributes": True}


class RegistrationOut(BaseModel):
    id: int
    student_id: int
    event_id: int
    registration_date: datetime
    status: str
    cancellation_reason: Optional[str] = None
    event: Optional[EventOut] = None
    attendance: Optional[AttendanceBrief] = None
    has_feedback: Optional[bool] = False

    model_config = {"from_attributes": True}


class ParticipantOut(BaseModel):
    registration_id: int
    registration_date: datetime
    status: str
    student: UserOut
    attendance_status: Optional[str] = "unmarked"  # unmarked, present, absent
    attendance_marked_at: Optional[datetime] = None
