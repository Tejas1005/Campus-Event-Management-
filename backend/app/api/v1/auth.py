from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
import httpx
from jose import jwt
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, UserUpdate, UserPasswordUpdate, UserLogin
from app.schemas.token import Token


class RoleSyncRequest(BaseModel):
    role: str  # "student", "coordinator", "admin"


class GoogleTokenExchangeRequest(BaseModel):
    supabase_access_token: str
    role: Optional[str] = "student"  # role the user selected on login page


router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Restrict self-registration role: default is student, can be coordinator if requested
    allowed_roles = ["student", "coordinator"]
    role = user_in.role if user_in.role in allowed_roles else "student"

    user = User(
        full_name=user_in.full_name.strip(),
        email=user_in.email.lower().strip(),
        hashed_password=get_password_hash(user_in.password),
        role=role,
        status="active",
        department=user_in.department,
        student_id_number=user_in.student_id_number,
        phone=user_in.phone
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
async def login(
    request: Request,
    db: Session = Depends(get_db)
):
    # Support both Form data (Swagger UI) and JSON body (Axios frontend)
    content_type = request.headers.get("content-type", "")
    username = None
    password = None

    if "application/json" in content_type:
        body = await request.json()
        username = body.get("email") or body.get("username")
        password = body.get("password")
    else:
        form = await request.form()
        username = form.get("username") or form.get("email")
        password = form.get("password")

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required."
        )

    user = db.query(User).filter(User.email == username.lower().strip()).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact an administrator."
        )

    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "status": user.status,
            "department": user.department,
            "student_id_number": user.student_id_number,
            "phone": user.phone
        }
    }


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_current_user(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name.strip()
    if user_in.department is not None:
        current_user.department = user_in.department.strip()
    if user_in.student_id_number is not None:
        current_user.student_id_number = user_in.student_id_number.strip()
    if user_in.phone is not None:
        current_user.phone = user_in.phone.strip()

    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/change-password")
def change_password(
    password_data: UserPasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    return {"message": "Password changed successfully."}


@router.post("/ensure-role", response_model=UserOut)
def ensure_role(
    role_data: RoleSyncRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Syncs the authenticated user's role in the backend DB to the requested role.
    Called after Supabase login when the frontend knows the user's intended role.
    Allowed roles: student, coordinator, admin.
    Note: In production, admin promotion should be separately guarded.
    """
    allowed_roles = ["student", "coordinator", "admin"]
    if role_data.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(allowed_roles)}"
        )

    # Only update if the role has actually changed
    if current_user.role != role_data.role:
        current_user.role = role_data.role
        db.commit()
        db.refresh(current_user)

    return current_user


@router.post("/google-exchange", response_model=Token)
async def google_exchange(
    req: GoogleTokenExchangeRequest,
    db: Session = Depends(get_db)
):
    token = req.supabase_access_token.strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Supabase access token."
        )

    email = None
    full_name = None
    user_metadata = {}

    # 1. Try verifying with Supabase's /auth/v1/user endpoint
    if settings.SUPABASE_URL:
        headers = {"Authorization": f"Bearer {token}"}
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        if key and key != "your-service-role-key-here":
            headers["apikey"] = key

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user",
                    headers=headers
                )
                if resp.status_code == 200:
                    sb_user = resp.json()
                    email = sb_user.get("email")
                    user_metadata = sb_user.get("user_metadata") or {}
                    full_name = user_metadata.get("full_name") or user_metadata.get("name")
        except Exception:
            pass

    # 2. Fallback: inspect unverified JWT claims if Supabase endpoint was unreachable
    if not email:
        try:
            claims = jwt.get_unverified_claims(token)
            email = claims.get("email")
            user_metadata = claims.get("user_metadata") or {}
            full_name = full_name or user_metadata.get("full_name") or user_metadata.get("name")
        except Exception:
            pass

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not verify Supabase session. Please try logging in again."
        )

    email = email.lower().strip()
    selected_role = req.role if req.role in ["student", "coordinator", "admin"] else "student"

    # Find or create user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        dept = (
            user_metadata.get("department")
            or ("University Administration" if selected_role == "admin" else "Student Affairs" if selected_role == "coordinator" else "Computer Science")
        )
        user = User(
            email=email,
            full_name=full_name or email.split("@")[0].replace(".", " ").title(),
            hashed_password=get_password_hash(f"sb_google_oauth_{email}"),
            role=selected_role,
            status="active",
            department=dept,
            student_id_number=user_metadata.get("student_id") or user_metadata.get("student_id_number")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if user.status != "active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been deactivated. Please contact an administrator."
            )
        updated = False
        if req.role and req.role in ["student", "coordinator", "admin"] and user.role != req.role:
            user.role = req.role
            updated = True
        if full_name and (not user.full_name or user.full_name == email.split("@")[0]):
            user.full_name = full_name
            updated = True
        if updated:
            db.commit()
            db.refresh(user)

    # Issue FastAPI backend JWT
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "department": user.department,
            "student_id": user.student_id_number,
            "phone": user.phone,
            "status": user.status
        }
    }
