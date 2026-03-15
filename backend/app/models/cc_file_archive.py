from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class CcFileArchive(Base):
    """Legal archive of every exported batch file and imported result file."""
    __tablename__ = "cc_file_archives"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    # 'batch_export' | 'result_import'
    file_type = Column(String, nullable=False)
    # Absolute server path where the file is stored on disk
    file_path = Column(String, nullable=True)
    # Content also persisted in DB as backup
    file_content = Column(Text, nullable=True)
    month = Column(Integer, nullable=True)
    year = Column(Integer, nullable=True)
    record_count = Column(Integer, nullable=True)
    processed = Column(Boolean, default=False)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
