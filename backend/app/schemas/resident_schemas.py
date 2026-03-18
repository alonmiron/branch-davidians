from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


class ResidentBase(BaseModel):
    first_name: str
    family_name: str
    date_of_birth: Optional[date] = None
    street_name: Optional[str] = None
    house_address_number: Optional[str] = None
    map_locator: Optional[str] = None
    telephone: Optional[str] = None
    email: Optional[str] = None
    taxpayer: bool = False
    landlord: bool = False
    tenant: bool = False
    senior_citizen: bool = False
    armed_forces: bool = False
    active_miluim: bool = False
    armed: bool = False
    tzahi: bool = False
    medical_personal_team: bool = False
    landlord_id: Optional[int] = None
    child_of_parent_id: Optional[int] = None
    child_of_parent2_id: Optional[int] = None
    konenut: Optional[str] = None


class ResidentCreate(ResidentBase):
    pass


class ResidentUpdate(BaseModel):
    first_name: Optional[str] = None
    family_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    street_name: Optional[str] = None
    house_address_number: Optional[str] = None
    map_locator: Optional[str] = None
    telephone: Optional[str] = None
    email: Optional[str] = None
    taxpayer: Optional[bool] = None
    landlord: Optional[bool] = None
    tenant: Optional[bool] = None
    senior_citizen: Optional[bool] = None
    armed_forces: Optional[bool] = None
    active_miluim: Optional[bool] = None
    armed: Optional[bool] = None
    tzahi: Optional[bool] = None
    medical_personal_team: Optional[bool] = None
    landlord_id: Optional[int] = None
    child_of_parent_id: Optional[int] = None
    child_of_parent2_id: Optional[int] = None
    konenut: Optional[str] = None


class ResidentRefInfo(BaseModel):
    id: int
    full_name: str

    class Config:
        from_attributes = True


class ResidentResponse(ResidentBase):
    id: int
    full_name: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    landlord_resident: Optional[ResidentRefInfo] = None
    parent: Optional[ResidentRefInfo] = None
    parent2: Optional[ResidentRefInfo] = None

    class Config:
        from_attributes = True
