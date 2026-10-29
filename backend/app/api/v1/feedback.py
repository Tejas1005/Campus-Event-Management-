from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, require_student
from app.models.user import User
from app.models.event import Event
from app.models.registration import Registration
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate, FeedbackOut, EventFeedbackSummary
from app.schemas.user import UserOut

router = APIRouter()


@router.post("/event/{event_id}", response_model=FeedbackOut, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    event_id: int,
    fb_in: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    # Student must have registered for the event
    reg = db.query(Registration).filter(
        Registration.student_id == current_user.id,
        Registration.event_id == event_id
    ).first()

    if not reg:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only submit feedback for events you have registered for."
        )

    # Check duplicate feedback
    existing_fb = db.query(Feedback).filter(
        Feedback.student_id == current_user.id,
        Feedback.event_id == event_id
    ).first()

    if existing_fb:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted feedback for this event."
        )

    feedback = Feedback(
        student_id=current_user.id,
        event_id=event_id,
        rating=fb_in.rating,
        comment=fb_in.comment.strip() if fb_in.comment else None
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    student_out = UserOut.model_validate(current_user)
    return FeedbackOut(
        id=feedback.id,
        student_id=feedback.student_id,
        event_id=feedback.event_id,
        rating=feedback.rating,
        comment=feedback.comment,
        submitted_at=feedback.submitted_at,
        student=student_out
    )


@router.get("/event/{event_id}", response_model=EventFeedbackSummary)
def get_event_feedback(
    event_id: int,
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    feedbacks = db.query(Feedback).filter(
        Feedback.event_id == event_id
    ).order_by(Feedback.submitted_at.desc()).all()

    avg_rating = 0.0
    if feedbacks:
        avg_rating = round(sum(f.rating for f in feedbacks) / len(feedbacks), 1)

    fb_outs = []
    for f in feedbacks:
        fb_outs.append(
            FeedbackOut(
                id=f.id,
                student_id=f.student_id,
                event_id=f.event_id,
                rating=f.rating,
                comment=f.comment,
                submitted_at=f.submitted_at,
                student=UserOut.model_validate(f.student) if f.student else None
            )
        )

    return EventFeedbackSummary(
        average_rating=avg_rating,
        total_feedbacks=len(feedbacks),
        feedbacks=fb_outs
    )
