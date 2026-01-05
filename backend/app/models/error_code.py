from sqlalchemy import Column, Integer, String
from app.database import Base

class ErrorCode(Base):
    __tablename__ = "error_codes"

    id = Column(Integer, primary_key=True, index=True)
    response_code = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=False)



