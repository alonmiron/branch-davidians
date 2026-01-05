from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class CardHistory(Base):
    __tablename__ = "card_history"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    old_card_token = Column(String, nullable=False)
    old_card_expiry = Column(String, nullable=False)
    replaced_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(String)



