from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.api.deps import (
    get_db,
    get_current_user,
    get_current_user_optional,
    require_admin,
    require_coordinator_or_admin
)
from app.models.user import User
from app.models.category import EventCategory
from app.models.event import Event
from app.models.registration import Registration
from app.models.feedback import Feedback
from app.models.notification import Notification
from app.schemas.event import (
    EventCreate, EventUpdate, EventOut, EventDetailOut, EventRejection, EventCancellation
)
from app.schemas.user import UserOut
from app.schemas.category import CategoryOut

router = APIRouter()


def _format_event_out(event: Event, db: Session, current_user_id: Optional[int] = None) -> EventOut:
    confirmed_regs = db.query(Registration).filter(
        Registration.event_id == event.id,
        Registration.status == "confirmed"
    ).count()

    avail = max(0, event.capacity - confirmed_regs)
    cat_name = event.category.name if event.category else "General"
    coord_name = event.coordinator.full_name if event.coordinator else "Unknown"

    is_reg = False
    reg_id = None
    if current_user_id:
        user_reg = db.query(Registration).filter(
            Registration.event_id == event.id,
            Registration.student_id == current_user_id,
            Registration.status == "confirmed"
        ).first()
        if user_reg:
            is_reg = True
            reg_id = user_reg.id

    return EventOut(
        id=event.id,
        title=event.title,
        description=event.description,
        category_id=event.category_id,
        venue=event.venue,
        start_time=event.start_time,
        end_time=event.end_time,
        capacity=event.capacity,
        banner_url=event.banner_url,
        coordinator_id=event.coordinator_id,
        status=event.status,
        rejection_reason=event.rejection_reason,
        cancellation_reason=event.cancellation_reason,
        created_at=event.created_at,
        updated_at=event.updated_at,
        registered_count=confirmed_regs,
        available_seats=avail,
        category_name=cat_name,
        coordinator_name=coord_name,
        is_user_registered=is_reg,
        user_registration_id=reg_id
    )


@router.get("", response_model=List[EventOut])
def list_events(
    category_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query("published", alias="status"),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    query = db.query(Event)

    # By default, public browse shows published events
    if status_filter and status_filter != "all":
        query = query.filter(Event.status == status_filter)

    if category_id:
        query = query.filter(Event.category_id == category_id)

    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Event.title.ilike(pattern),
                Event.description.ilike(pattern),
                Event.venue.ilike(pattern)
            )
        )

    if start_date:
        query = query.filter(Event.start_time >= start_date)

    if end_date:
        query = query.filter(Event.end_time <= end_date)

    events = query.order_by(Event.start_time.asc()).offset(skip).limit(limit).all()
    user_id = current_user.id if current_user else None
    return [_format_event_out(e, db, user_id) for e in events]


@router.get("/coordinator/my-events", response_model=List[EventOut])
def list_coordinator_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_admin)
):
    query = db.query(Event)
    if current_user.role != "admin":
        query = query.filter(Event.coordinator_id == current_user.id)
    events = query.order_by(Event.created_at.desc()).all()
    return [_format_event_out(e, db, current_user.id) for e in events]


