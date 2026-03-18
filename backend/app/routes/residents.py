"""
CRUD routes for community residents master list.
All queries are scoped by community_id resolved via get_community_id().
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.resident import Resident
from app.models.user import User
from app.schemas.resident_schemas import ResidentCreate, ResidentUpdate, ResidentResponse
from app.schemas.user import UserResponse
from app.services.auth_service import (
    require_residents_read,
    require_residents_write,
    require_residents_delete,
    require_role,
    get_community_id,
    get_password_hash,
)

ALLOWED_RESIDENT_USER_ROLES = [
    "payment_clerk", "mehamemet", "manager", "data_entry", "public",
    "community_data_administrator",
]

class CreateUserForResidentRequest(BaseModel):
    role: str
    password: str

router = APIRouter()


def _compute_full_name(first_name: str, family_name: str) -> str:
    return f"{first_name.strip()} {family_name.strip()}"


def _resolve_community(
    current_user: User,
    x_community_id: Optional[str] = None,
) -> Optional[int]:
    """Parse X-Community-Id header (string) and delegate to auth helper."""
    parsed = int(x_community_id) if x_community_id else None
    return get_community_id(current_user, parsed)


# ─── List ─────────────────────────────────────────────────────────────────────

@router.get("", response_model=List[ResidentResponse])
def list_residents(
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("full_name"),
    sort_dir: Optional[str] = Query("asc"),
    x_community_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_residents_read),
):
    community_id = _resolve_community(current_user, x_community_id)

    q = db.query(Resident)

    if community_id is not None:
        q = q.filter(Resident.community_id == community_id)

    if search:
        term = f"%{search.lower()}%"
        from sqlalchemy import func as sqlfunc
        q = q.filter(
            sqlfunc.lower(Resident.full_name).like(term)
            | sqlfunc.lower(Resident.street_name).like(term)
            | sqlfunc.lower(Resident.telephone).like(term)
            | sqlfunc.lower(Resident.email).like(term)
        )

    sort_field_map = {
        "full_name":   Resident.full_name,
        "street_name": Resident.street_name,
        "telephone":   Resident.telephone,
        "email":       Resident.email,
        "map_locator": Resident.map_locator,
        "family_name": Resident.family_name,
        "first_name":  Resident.first_name,
    }
    sort_col = sort_field_map.get(sort_by, Resident.full_name)
    if sort_dir == "desc":
        sort_col = sort_col.desc()
    q = q.order_by(sort_col)

    return q.all()


# ─── Get single ───────────────────────────────────────────────────────────────

@router.get("/{resident_id}", response_model=ResidentResponse)
def get_resident(
    resident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_residents_read),
):
    r = db.query(Resident).filter(Resident.id == resident_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Resident not found")
    return r


# ─── Create ───────────────────────────────────────────────────────────────────

@router.post("", response_model=ResidentResponse, status_code=201)
def create_resident(
    data: ResidentCreate,
    x_community_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_residents_write),
):
    community_id = _resolve_community(current_user, x_community_id)
    full_name = _compute_full_name(data.first_name, data.family_name)

    q = db.query(Resident).filter(Resident.full_name == full_name)
    if community_id is not None:
        q = q.filter(Resident.community_id == community_id)
    if q.first():
        raise HTTPException(status_code=409, detail=f"Resident '{full_name}' already exists")

    payload = data.model_dump()
    payload["full_name"] = full_name
    if community_id is not None:
        payload["community_id"] = community_id

    r = Resident(**payload)
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


# ─── Update ───────────────────────────────────────────────────────────────────

@router.put("/{resident_id}", response_model=ResidentResponse)
def update_resident(
    resident_id: int,
    data: ResidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_residents_write),
):
    r = db.query(Resident).filter(Resident.id == resident_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Resident not found")

    updates = data.model_dump(exclude_unset=True)

    new_first = updates.get("first_name", r.first_name)
    new_family = updates.get("family_name", r.family_name)
    new_full = _compute_full_name(new_first, new_family)

    if new_full != r.full_name:
        conflict = db.query(Resident).filter(
            Resident.full_name == new_full, Resident.id != resident_id
        ).first()
        if conflict:
            raise HTTPException(status_code=409, detail=f"Resident '{new_full}' already exists")
        updates["full_name"] = new_full

    for field, value in updates.items():
        setattr(r, field, value)

    db.commit()
    db.refresh(r)
    return r


# ─── Delete ───────────────────────────────────────────────────────────────────

@router.delete("/{resident_id}")
def delete_resident(
    resident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_residents_delete),
):
    r = db.query(Resident).filter(Resident.id == resident_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Resident not found")
    db.delete(r)
    db.commit()
    return {"message": "Resident deleted"}


# ─── Create platform user for a resident ──────────────────────────────────────

_require_admin_or_super = require_role(["admin", "super_admin"])


@router.post("/{resident_id}/create-user", response_model=UserResponse, status_code=201)
def create_user_for_resident(
    resident_id: int,
    data: CreateUserForResidentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin_or_super),
):
    """
    Create a platform login account for an existing resident.
    Only admin and super_admin may call this.
    The resident must have email and telephone filled in.
    """
    r = db.query(Resident).filter(Resident.id == resident_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Resident not found")

    if not r.email or not r.email.strip():
        raise HTTPException(status_code=422, detail="Resident must have an email address before creating a user account.")
    if not r.telephone or not r.telephone.strip():
        raise HTTPException(status_code=422, detail="Resident must have a phone number before creating a user account.")

    if data.role not in ALLOWED_RESIDENT_USER_ROLES:
        raise HTTPException(
            status_code=422,
            detail=f"Role must be one of: {', '.join(ALLOWED_RESIDENT_USER_ROLES)}"
        )
    if not data.password or len(data.password.strip()) < 6:
        raise HTTPException(status_code=422, detail="Temporary password must be at least 6 characters.")

    # Username derived from email (part before @), made unique if needed
    base_username = r.email.strip().split("@")[0].lower().replace(" ", "_")
    username = base_username
    suffix = 1
    while db.query(User).filter(User.username == username).first():
        username = f"{base_username}{suffix}"
        suffix += 1

    # Email must also be unique
    if db.query(User).filter(User.email == r.email.strip()).first():
        raise HTTPException(
            status_code=409,
            detail=f"A user account with email '{r.email}' already exists."
        )

    new_user = User(
        username=username,
        email=r.email.strip(),
        hashed_password=get_password_hash(data.password),
        full_name=r.full_name,
        role=data.role,
        community_id=r.community_id,
        is_active=True,
        email_verified=True,
        requires_email_update=False,
        requires_password_reset=True,  # Force password change on first login
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
