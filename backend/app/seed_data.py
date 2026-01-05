"""
Seed sample data for testing
Run this to populate the database with sample customers
"""
from app.database import SessionLocal
from app.models import Customer
from decimal import Decimal

def seed_sample_data():
    """Add sample customers to database"""
    db = SessionLocal()
    
    # Check if we already have customers
    existing = db.query(Customer).first()
    if existing:
        print("Database already contains data. Skipping seed.")
        db.close()
        return
    
    sample_customers = [
        {
            "taxpayer_id": "7080324",
            "address": "124 Main Street",
            "landlord_name": None,
            "payee_name": "John Smith",
            "monthly_amount": Decimal("150.00"),
            "current_card_token": "p58dc33be42d29d6571",
            "current_card_expiry": "830",
            "currency": 1,
            "tranmode": "A",
            "cred_type": 1
        },
        {
            "taxpayer_id": "7080314",
            "address": "114 Oak Avenue",
            "landlord_name": "Property Management Co",
            "payee_name": "Jane Doe",
            "monthly_amount": Decimal("450.00"),
            "current_card_token": "I33ef8f9cc0800c4446",
            "current_card_expiry": "1126",
            "currency": 1,
            "tranmode": "A",
            "cred_type": 1
        },
        {
            "taxpayer_id": "7000214",
            "address": "15 Elm Street",
            "landlord_name": None,
            "payee_name": "Bob Johnson",
            "monthly_amount": Decimal("150.00"),
            "current_card_token": "z25ed5a8a796bdf0692",
            "current_card_expiry": "1026",
            "currency": 1,
            "tranmode": "A",
            "cred_type": 1
        },
        {
            "taxpayer_id": "2000183",
            "address": "87 Pine Road",
            "landlord_name": None,
            "payee_name": "Sarah Williams",
            "monthly_amount": Decimal("150.00"),
            "current_card_token": "fb956a5da5decaf2259",
            "current_card_expiry": "730",
            "currency": 1,
            "tranmode": "A",
            "cred_type": 1
        },
        {
            "taxpayer_id": "2000160",
            "address": "42 Maple Drive",
            "landlord_name": None,
            "payee_name": "Michael Brown",
            "monthly_amount": Decimal("300.00"),
            "current_card_token": "m088419e1a3a1b99440",
            "current_card_expiry": "825",
            "currency": 1,
            "tranmode": "A",
            "cred_type": 1
        }
    ]
    
    try:
        for customer_data in sample_customers:
            customer = Customer(**customer_data)
            db.add(customer)
        
        db.commit()
        print(f"✓ Seeded {len(sample_customers)} sample customers")
        print("\nSample customers added:")
        for c in sample_customers:
            print(f"  - {c['payee_name']} (ID: {c['taxpayer_id']}) - ₪{c['monthly_amount']}/month")
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("Seeding sample data...")
    seed_sample_data()
    print("\n✓ Database seeding complete!")
    print("\nYou can now:")
    print("  1. View customers at http://localhost:5173/customers")
    print("  2. Generate a batch file at http://localhost:5173/batch")
    print("  3. View the dashboard at http://localhost:5173/")



