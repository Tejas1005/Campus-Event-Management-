from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    department: Optional[str] = None
    student_id_number: Optional[str] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=128)
    role: Optional[str] = "student"  # "student", "coordinator"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    student_id_number: Optional[str] = None
    phone: Optional[str] = None


class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=128)


class UserStatusUpdate(BaseModel):
    status: str  # "active" or "inactive"


class UserRoleUpdate(BaseModel):
    role: str  # "student", "coordinator", "admin"


class UserOut(UserBase):
    id: int
    role: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
