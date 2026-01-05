from pydantic import BaseModel, Field, field_validator
from typing import Optional
from decimal import Decimal

class CustomerBase(BaseModel):
    taxpayer_id: str
    address: str
    landlord_name: Optional[str] = None
    payee_name: str
    monthly_amount: Decimal
    phone_number: Optional[str] = None
    email: Optional[str] = None
    payment_method: str = "credit"  # credit, cash, check
    current_card_token: Optional[str] = None
    current_card_expiry: Optional[str] = None  # Format: MMYY
    currency: int = 1
    tranmode: str = "A"
    cred_type: int = 1

    @field_validator('payment_method')
    @classmethod
    def validate_payment_method(cls, v):
        if v not in ['credit', 'cash', 'check']:
            raise ValueError('payment_method must be credit, cash, or check')
        return v

class CustomerCreate(CustomerBase):
    @field_validator('current_card_token', 'current_card_expiry')
    @classmethod
    def validate_card_fields(cls, v, info):
        payment_method = info.data.get('payment_method', 'credit')
        if payment_method == 'credit' and not v:
            raise ValueError(f'{info.field_name} is required for credit card customers')
        return v

class CustomerUpdate(BaseModel):
    taxpayer_id: Optional[str] = None
    address: Optional[str] = None
    landlord_name: Optional[str] = None
    payee_name: Optional[str] = None
    monthly_amount: Optional[Decimal] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    payment_method: Optional[str] = None
    current_card_token: Optional[str] = None
    current_card_expiry: Optional[str] = None
    currency: Optional[int] = None
    tranmode: Optional[str] = None
    cred_type: Optional[int] = None

    @field_validator('payment_method')
    @classmethod
    def validate_payment_method(cls, v):
        if v is not None and v not in ['credit', 'cash', 'check']:
            raise ValueError('payment_method must be credit, cash, or check')
        return v

class CustomerResponse(CustomerBase):
    id: int

    class Config:
        from_attributes = True



