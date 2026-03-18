from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Community(Base):
    __tablename__ = "communities"

    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String, unique=True, nullable=False)
    website_url  = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    active            = Column(Boolean, default=True, nullable=False)
    section_people    = Column(Boolean, default=True, nullable=False)
    section_places    = Column(Boolean, default=True, nullable=False)
    section_community = Column(Boolean, default=True, nullable=False)
    section_payments  = Column(Boolean, default=True, nullable=False)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())
