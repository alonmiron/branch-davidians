from pydantic import BaseModel, field_validator
from typing import Optional
from decimal import Decimal
from datetime import datetime

class ManualPaymentBase(BaseModel):
    customer_id: int
    payment_type: str  # cash, check
    amount: Decimal
    payment_date: datetime
    check_number: Optional[str] = None
    notes: Optional[str] = None

    @field_validator('payment_type')
    @classmethod
    def validate_payment_type(cls, v):
        if v not in ['cash', 'check']:
            raise ValueError('payment_type must be cash or check')
        return v

    @field_validator('check_number')
    @classmethod
    def validate_check_number(cls, v, info):
        payment_type = info.data.get('payment_type')
        if payment_type == 'check' and not v:
            raise ValueError('check_number is required for check payments')
        return v

class ManualPaymentCreate(ManualPaymentBase):
    pass

class ManualPaymentUpdate(BaseModel):
    payment_type: Optional[str] = None
    amount: Optional[Decimal] = None
    payment_date: Optional[datetime] = None
    check_number: Optional[str] = None
    notes: Optional[str] = None

    @field_validator('payment_type')
    @classmethod
    def validate_payment_type(cls, v):
        if v is not None and v not in ['cash', 'check']:
            raise ValueError('payment_type must be cash or check')
        return v

class ManualPaymentResponse(ManualPaymentBase):
    id: int
    recorded_by: int
    created_at: datetime
    customer_name: Optional[str] = None
    recorded_by_name: Optional[str] = None

    class Config:
        from_attributes = True


