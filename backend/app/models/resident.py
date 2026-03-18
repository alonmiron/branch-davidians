from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Resident(Base):
    """Master list of Hogla community residents."""
    __tablename__ = "residents"

    id = Column(Integer, primary_key=True, index=True)

    # Identity
    first_name = Column(String, nullable=False)
    family_name = Column(String, nullable=False)
    full_name = Column(String, nullable=False, unique=True, index=True)

    # Address
    street_name = Column(String, nullable=True)
    house_address_number = Column(String, nullable=True)

    # Community
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=True)

    # Personal
    date_of_birth = Column(Date, nullable=True)

    # Contact
    map_locator = Column(String, nullable=True)
    telephone = Column(String, nullable=True)
    email = Column(String, nullable=True)

    # Status flags
    taxpayer = Column(Boolean, default=False, nullable=False)
    landlord = Column(Boolean, default=False, nullable=False)
    tenant = Column(Boolean, default=False, nullable=False)
    senior_citizen = Column(Boolean, default=False, nullable=False)
    armed_forces = Column(Boolean, default=False, nullable=False)
    active_miluim = Column(Boolean, default=False, nullable=False)
    armed = Column(Boolean, default=False, nullable=False)
    tzahi = Column(Boolean, default=False, nullable=False)
    medical_personal_team = Column(Boolean, default=False, nullable=False)

    # Tenancy
    landlord_id = Column(Integer, ForeignKey("residents.id"), nullable=True)

    # Family
    child_of_parent_id  = Column(Integer, ForeignKey("residents.id"), nullable=True)
    child_of_parent2_id = Column(Integer, ForeignKey("residents.id"), nullable=True)

    # Other
    konenut = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Self-referential relationships
    landlord_resident = relationship("Resident", remote_side=[id], foreign_keys=[landlord_id])
    parent  = relationship("Resident", remote_side=[id], foreign_keys=[child_of_parent_id])
    parent2 = relationship("Resident", remote_side=[id], foreign_keys=[child_of_parent2_id])