@router.get("/admin/pending", response_model=List[EventOut])
def list_pending_approval_events(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    events = db.query(Event).filter(
        Event.status == "pending_approval"
    ).order_by(Event.created_at.asc()).all()
    return [_format_event_out(e, db, admin_user.id) for e in events]


@router.get("/admin/all", response_model=List[EventOut])
def list_all_admin_events(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    events = db.query(Event).order_by(Event.created_at.desc()).all()
    return [_format_event_out(e, db, admin_user.id) for e in events]


@router.get("/{event_id}", response_model=EventDetailOut)
def get_event_detail(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    user_id = current_user.id if current_user else None
    base_out = _format_event_out(event, db, user_id)

    # Average rating and feedback count
    feedbacks = db.query(Feedback).filter(Feedback.event_id == event_id).all()
    avg_rating = 0.0
    if feedbacks:
        avg_rating = round(sum(f.rating for f in feedbacks) / len(feedbacks), 1)

    coord_out = UserOut.model_validate(event.coordinator) if event.coordinator else None
    cat_out = CategoryOut.model_validate(event.category) if event.category else None

    return EventDetailOut(
        **base_out.model_dump(),
        coordinator=coord_out,
        category=cat_out,
        average_rating=avg_rating,
        feedback_count=len(feedbacks)
    )


@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(
    event_in: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_admin)
):
    cat_id = None
    if event_in.category_id and event_in.category_id > 0:
        cat = db.query(EventCategory).filter(EventCategory.id == event_in.category_id).first()
        if not cat:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected category does not exist.")
        cat_id = cat.id

    # If an Administrator is creating the event, allow direct publishing or draft
    if current_user.role == "admin":
        if event_in.publish_now or event_in.submit_for_approval:
            initial_status = "published"
        else:
            initial_status = "draft"
    else:
        initial_status = "pending_approval" if event_in.submit_for_approval else "draft"

    banner = event_in.banner_url.strip() if event_in.banner_url and event_in.banner_url.strip() else None

    event = Event(
        title=event_in.title.strip(),
        description=event_in.description.strip(),
        category_id=cat_id,
        venue=event_in.venue.strip(),
        start_time=event_in.start_time,
        end_time=event_in.end_time,
        capacity=event_in.capacity,
        banner_url=banner,
        coordinator_id=current_user.id,
        status=initial_status
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # Notify admins if submitted for approval
    if initial_status == "pending_approval":
        admins = db.query(User).filter(User.role == "admin").all()
        for admin in admins:
            if admin.id != current_user.id:
                notif = Notification(
                    recipient_id=admin.id,
                    title="New Event Submitted for Approval",
                    message=f"Event '{event.title}' by {current_user.full_name} is awaiting your review.",
                    type="info"
                )
                db.add(notif)
        db.commit()

    return _format_event_out(event, db, current_user.id)


@router.put("/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    event_in: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_admin)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    # Ownership check
    if current_user.role != "admin" and event.coordinator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to edit this event."
        )

    if event.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancelled events cannot be edited."
        )

    if event_in.category_id is not None:
        cat = db.query(EventCategory).filter(EventCategory.id == event_in.category_id).first()
        if not cat:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected category does not exist.")
        event.category_id = event_in.category_id

    if event_in.title is not None:
        event.title = event_in.title.strip()
    if event_in.description is not None:
        event.description = event_in.description.strip()
    if event_in.venue is not None:
        event.venue = event_in.venue.strip()
    if event_in.start_time is not None:
        event.start_time = event_in.start_time
    if event_in.end_time is not None:
        event.end_time = event_in.end_time
    if event_in.capacity is not None:
        # Check that new capacity is not less than confirmed registrations
        confirmed_count = db.query(Registration).filter(
            Registration.event_id == event.id,
            Registration.status == "confirmed"
        ).count()
        if event_in.capacity < confirmed_count:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot reduce capacity to {event_in.capacity}; {confirmed_count} students already registered."
            )
        event.capacity = event_in.capacity
    if event_in.banner_url is not None:
        event.banner_url = event_in.banner_url.strip()

    db.commit()
    db.refresh(event)
    return _format_event_out(event, db, current_user.id)


@router.post("/{event_id}/submit", response_model=EventOut)
def submit_event_for_approval(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_admin)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    if current_user.role != "admin" and event.coordinator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")

    if event.status not in ["draft", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit event with status '{event.status}'."
        )

    event.status = "pending_approval"
    event.rejection_reason = None
    db.commit()
    db.refresh(event)

    # Notify admins
    admins = db.query(User).filter(User.role == "admin").all()
    for admin in admins:
        notif = Notification(
            recipient_id=admin.id,
            title="Event Submitted for Approval",
            message=f"Event '{event.title}' was submitted for review.",
            type="info"
        )
        db.add(notif)
    db.commit()

    return _format_event_out(event, db, current_user.id)


@router.post("/{event_id}/approve", response_model=EventOut)
def approve_event(
    event_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    # Strict Rule: Coordinators must not approve their own events
    if admin_user.id == event.coordinator_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conflict of Interest: Coordinators cannot approve their own events. Another administrator must review this event."
        )

    if event.status != "pending_approval":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Event cannot be approved from status '{event.status}'."
        )

    event.status = "approved"
    event.rejection_reason = None
    db.commit()
    db.refresh(event)

    # Notify the coordinator
    notif = Notification(
        recipient_id=event.coordinator_id,
        title="Event Approved!",
        message=f"Congratulations! Your event '{event.title}' has been approved by administrator {admin_user.full_name}.",
        type="success"
    )
    db.add(notif)
    db.commit()

    return _format_event_out(event, db, admin_user.id)


