from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
import enum
from app.database import Base

class ChargeStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"

class MonthlyCharge(Base):
    __tablename__ = "monthly_charges"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    month = Column(Integer, nullable=False)  # 1-12
    year = Column(Integer, nullable=False)
    status = Column(Enum(ChargeStatus), default=ChargeStatus.PENDING)
    amount = Column(Numeric(10, 2), nullable=False)
    error_code = Column(String)
    response_code = Column(Integer)
    confirmation_code = Column(String)
    index_number = Column(String)
    notes = Column(String)
    contacted = Column(Integer, default=0)  # 0 = not contacted, 1 = contacted
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())



