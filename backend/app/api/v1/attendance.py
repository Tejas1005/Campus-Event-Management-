from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_coordinator_or_admin
from app.models.user import User
from app.models.event import Event
from app.models.registration import Registration
from app.models.attendance import Attendance
from app.schemas.attendance import AttendanceMark, AttendanceBulkMark, AttendanceOut

router = APIRouter()


@router.post("/mark", response_model=AttendanceOut)
def mark_attendance(
    att_in: AttendanceMark,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_admin)
):
    reg = db.query(Registration).filter(Registration.id == att_in.registration_id).first()
    if not reg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration record not found.")

    if reg.status != "confirmed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot mark attendance for a cancelled registration."
        )

    # Permission check: current user must be owner coordinator or admin
    if current_user.role != "admin" and reg.event.coordinator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to mark attendance for this event."
        )

    attendance = db.query(Attendance).filter(Attendance.registration_id == reg.id).first()
    if attendance:
        attendance.status = att_in.status
        attendance.marked_at = datetime.now(timezone.utc)
        attendance.marked_by_id = current_user.id
    else:
        attendance = Attendance(
            registration_id=reg.id,
            status=att_in.status,
            marked_at=datetime.now(timezone.utc),
            marked_by_id=current_user.id
        )
        db.add(attendance)

    db.commit()
    db.refresh(attendance)
    return attendance


@router.post("/bulk", response_model=List[AttendanceOut])
def bulk_mark_attendance(
    bulk_in: AttendanceBulkMark,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_admin)
):
    results = []
    now_utc = datetime.now(timezone.utc)

    for item in bulk_in.records:
        reg = db.query(Registration).filter(Registration.id == item.registration_id).first()
        if not reg or reg.status != "confirmed":
            continue

        if current_user.role != "admin" and reg.event.coordinator_id != current_user.id:
            continue

        att = db.query(Attendance).filter(Attendance.registration_id == reg.id).first()
        if att:
            att.status = item.status
            att.marked_at = now_utc
            att.marked_by_id = current_user.id
        else:
            att = Attendance(
                registration_id=reg.id,
                status=item.status,
                marked_at=now_utc,
                marked_by_id=current_user.id
            )
            db.add(att)
        results.append(att)

    db.commit()
    for att in results:
        db.refresh(att)
    return results


@router.get("/event/{event_id}", response_model=List[AttendanceOut])
def get_event_attendance(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_admin)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    if current_user.role != "admin" and event.coordinator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")

    attendances = db.query(Attendance).join(Registration).filter(
        Registration.event_id == event_id
    ).all()
    return attendances
