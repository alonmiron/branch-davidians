from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class CcResident(Base):
    """A Hogla resident who pays community tax by credit card."""
    __tablename__ = "cc_residents"

    id = Column(Integer, primary_key=True, index=True)
    taxpayer_id = Column(String, nullable=True, index=True)
    house = Column(String, nullable=True)
    landlord = Column(String, nullable=True)
    tenant = Column(String, nullable=False, index=True)
    monthly_amount = Column(Numeric(10, 2), nullable=False, default=0)
    # Stored as 4-char MMYY, e.g. "0830" for August 2030
    card_expiry = Column(String(4), nullable=True)
    card_token = Column(String, nullable=True)
    # Running debt balance; updated when charges succeed or fail
    current_debt = Column(Numeric(10, 2), nullable=False, default=0)
    active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
