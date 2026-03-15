from pydantic import BaseModel, field_validator
from typing import Optional, List, Dict, Any
from decimal import Decimal


# ─── Helpers ─────────────────────────────────────────────────────────────────

def normalize_expiry(value: Optional[str]) -> Optional[str]:
    """Pad a 3-digit expiry to 4 digits by prepending '0'."""
    if value is None:
        return None
    v = str(value).strip()
    if len(v) == 3:
        v = "0" + v
    return v if len(v) == 4 else v


# ─── CcResident ──────────────────────────────────────────────────────────────

class CcResidentBase(BaseModel):
    taxpayer_id: Optional[str] = None
    house: Optional[str] = None
    landlord: Optional[str] = None
    tenant: str
    monthly_amount: Decimal = Decimal("0")
    card_expiry: Optional[str] = None
    card_token: Optional[str] = None
    current_debt: Decimal = Decimal("0")
    active: bool = True
    sort_order: int = 0
    notes: Optional[str] = None

    @field_validator("card_expiry", mode="before")
    @classmethod
    def _pad_expiry(cls, v):
        return normalize_expiry(v)


class CcResidentCreate(CcResidentBase):
    pass


class CcResidentUpdate(BaseModel):
    taxpayer_id: Optional[str] = None
    house: Optional[str] = None
    landlord: Optional[str] = None
    tenant: Optional[str] = None
    monthly_amount: Optional[Decimal] = None
    card_expiry: Optional[str] = None
    card_token: Optional[str] = None
    current_debt: Optional[Decimal] = None
    active: Optional[bool] = None
    sort_order: Optional[int] = None
    notes: Optional[str] = None

    @field_validator("card_expiry", mode="before")
    @classmethod
    def _pad_expiry(cls, v):
        return normalize_expiry(v)


class CcResidentResponse(CcResidentBase):
    id: int

    class Config:
        from_attributes = True


# ─── CcCustomField ────────────────────────────────────────────────────────────

class CcCustomFieldCreate(BaseModel):
    resident_id: int
    field_name: str
    field_value: Optional[str] = None


class CcCustomFieldUpdate(BaseModel):
    field_name: Optional[str] = None
    field_value: Optional[str] = None


class CcCustomFieldResponse(BaseModel):
    id: int
    resident_id: int
    field_name: str
    field_value: Optional[str] = None

    class Config:
        from_attributes = True


# ─── CcMonthlyEntry ───────────────────────────────────────────────────────────

class CcMonthlyEntryCreate(BaseModel):
    resident_id: int
    year: int
    month: int
    expected_amount: Decimal
    attempted_amount: Optional[Decimal] = None
    actual_amount: Optional[Decimal] = None
    status: str = "pending"
    accumulates_debt: bool = True
    notes: Optional[str] = None


class CcMonthlyEntryUpdate(BaseModel):
    expected_amount: Optional[Decimal] = None
    attempted_amount: Optional[Decimal] = None
    actual_amount: Optional[Decimal] = None
    status: Optional[str] = None
    accumulates_debt: Optional[bool] = None
    response_code: Optional[str] = None
    confirmation_code: Optional[str] = None
    index_number: Optional[str] = None
    notes: Optional[str] = None


class CcMonthlyEntryResponse(BaseModel):
    id: int
    resident_id: int
    year: int
    month: int
    expected_amount: Decimal
    attempted_amount: Optional[Decimal] = None
    actual_amount: Optional[Decimal] = None
    status: str
    accumulates_debt: bool
    response_code: Optional[str] = None
    confirmation_code: Optional[str] = None
    index_number: Optional[str] = None
    batch_file_id: Optional[int] = None
    result_file_id: Optional[int] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# ─── CcFileArchive ────────────────────────────────────────────────────────────

class CcFileArchiveResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    file_path: Optional[str] = None
    month: Optional[int] = None
    year: Optional[int] = None
    record_count: Optional[int] = None
    processed: bool
    notes: Optional[str] = None
    created_at: Any = None

    class Config:
        from_attributes = True


# ─── Overview (composite response for the payment grid) ───────────────────────

class MonthCellData(BaseModel):
    entry_id: Optional[int] = None
    status: Optional[str] = None
    expected_amount: Optional[Decimal] = None
    attempted_amount: Optional[Decimal] = None
    actual_amount: Optional[Decimal] = None
    response_code: Optional[str] = None
    notes: Optional[str] = None


class CcResidentOverviewRow(BaseModel):
    resident: CcResidentResponse
    months: Dict[int, MonthCellData]   # key = month number 1-12
    annual_expected: Decimal
    annual_collected: Decimal
    custom_fields: List[CcCustomFieldResponse] = []


class CcOverviewResponse(BaseModel):
    year: int
    rows: List[CcResidentOverviewRow]


# ─── Batch / Upload responses ─────────────────────────────────────────────────

class CcUploadResultResponse(BaseModel):
    total_processed: int
    successful: int
    failed: int
    zero: int
    errors: List[str]
    archive_id: Optional[int] = None


class CcGenerateBatchRequest(BaseModel):
    year: int
    month: int
    include_debt: bool = True
