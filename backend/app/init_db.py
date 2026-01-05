"""
Database initialization script
Run this to create tables and seed initial data
"""
from app.database import engine, Base, SessionLocal
from app.models import Customer, ErrorCode, MonthlyCharge

def init_error_codes(db):
    """Seed error codes table with common response codes"""
    error_codes = [
        {"response_code": "0", "description": "Success - Transaction approved"},
        {"response_code": "2", "description": "Card declined by issuer"},
        {"response_code": "4", "description": "Card expired or invalid expiration date"},
        {"response_code": "15", "description": "Invalid card number"},
        {"response_code": "20014", "description": "Invalid token or card not found"},
        {"response_code": "33", "description": "Stolen card"},
        {"response_code": "34", "description": "Fraud suspicion"},
        {"response_code": "36", "description": "Card restricted"},
        {"response_code": "39", "description": "No credit account"},
        {"response_code": "41", "description": "Lost card"},
        {"response_code": "43", "description": "Card blocked"},
        {"response_code": "51", "description": "Insufficient funds"},
        {"response_code": "54", "description": "Card expired"},
        {"response_code": "55", "description": "Incorrect PIN"},
        {"response_code": "57", "description": "Transaction not permitted to cardholder"},
        {"response_code": "58", "description": "Transaction not permitted to terminal"},
        {"response_code": "61", "description": "Exceeds withdrawal amount limit"},
        {"response_code": "62", "description": "Restricted card"},
        {"response_code": "63", "description": "Security violation"},
        {"response_code": "65", "description": "Exceeds withdrawal frequency limit"},
        {"response_code": "75", "description": "PIN tries exceeded"},
        {"response_code": "76", "description": "Invalid transaction"},
        {"response_code": "77", "description": "Reconciliation error"},
        {"response_code": "78", "description": "Invalid card status"},
        {"response_code": "79", "description": "Credit card number does not match method of payment"},
        {"response_code": "80", "description": "Duplicate transaction"},
        {"response_code": "96", "description": "System malfunction"},
    ]
    
    existing_codes = db.query(ErrorCode).all()
    if not existing_codes:
        for code_data in error_codes:
            error_code = ErrorCode(**code_data)
            db.add(error_code)
        db.commit()
        print(f"✓ Seeded {len(error_codes)} error codes")
    else:
        print("✓ Error codes already exist")

def init_db():
    """Initialize database with tables and seed data"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created")
    
    db = SessionLocal()
    try:
        print("\nSeeding error codes...")
        init_error_codes(db)
        print("\n✓ Database initialization complete!")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()



