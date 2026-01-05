from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.customer import Customer
from app.models.card_history import CardHistory
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse

router = APIRouter()

@router.get("", response_model=List[CustomerResponse])
def get_customers(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    """Get all customers"""
    customers = db.query(Customer).offset(skip).limit(limit).all()
    return customers

@router.get("/non-credit", response_model=List[CustomerResponse])
def get_non_credit_customers(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    """Get all non-credit customers (cash/check payers)"""
    customers = db.query(Customer).filter(
        Customer.payment_method.in_(["cash", "check"])
    ).offset(skip).limit(limit).all()
    return customers

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    """Get a specific customer"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.post("", response_model=CustomerResponse)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    """Create a new customer"""
    # Check if taxpayer_id already exists
    existing = db.query(Customer).filter(Customer.taxpayer_id == customer.taxpayer_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Customer with this taxpayer_id already exists")
    
    # Validate card fields for credit customers
    if customer.payment_method == "credit":
        if not customer.current_card_token or not customer.current_card_expiry:
            raise HTTPException(
                status_code=400, 
                detail="Card token and expiry are required for credit card customers"
            )
    
    db_customer = Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: int, customer_update: CustomerUpdate, db: Session = Depends(get_db)):
    """Update a customer"""
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_data = customer_update.model_dump(exclude_unset=True)
    
    # Validate card fields if payment method is being changed to credit
    if "payment_method" in update_data and update_data["payment_method"] == "credit":
        card_token = update_data.get("current_card_token", db_customer.current_card_token)
        card_expiry = update_data.get("current_card_expiry", db_customer.current_card_expiry)
        if not card_token or not card_expiry:
            raise HTTPException(
                status_code=400,
                detail="Card token and expiry are required for credit card customers"
            )
    
    # If card token is being updated, save the old one to history
    if "current_card_token" in update_data and update_data["current_card_token"] != db_customer.current_card_token:
        if db_customer.current_card_token:  # Only save if there was a previous token
            card_history = CardHistory(
                customer_id=customer_id,
                old_card_token=db_customer.current_card_token,
                old_card_expiry=db_customer.current_card_expiry,
                notes="Card updated"
            )
            db.add(card_history)
    
    for field, value in update_data.items():
        setattr(db_customer, field, value)
    
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    """Delete a customer"""
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db.delete(db_customer)
    db.commit()
    return {"message": "Customer deleted successfully"}



