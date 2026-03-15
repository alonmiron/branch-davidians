from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database import Base


class CcCustomField(Base):
    """Optional extra key/value fields per resident for future column additions."""
    __tablename__ = "cc_custom_fields"

    id = Column(Integer, primary_key=True, index=True)
    resident_id = Column(Integer, ForeignKey("cc_residents.id"), nullable=False, index=True)
    field_name = Column(String, nullable=False)
    field_value = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
