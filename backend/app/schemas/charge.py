from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from datetime import datetime

class ChargeResponse(BaseModel):
    id: int
    customer_id: int
    month: int
    year: int
    status: str
    amount: Decimal
    error_code: Optional[str] = None
    response_code: Optional[int] = None
    confirmation_code: Optional[str] = None
    index_number: Optional[str] = None
    notes: Optional[str] = None
    contacted: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BatchGenerateRequest(BaseModel):
    year: int
    month: int
    customer_ids: Optional[List[int]] = None  # If None, generate for all customers

class UploadResultResponse(BaseModel):
    total_processed: int
    successful: int
    failed: int
    errors: List[str] = []

class ChargeUpdateNotes(BaseModel):
    notes: str
    contacted: Optional[int] = None



