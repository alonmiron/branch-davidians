from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CommunityBase(BaseModel):
    name: str
    website_url: Optional[str] = None
    phone_number: Optional[str] = None
    active: bool = True
    section_people: bool = True
    section_places: bool = True
    section_community: bool = True
    section_payments: bool = True


class CommunityCreate(CommunityBase):
    pass


class CommunityUpdate(BaseModel):
    name: Optional[str] = None
    website_url: Optional[str] = None
    phone_number: Optional[str] = None
    active: Optional[bool] = None
    section_people: Optional[bool] = None
    section_places: Optional[bool] = None
    section_community: Optional[bool] = None
    section_payments: Optional[bool] = None


class CommunityResponse(CommunityBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
