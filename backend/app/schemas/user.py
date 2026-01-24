from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    role: str  # admin, payment_clerk
    phone_country: Optional[str] = None
    phone_number: Optional[str] = None

    @field_validator('role')
    @classmethod
    def validate_role(cls, v):
        if v not in ['admin', 'payment_clerk', 'mehamemet']:
            raise ValueError('role must be admin, payment_clerk, or mehamemet')
        return v

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    email: Optional[str] = None
    requires_password_reset: Optional[bool] = None
    phone_country: Optional[str] = None
    phone_number: Optional[str] = None

    @field_validator('role')
    @classmethod
    def validate_role(cls, v):
        if v is not None and v not in ['admin', 'payment_clerk', 'mehamemet']:
            raise ValueError('role must be admin, payment_clerk, or mehamemet')
        return v

class UserResponse(UserBase):
    id: int
    is_active: bool
    email_verified: bool
    requires_email_update: bool
    requires_password_reset: bool
    created_at: datetime

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class ForgotPasswordRequest(BaseModel):
    email: str


class VerifyResetCodeRequest(BaseModel):
    email: str
    code: str
    purpose: str = "password_reset"


class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UpdateEmailRequest(BaseModel):
    email: str


