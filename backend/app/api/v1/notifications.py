from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_admin, require_coordinator_or_admin
from app.models.user import User
from app.models.event import Event
from app.models.registration import Registration
from app.models.notification import Notification
from app.schemas.notification import NotificationOut, BroadcastAnnouncement

router = APIRouter()


@router.get("", response_model=List[NotificationOut])
def get_user_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifs = db.query(Notification).filter(
        Notification.recipient_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(100).all()
    return notifs


@router.put("/read-all", status_code=status.HTTP_200_OK)
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(
        Notification.recipient_id == current_user.id,
        Notification.is_read == False
    ).update({Notification.is_read: True})
    db.commit()
    return {"message": "All notifications marked as read."}


@router.put("/{notif_id}/read", response_model=NotificationOut)
def mark_notification_as_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.recipient_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


@router.post("/announcement/event/{event_id}")
def send_event_announcement(
    event_id: int,
    announcement: BroadcastAnnouncement,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_admin)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    if current_user.role != "admin" and event.coordinator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")

    regs = db.query(Registration).filter(
        Registration.event_id == event_id,
        Registration.status == "confirmed"
    ).all()

    created_notifs = []
    for reg in regs:
        notif = Notification(
            recipient_id=reg.student_id,
            title=f"Announcement: {event.title} - {announcement.title}",
            message=announcement.message,
            type=announcement.type or "info"
        )
        db.add(notif)
        created_notifs.append(notif)

    db.commit()
    return {"message": f"Announcement sent to {len(created_notifs)} attendees."}


@router.post("/announcement/system")
def send_system_announcement(
    announcement: BroadcastAnnouncement,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    users = db.query(User).filter(User.status == "active").all()
    count = 0
    for u in users:
        notif = Notification(
            recipient_id=u.id,
            title=f"System Notice: {announcement.title}",
            message=announcement.message,
            type=announcement.type or "alert"
        )
        db.add(notif)
        count += 1

    db.commit()
    return {"message": f"Broadcast announcement sent to {count} users."}
