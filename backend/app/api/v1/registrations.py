from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_student, require_coordinator_or_admin
from app.models.user import User
from app.models.event import Event
from app.models.registration import Registration
from app.models.attendance import Attendance
from app.models.feedback import Feedback
from app.models.notification import Notification
from app.schemas.registration import (
    RegistrationCreate, RegistrationCancellation, RegistrationOut, ParticipantOut
)
from app.schemas.user import UserOut
from app.api.v1.events import _format_event_out

router = APIRouter()


@router.post("", response_model=RegistrationOut, status_code=status.HTTP_201_CREATED)
def register_for_event(
    reg_in: RegistrationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    event = db.query(Event).filter(Event.id == reg_in.event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    if event.status != "published":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration is only open for published events."
        )

    # Check if event has ended
    now_utc = datetime.now(timezone.utc)
    # Ensure event.end_time has tzinfo if comparing
    event_end = event.end_time
    if event_end.tzinfo is None:
        event_end = event_end.replace(tzinfo=timezone.utc)
    if event_end < now_utc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration closed: This event has already concluded."
        )

    # Check duplicate active registration
    existing_reg = db.query(Registration).filter(
        Registration.student_id == current_user.id,
        Registration.event_id == event.id
    ).first()

    if existing_reg:
        if existing_reg.status == "confirmed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are already registered for this event."
            )
        else:
            # Re-activating a previously cancelled registration
            # Check capacity first
            confirmed_count = db.query(Registration).filter(
                Registration.event_id == event.id,
                Registration.status == "confirmed"
            ).count()

            if confirmed_count >= event.capacity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Event capacity reached. No additional seats available."
                )

            existing_reg.status = "confirmed"
            existing_reg.registration_date = datetime.now(timezone.utc)
            existing_reg.cancellation_reason = None
            db.commit()
            db.refresh(existing_reg)

            # Confirmation notification
            notif = Notification(
                recipient_id=current_user.id,
                title="Registration Re-confirmed",
                message=f"You have re-registered for '{event.title}' at {event.venue}.",
                type="success"
            )
            db.add(notif)
            db.commit()

            return _build_reg_out(existing_reg, db, current_user.id)

    # New registration: Validate capacity
    confirmed_count = db.query(Registration).filter(
        Registration.event_id == event.id,
        Registration.status == "confirmed"
    ).count()

    if confirmed_count >= event.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event capacity reached. No additional seats available."
        )

    registration = Registration(
        student_id=current_user.id,
        event_id=event.id,
        status="confirmed"
    )
    db.add(registration)
    db.commit()
    db.refresh(registration)

    # Confirmation notification
    notif = Notification(
        recipient_id=current_user.id,
        title="Registration Confirmed!",
        message=f"You are successfully registered for '{event.title}' at {event.venue}.",
        type="success"
    )
    db.add(notif)
    db.commit()

    return _build_reg_out(registration, db, current_user.id)


@router.post("/{reg_id}/cancel", response_model=RegistrationOut)
def cancel_registration(
    reg_id: int,
    cancel_in: RegistrationCancellation,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reg = db.query(Registration).filter(Registration.id == reg_id).first()
    if not reg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found.")

    if current_user.role != "admin" and reg.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to cancel this registration."
        )

    if reg.status == "cancelled":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Registration is already cancelled.")

    # Check if event start time has already passed
    event = reg.event
    event_start = event.start_time
    if event_start.tzinfo is None:
        event_start = event_start.replace(tzinfo=timezone.utc)
    if event_start <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancellation deadline passed: Cannot cancel registration after event start."
        )

    reg.status = "cancelled"
    reg.cancellation_reason = cancel_in.reason or "Cancelled by student"
    db.commit()
    db.refresh(reg)

    # Notification
    notif = Notification(
        recipient_id=reg.student_id,
        title="Registration Cancelled",
        message=f"Your registration for '{event.title}' has been cancelled.",
        type="info"
    )
    db.add(notif)
    db.commit()

    return _build_reg_out(reg, db, current_user.id)


@router.get("/my-registrations", response_model=List[RegistrationOut])
def get_my_registrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    regs = db.query(Registration).filter(
        Registration.student_id == current_user.id
    ).order_by(Registration.registration_date.desc()).all()

    return [_build_reg_out(r, db, current_user.id) for r in regs]


@router.get("/events/{event_id}/participants", response_model=List[ParticipantOut])
def get_event_participants(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_admin)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    if current_user.role != "admin" and event.coordinator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view the participants for this event."
        )

    regs = db.query(Registration).filter(
        Registration.event_id == event_id
    ).order_by(Registration.registration_date.asc()).all()

    participants = []
    for r in regs:
        att = r.attendance
        att_status = att.status if att else "unmarked"
        att_time = att.marked_at if att else None

        participants.append(
            ParticipantOut(
                registration_id=r.id,
                registration_date=r.registration_date,
                status=r.status,
                student=UserOut.model_validate(r.student),
                attendance_status=att_status,
                attendance_marked_at=att_time
            )
        )
    return participants


def _build_reg_out(reg: Registration, db: Session, current_user_id: int) -> RegistrationOut:
    event_out = _format_event_out(reg.event, db, current_user_id) if reg.event else None
    att_brief = None
    if reg.attendance:
        att_brief = {
            "id": reg.attendance.id,
            "status": reg.attendance.status,
            "marked_at": reg.attendance.marked_at
        }
    
    # Check if student already submitted feedback
    has_fb = db.query(Feedback).filter(
        Feedback.student_id == reg.student_id,
        Feedback.event_id == reg.event_id
    ).first() is not None

    return RegistrationOut(
        id=reg.id,
        student_id=reg.student_id,
        event_id=reg.event_id,
        registration_date=reg.registration_date,
        status=reg.status,
        cancellation_reason=reg.cancellation_reason,
        event=event_out,
        attendance=att_brief,
        has_feedback=has_fb
    )