@router.post("/{event_id}/reject", response_model=EventOut)
def reject_event(
    event_id: int,
    rejection_data: EventRejection,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    if admin_user.id == event.coordinator_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conflict of Interest: Cannot reject your own event as administrator."
        )

    if event.status != "pending_approval":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Event is not currently pending approval (status: {event.status})."
        )

    event.status = "rejected"
    event.rejection_reason = rejection_data.reason.strip()
    db.commit()
    db.refresh(event)

    # Notify coordinator
    notif = Notification(
        recipient_id=event.coordinator_id,
        title="Event Rejected",
        message=f"Your event '{event.title}' was rejected. Reason: {event.rejection_reason}",
        type="warning"
    )
    db.add(notif)
    db.commit()

    return _format_event_out(event, db, admin_user.id)


@router.post("/{event_id}/publish", response_model=EventOut)
def publish_event(
    event_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    if event.status not in ["approved"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only approved events can be published (current status: {event.status})."
        )

    event.status = "published"
    db.commit()
    db.refresh(event)

    # Notify coordinator
    notif = Notification(
        recipient_id=event.coordinator_id,
        title="Event Published Live",
        message=f"Your event '{event.title}' is now published and open for registrations!",
        type="success"
    )
    db.add(notif)
    db.commit()

    return _format_event_out(event, db, admin_user.id)


@router.post("/{event_id}/cancel", response_model=EventOut)
def cancel_event(
    event_id: int,
    cancellation_data: EventCancellation,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_admin)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    if current_user.role != "admin" and event.coordinator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to cancel this event.")

    if event.status == "cancelled":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Event is already cancelled.")

    event.status = "cancelled"
    event.cancellation_reason = cancellation_data.reason.strip()
    db.commit()
    db.refresh(event)

    # Notify all registered students
    confirmed_regs = db.query(Registration).filter(
        Registration.event_id == event_id,
        Registration.status == "confirmed"
    ).all()

    for reg in confirmed_regs:
        reg.status = "cancelled"
        reg.cancellation_reason = f"Event cancelled by organizer: {event.cancellation_reason}"
        notif = Notification(
            recipient_id=reg.student_id,
            title=f"Event Cancelled: {event.title}",
            message=f"We regret to inform you that the event '{event.title}' has been cancelled. Reason: {event.cancellation_reason}",
            type="alert"
        )
        db.add(notif)

    db.commit()
    return _format_event_out(event, db, current_user.id)


@router.delete("/{event_id}", status_code=status.HTTP_200_OK)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_admin)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    # Ownership check: must be owner coordinator or admin
    if current_user.role != "admin" and event.coordinator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this event."
        )

    # Notify any registered students before deleting
    registrations = db.query(Registration).filter(Registration.event_id == event_id).all()
    for reg in registrations:
        notif = Notification(
            recipient_id=reg.student_id,
            title=f"Event Removed: {event.title}",
            message=f"The event '{event.title}' scheduled at {event.venue} has been removed from the system.",
            type="alert"
        )
        db.add(notif)

    # Delete the event
    db.delete(event)
    db.commit()
    return {"message": f"Event '{event.title}' was successfully removed."}

