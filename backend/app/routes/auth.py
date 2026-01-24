from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    LoginRequest,
    Token,
    ForgotPasswordRequest,
    VerifyResetCodeRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    UpdateEmailRequest,
)
from app.services.auth_service import (
    authenticate_user,
    create_access_token,
    get_password_hash,
    get_current_user,
    require_admin,
    verify_password,
)
from app.services.email_service import send_verification_code
from app.services.password_reset_service import create_reset_code, verify_reset_code
from datetime import timedelta

router = APIRouter()

@router.post("/login", response_model=Token)
def login(login_request: LoginRequest, db: Session = Depends(get_db)):
    """Login and get JWT token"""
    user = authenticate_user(db, login_request.username, login_request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(hours=24)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/register", response_model=UserResponse)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Register a new user (admin only)"""
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )
    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role,
        is_active=True,
        email_verified=True,
        requires_email_update=False,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List all users (admin only)"""
    users = db.query(User).all()
    return users

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update a user (admin only)"""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_update.model_dump(exclude_unset=True)
    
    # Hash password if provided
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    if "email" in update_data:
        existing_email = (
            db.query(User)
            .filter(User.email == update_data["email"], User.id != db_user.id)
            .first()
        )
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a user (admin only)"""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(db_user)
    db.commit()
    return {"message": "User deleted successfully"}


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Send a password reset OTP to the user's email"""
    user = db.query(User).filter(User.email == payload.email).first()
    if user and user.is_active:
        code = create_reset_code(db, user, "password_reset")
        try:
            send_verification_code(user.email, code, "password_reset")
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"message": "If the email exists, a code has been sent."}


@router.post("/verify-reset-code")
def verify_reset_code_endpoint(payload: VerifyResetCodeRequest, db: Session = Depends(get_db)):
    """Verify a reset or email verification code"""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid code")

    consume = payload.purpose == "email_verify"
    is_valid = verify_reset_code(
        db,
        user,
        payload.code,
        payload.purpose,
        consume=consume,
    )
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    if payload.purpose == "email_verify":
        user.email_verified = True
        user.requires_email_update = False
        db.commit()
    return {"message": "Code verified"}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password after OTP verification"""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid code")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    is_valid = verify_reset_code(
        db,
        user,
        payload.code,
        "password_reset",
        consume=True,
    )
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password has been reset"}


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change password for the current user"""
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password updated"}


@router.post("/update-email")
def update_email(
    payload: UpdateEmailRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update email for the current user and send verification code"""
    existing_email = db.query(User).filter(User.email == payload.email).first()
    if existing_email and existing_email.id != current_user.id:
        raise HTTPException(status_code=400, detail="Email already registered")

    current_user.email = payload.email
    current_user.email_verified = False
    current_user.requires_email_update = False
    db.commit()

    code = create_reset_code(db, current_user, "email_verify")
    try:
        send_verification_code(current_user.email, code, "email_verify")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"message": "Verification code sent"}


