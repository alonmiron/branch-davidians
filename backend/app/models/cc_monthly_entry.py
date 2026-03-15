import enum
from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.database import Base


class CcEntryStatus(str, enum.Enum):
    PENDING = "pending"       # In batch file, result not yet received
    SUCCESS = "success"       # Response 0 – payment collected
    FAILED = "failed"         # Response 1/2/3/4 – payment failed, debt increases
    ZERO = "zero"             # Response 20014 – amount was 0, no debt
    PREPAID = "prepaid"       # Manual: resident paid up front (credit)
    MANUAL = "manual"         # Any other manual adjustment


class CcMonthlyEntry(Base):
    """One ledger entry per resident per month per year."""
    __tablename__ = "cc_monthly_entries"

    id = Column(Integer, primary_key=True, index=True)
    resident_id = Column(Integer, ForeignKey("cc_residents.id"), nullable=False, index=True)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)  # 1-12

    # Amount fields
    expected_amount = Column(Numeric(10, 2), nullable=False, default=0)
    # Amount actually sent in the batch CSV (may include prior debt)
    attempted_amount = Column(Numeric(10, 2), nullable=True)
    # Amount confirmed collected (from result file)
    actual_amount = Column(Numeric(10, 2), nullable=True)

    status = Column(String, default=CcEntryStatus.PENDING)

    # Whether this entry's failure should accumulate debt
    accumulates_debt = Column(Boolean, default=True)

    # Result file fields
    response_code = Column(String, nullable=True)
    confirmation_code = Column(String, nullable=True)
    index_number = Column(String, nullable=True)

    # Links to archive file records
    batch_file_id = Column(Integer, ForeignKey("cc_file_archives.id"), nullable=True)
    result_file_id = Column(Integer, ForeignKey("cc_file_archives.id"), nullable=True)

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
