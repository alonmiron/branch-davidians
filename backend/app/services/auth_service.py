from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import get_db
from app.models.user import User

# Security configuration
SECRET_KEY = "your-secret-key-change-in-production"  # TODO: Move to environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: Optional[str]) -> bool:
    """Verify a password against its hash. Returns False if hash is missing/invalid."""
    if not plain_password or not hashed_password or not hashed_password.strip():
        return False
    try:
        if isinstance(hashed_password, str):
            hashed_bytes = hashed_password.encode("utf-8")
        else:
            return False
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_bytes)
    except (ValueError, TypeError, Exception):
        return False

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate a user by username and password"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    return user

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

def require_role(allowed_roles: list[str]):
    """Dependency to require specific roles"""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role '{current_user.role}' not authorized for this operation"
            )
        return current_user
    return role_checker

# Common role dependencies
require_admin = require_role(["admin"])
require_super_admin = require_role(["super_admin"])
require_auth = get_current_user  # Any authenticated user


def get_community_id(
    current_user: User,
    x_community_id: Optional[int] = None,
) -> Optional[int]:
    """
    Resolve which community_id to scope a query to.
    - super_admin: can pass X-Community-Id to view any community's data; without it sees all.
    - All other roles: always scoped to their own community_id.
    """
    if current_user.role == "super_admin":
        return x_community_id  # None = unscoped (all communities)
    return current_user.community_id

# ─── Residents permission helpers ────────────────────────────────────────────

# Roles that can read resident data
RESIDENTS_READ_ROLES = [
    "admin", "manager", "data_entry", "public", "payment_clerk", "mehamemet",
    "community_data_administrator",
]
# Roles that can create/edit residents
RESIDENTS_WRITE_ROLES = [
    "admin", "manager", "data_entry", "payment_clerk", "mehamemet",
    "community_data_administrator",
]
# Roles that can delete residents
RESIDENTS_DELETE_ROLES = ["admin"]

def can_read_residents(user: User) -> bool:
    return user.role in RESIDENTS_READ_ROLES

def can_write_residents(user: User) -> bool:
    return user.role in RESIDENTS_WRITE_ROLES

def can_delete_residents(user: User) -> bool:
    return user.role in RESIDENTS_DELETE_ROLES

require_residents_read = require_role(RESIDENTS_READ_ROLES)
require_residents_write = require_role(RESIDENTS_WRITE_ROLES)
require_residents_delete = require_role(RESIDENTS_DELETE_ROLES)

