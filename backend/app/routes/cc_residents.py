"""
CRUD routes for Hogla credit-card residents and their custom fields.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.cc_resident import CcResident
from app.models.cc_custom_field import CcCustomField
from app.schemas.cc_schemas import (
    CcResidentCreate, CcResidentUpdate, CcResidentResponse,
    CcCustomFieldCreate, CcCustomFieldUpdate, CcCustomFieldResponse,
)

router = APIRouter()


# ─── Residents ────────────────────────────────────────────────────────────────

@router.get("", response_model=List[CcResidentResponse])
def list_residents(db: Session = Depends(get_db)):
    return db.query(CcResident).order_by(CcResident.sort_order, CcResident.id).all()


@router.get("/{resident_id}", response_model=CcResidentResponse)
def get_resident(resident_id: int, db: Session = Depends(get_db)):
    r = db.query(CcResident).filter(CcResident.id == resident_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Resident not found")
    return r


@router.post("", response_model=CcResidentResponse)
def create_resident(data: CcResidentCreate, db: Session = Depends(get_db)):
    r = CcResident(**data.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@router.put("/{resident_id}", response_model=CcResidentResponse)
def update_resident(resident_id: int, data: CcResidentUpdate, db: Session = Depends(get_db)):
    r = db.query(CcResident).filter(CcResident.id == resident_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Resident not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(r, field, value)
    db.commit()
    db.refresh(r)
    return r


@router.delete("/{resident_id}")
def delete_resident(resident_id: int, db: Session = Depends(get_db)):
    r = db.query(CcResident).filter(CcResident.id == resident_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Resident not found")
    db.delete(r)
    db.commit()
    return {"message": "Resident deleted"}


# ─── Custom fields ────────────────────────────────────────────────────────────

@router.get("/{resident_id}/custom-fields", response_model=List[CcCustomFieldResponse])
def list_custom_fields(resident_id: int, db: Session = Depends(get_db)):
    return db.query(CcCustomField).filter(CcCustomField.resident_id == resident_id).all()


@router.post("/{resident_id}/custom-fields", response_model=CcCustomFieldResponse)
def create_custom_field(
    resident_id: int,
    data: CcCustomFieldCreate,
    db: Session = Depends(get_db),
):
    cf = CcCustomField(resident_id=resident_id, field_name=data.field_name, field_value=data.field_value)
    db.add(cf)
    db.commit()
    db.refresh(cf)
    return cf


@router.put("/custom-fields/{field_id}", response_model=CcCustomFieldResponse)
def update_custom_field(
    field_id: int,
    data: CcCustomFieldUpdate,
    db: Session = Depends(get_db),
):
    cf = db.query(CcCustomField).filter(CcCustomField.id == field_id).first()
    if not cf:
        raise HTTPException(status_code=404, detail="Custom field not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(cf, field, value)
    db.commit()
    db.refresh(cf)
    return cf


@router.delete("/custom-fields/{field_id}")
def delete_custom_field(field_id: int, db: Session = Depends(get_db)):
    cf = db.query(CcCustomField).filter(CcCustomField.id == field_id).first()
    if not cf:
        raise HTTPException(status_code=404, detail="Custom field not found")
    db.delete(cf)
    db.commit()
    return {"message": "Custom field deleted"}
