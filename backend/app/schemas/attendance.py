from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class AttendanceMark(BaseModel):
    registration_id: int
    status: str = Field(..., pattern="^(present|absent)$")


class BulkAttendanceItem(BaseModel):
    registration_id: int
    status: str = Field(..., pattern="^(present|absent)$")


class AttendanceBulkMark(BaseModel):
    records: List[BulkAttendanceItem]


class AttendanceOut(BaseModel):
    id: int
    registration_id: int
    status: str
    marked_at: datetime
    marked_by_id: Optional[int] = None

    model_config = {"from_attributes": True}
