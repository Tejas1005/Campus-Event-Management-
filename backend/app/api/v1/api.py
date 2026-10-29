from fastapi import APIRouter
from app.api.v1 import (
    auth,
    users,
    categories,
    events,
    registrations,
    attendance,
    notifications,
    feedback,
    reports
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/admin/users", tags=["Admin Users"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(events.router, prefix="/events", tags=["Events"])
api_router.include_router(registrations.router, prefix="/registrations", tags=["Registrations"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["Feedback"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports & Analytics"])
