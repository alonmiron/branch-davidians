from sqlalchemy import Column, Integer, String, Numeric
from app.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    taxpayer_id = Column(String, unique=True, index=True, nullable=False)
    address = Column(String, nullable=False)
    landlord_name = Column(String)
    payee_name = Column(String, nullable=False)
    monthly_amount = Column(Numeric(10, 2), nullable=False)
    phone_number = Column(String, nullable=True)
    email = Column(String, nullable=True)
    payment_method = Column(String, default="credit")  # credit, cash, check
    current_card_token = Column(String, nullable=True)  # Nullable for non-credit customers
    current_card_expiry = Column(String, nullable=True)  # Format: MMYY, nullable for non-credit
    currency = Column(Integer, default=1)  # 1 for ILS
    tranmode = Column(String, default="A")  # A for authorization
    cred_type = Column(Integer, default=1)  # 1 for regular credit


