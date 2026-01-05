from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.error_code import ErrorCode
from app.schemas.error_code import ErrorCodeResponse

router = APIRouter()

@router.get("", response_model=List[ErrorCodeResponse])
def get_error_codes(db: Session = Depends(get_db)):
    """Get all error codes"""
    error_codes = db.query(ErrorCode).all()
    return error_codes



