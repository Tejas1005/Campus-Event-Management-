from typing import List, Optional
from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_students: int
    total_coordinators: int
    total_events: int
    published_events: int
    pending_approvals: int
    total_registrations: int
    active_registrations: int
    total_attendances_marked: int
    attendance_rate: float
    average_event_rating: float


class CategoryMetric(BaseModel):
    category_id: int
    category_name: str
    event_count: int
    registration_count: int


class AttendanceSummaryItem(BaseModel):
    event_id: int
    event_title: str
    capacity: int
    registered_count: int
    present_count: int
    absent_count: int
    attendance_rate: float


class AttendanceSummary(BaseModel):
    items: List[AttendanceSummaryItem]
