"""
CRUD routes for communities — super_admin only, plus /current for any authenticated user.
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.community import Community
from app.models.user import User
from app.schemas.community_schemas import CommunityCreate, CommunityUpdate, CommunityResponse
from app.services.auth_service import require_super_admin, get_current_user, get_community_id

router = APIRouter()


@router.get("/current", response_model=CommunityResponse)
def get_current_community(
    x_community_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return the community currently in context for this user.
    - super_admin: uses X-Community-Id header (set by frontend when accessing a community).
    - All other roles: scoped to their own community_id.
    Returns 404 if no community is in context.
    """
    parsed = int(x_community_id) if x_community_id else None
    community_id = get_community_id(current_user, parsed)
    if not community_id:
        raise HTTPException(status_code=404, detail="No active community context")
    c = db.query(Community).filter(Community.id == community_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Community not found")
    return c


@router.get("", response_model=List[CommunityResponse])
def list_communities(
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    return db.query(Community).order_by(Community.name).all()


@router.get("/{community_id}", response_model=CommunityResponse)
def get_community(
    community_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    c = db.query(Community).filter(Community.id == community_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Community not found")
    return c


@router.post("", response_model=CommunityResponse, status_code=201)
def create_community(
    data: CommunityCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    existing = db.query(Community).filter(Community.name == data.name).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Community '{data.name}' already exists")
    c = Community(**data.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.put("/{community_id}", response_model=CommunityResponse)
def update_community(
    community_id: int,
    data: CommunityUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    c = db.query(Community).filter(Community.id == community_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Community not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(c, field, value)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{community_id}")
def delete_community(
    community_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    c = db.query(Community).filter(Community.id == community_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Community not found")
    db.delete(c)
    db.commit()
    return {"message": "Community deleted"}
