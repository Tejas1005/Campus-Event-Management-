from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, require_admin
from app.models.category import EventCategory
from app.models.event import Event
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryOut

router = APIRouter()


@router.get("", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    categories = db.query(EventCategory).all()
    out = []
    for cat in categories:
        event_count = db.query(Event).filter(Event.category_id == cat.id).count()
        cat_data = CategoryOut(
            id=cat.id,
            name=cat.name,
            description=cat.description,
            icon=cat.icon,
            event_count=event_count
        )
        out.append(cat_data)
    return out


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    cat_in: CategoryCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    existing = db.query(EventCategory).filter(
        func.lower(EventCategory.name) == cat_in.name.lower().strip()
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists."
        )

    category = EventCategory(
        name=cat_in.name.strip(),
        description=cat_in.description.strip() if cat_in.description else None,
        icon=cat_in.icon or "Calendar"
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return CategoryOut(
        id=category.id,
        name=category.name,
        description=category.description,
        icon=category.icon,
        event_count=0
    )


@router.put("/{cat_id}", response_model=CategoryOut)
def update_category(
    cat_id: int,
    cat_in: CategoryUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    category = db.query(EventCategory).filter(EventCategory.id == cat_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")

    if cat_in.name:
        existing = db.query(EventCategory).filter(
            func.lower(EventCategory.name) == cat_in.name.lower().strip(),
            EventCategory.id != cat_id
        ).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category name already in use.")
        category.name = cat_in.name.strip()

    if cat_in.description is not None:
        category.description = cat_in.description.strip()
    if cat_in.icon is not None:
        category.icon = cat_in.icon.strip()

    db.commit()
    db.refresh(category)
    event_count = db.query(Event).filter(Event.category_id == category.id).count()
    return CategoryOut(
        id=category.id,
        name=category.name,
        description=category.description,
        icon=category.icon,
        event_count=event_count
    )


@router.delete("/{cat_id}", status_code=status.HTTP_200_OK)
def delete_category(
    cat_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    category = db.query(EventCategory).filter(EventCategory.id == cat_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")

    # Detach events linked to this category safely
    db.query(Event).filter(Event.category_id == cat_id).update({Event.category_id: None})
    db.delete(category)
    db.commit()
    return {"message": "Category deleted successfully."}
