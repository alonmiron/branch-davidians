from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime, date
from app.database import get_db
from app.models.manual_payment import ManualPayment
from app.models.customer import Customer
from app.models.user import User
from app.schemas.manual_payment import ManualPaymentCreate, ManualPaymentUpdate, ManualPaymentResponse
from app.services.auth_service import get_current_user, require_admin

router = APIRouter()

@router.post("", response_model=ManualPaymentResponse)
def create_manual_payment(
    payment: ManualPaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record a new manual payment"""
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == payment.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Create payment record
    db_payment = ManualPayment(
        customer_id=payment.customer_id,
        payment_type=payment.payment_type,
        amount=payment.amount,
        payment_date=payment.payment_date,
        check_number=payment.check_number,
        notes=payment.notes,
        recorded_by=current_user.id
    )
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    
    # Add customer and user names to response
    response = ManualPaymentResponse.model_validate(db_payment)
    response.customer_name = customer.payee_name
    response.recorded_by_name = current_user.full_name
    return response

@router.get("", response_model=List[ManualPaymentResponse])
def get_manual_payments(
    skip: int = 0,
    limit: int = 100,
    customer_id: Optional[int] = None,
    payment_type: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all manual payments with optional filters"""
    query = db.query(ManualPayment)
    
    # Apply filters
    if customer_id:
        query = query.filter(ManualPayment.customer_id == customer_id)
    if payment_type:
        query = query.filter(ManualPayment.payment_type == payment_type)
    if start_date:
        query = query.filter(ManualPayment.payment_date >= start_date)
    if end_date:
        # Add one day to include the end date
        end_datetime = datetime.combine(end_date, datetime.max.time())
        query = query.filter(ManualPayment.payment_date <= end_datetime)
    
    payments = query.order_by(ManualPayment.payment_date.desc()).offset(skip).limit(limit).all()
    
    # Enrich with customer and user names
    result = []
    for payment in payments:
        response = ManualPaymentResponse.model_validate(payment)
        response.customer_name = payment.customer.payee_name if payment.customer else None
        response.recorded_by_name = payment.recorded_by_user.full_name if payment.recorded_by_user else None
        result.append(response)
    
    return result

@router.get("/{payment_id}", response_model=ManualPaymentResponse)
def get_manual_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific manual payment"""
    payment = db.query(ManualPayment).filter(ManualPayment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    response = ManualPaymentResponse.model_validate(payment)
    response.customer_name = payment.customer.payee_name if payment.customer else None
    response.recorded_by_name = payment.recorded_by_user.full_name if payment.recorded_by_user else None
    return response

@router.get("/customer/{customer_id}", response_model=List[ManualPaymentResponse])
def get_customer_payments(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all payments for a specific customer"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    payments = db.query(ManualPayment).filter(
        ManualPayment.customer_id == customer_id
    ).order_by(ManualPayment.payment_date.desc()).all()
    
    result = []
    for payment in payments:
        response = ManualPaymentResponse.model_validate(payment)
        response.customer_name = customer.payee_name
        response.recorded_by_name = payment.recorded_by_user.full_name if payment.recorded_by_user else None
        result.append(response)
    
    return result

@router.put("/{payment_id}", response_model=ManualPaymentResponse)
def update_manual_payment(
    payment_id: int,
    payment_update: ManualPaymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update a manual payment (admin only)"""
    db_payment = db.query(ManualPayment).filter(ManualPayment.id == payment_id).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    update_data = payment_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_payment, field, value)
    
    db.commit()
    db.refresh(db_payment)
    
    response = ManualPaymentResponse.model_validate(db_payment)
    response.customer_name = db_payment.customer.payee_name if db_payment.customer else None
    response.recorded_by_name = db_payment.recorded_by_user.full_name if db_payment.recorded_by_user else None
    return response

@router.delete("/{payment_id}")
def delete_manual_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a manual payment (admin only)"""
    db_payment = db.query(ManualPayment).filter(ManualPayment.id == payment_id).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    db.delete(db_payment)
    db.commit()
    return {"message": "Payment deleted successfully"}


