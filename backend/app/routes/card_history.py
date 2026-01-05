from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.card_history import CardHistory
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class CardHistoryResponse(BaseModel):
    id: int
    customer_id: int
    old_card_token: str
    old_card_expiry: str
    replaced_at: datetime
    notes: str | None

    class Config:
        from_attributes = True

@router.get("/{customer_id}", response_model=List[CardHistoryResponse])
def get_card_history(customer_id: int, db: Session = Depends(get_db)):
    """Get card history for a customer"""
    history = db.query(CardHistory).filter(
        CardHistory.customer_id == customer_id
    ).order_by(CardHistory.replaced_at.desc()).all()
    return history



