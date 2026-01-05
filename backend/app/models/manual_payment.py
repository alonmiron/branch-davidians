from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class ManualPayment(Base):
    __tablename__ = "manual_payments"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    payment_type = Column(String, nullable=False)  # cash, check
    amount = Column(Numeric(10, 2), nullable=False)
    payment_date = Column(DateTime(timezone=True), nullable=False)
    check_number = Column(String, nullable=True)  # Required only for checks
    notes = Column(String, nullable=True)
    recorded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    customer = relationship("Customer", backref="manual_payments")
    recorded_by_user = relationship("User", backref="recorded_payments")


