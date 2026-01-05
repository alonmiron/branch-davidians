from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base

class BatchFile(Base):
    __tablename__ = "batch_files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # 'batch' or 'result'
    file_content = Column(Text)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    processed = Column(Integer, default=0)  # 0 = not processed, 1 = processed
    notes = Column(String)



