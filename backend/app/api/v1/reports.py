import csv
import io
from typing import List
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, require_coordinator_or_admin, require_admin
from app.models.user import User
from app.models.category import EventCategory
from app.models.event import Event
from app.models.registration import Registration
from app.models.attendance import Attendance
from app.models.feedback import Feedback
from app.schemas.report import (
    DashboardStats, CategoryMetric, AttendanceSummary, AttendanceSummaryItem
)

router = APIRouter()


@router.get("/dashboard-stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db)
):
    total_students = db.query(User).filter(User.role == "student").count()
    total_coordinators = db.query(User).filter(User.role == "coordinator").count()
    
    total_events = db.query(Event).count()
    published_events = db.query(Event).filter(Event.status == "published").count()
    pending_approvals = db.query(Event).filter(Event.status == "pending_approval").count()

    total_regs = db.query(Registration).count()
    active_regs = db.query(Registration).filter(Registration.status == "confirmed").count()

    attendances_marked = db.query(Attendance).count()
    present_attendances = db.query(Attendance).filter(Attendance.status == "present").count()

    attendance_rate = 0.0
    if attendances_marked > 0:
        attendance_rate = round((present_attendances / attendances_marked) * 100, 1)

    avg_rating_res = db.query(func.avg(Feedback.rating)).scalar()
    avg_rating = round(float(avg_rating_res), 1) if avg_rating_res else 0.0

    return DashboardStats(
        total_students=total_students,
        total_coordinators=total_coordinators,
        total_events=total_events,
        published_events=published_events,
        pending_approvals=pending_approvals,
        total_registrations=total_regs,
        active_registrations=active_regs,
        total_attendances_marked=attendances_marked,
        attendance_rate=attendance_rate,
        average_event_rating=avg_rating
    )


@router.get("/category-distribution", response_model=List[CategoryMetric])
def get_category_distribution(
    db: Session = Depends(get_db)
):
    categories = db.query(EventCategory).all()
    results = []

    for cat in categories:
        event_count = db.query(Event).filter(Event.category_id == cat.id).count()
        reg_count = db.query(Registration).join(Event).filter(
            Event.category_id == cat.id,
            Registration.status == "confirmed"
        ).count()

        results.append(
            CategoryMetric(
                category_id=cat.id,
                category_name=cat.name,
                event_count=event_count,
                registration_count=reg_count
            )
        )
    return results


@router.get("/attendance-summary", response_model=AttendanceSummary)
def get_attendance_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_admin)
):
    events = db.query(Event).filter(Event.status.in_(["published", "approved"])).all()
    items = []

    for ev in events:
        regs = db.query(Registration).filter(
            Registration.event_id == ev.id,
            Registration.status == "confirmed"
        ).count()

        present = db.query(Attendance).join(Registration).filter(
            Registration.event_id == ev.id,
            Attendance.status == "present"
        ).count()

        absent = db.query(Attendance).join(Registration).filter(
            Registration.event_id == ev.id,
            Attendance.status == "absent"
        ).count()

        marked_total = present + absent
        rate = round((present / marked_total) * 100, 1) if marked_total > 0 else 0.0

        items.append(
            AttendanceSummaryItem(
                event_id=ev.id,
                event_title=ev.title,
                capacity=ev.capacity,
                registered_count=regs,
                present_count=present,
                absent_count=absent,
                attendance_rate=rate
            )
        )

    return AttendanceSummary(items=items)


@router.get("/export/registrations-csv")
def export_registrations_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_admin)
):
    registrations = db.query(Registration).order_by(Registration.registration_date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Registration ID",
        "Student ID",
        "Student Name",
        "Student Email",
        "Department",
        "Event ID",
        "Event Title",
        "Venue",
        "Event Start Time",
        "Registration Status",
        "Attendance Status",
        "Registration Date"
    ])

    for r in registrations:
        att_status = r.attendance.status if r.attendance else "unmarked"
        writer.writerow([
            r.id,
            r.student.student_id_number or r.student.id,
            r.student.full_name,
            r.student.email,
            r.student.department or "N/A",
            r.event.id if r.event else "N/A",
            r.event.title if r.event else "N/A",
            r.event.venue if r.event else "N/A",
            r.event.start_time.isoformat() if r.event else "N/A",
            r.status,
            att_status,
            r.registration_date.isoformat()
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=cems_registrations_report.csv"}
    )
