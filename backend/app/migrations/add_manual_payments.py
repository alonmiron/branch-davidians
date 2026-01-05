"""
Migration script to add manual payment features to the database.

This script:
1. Adds new columns to the customers table (phone_number, email, payment_method)
2. Makes card fields nullable
3. Creates the users table
4. Creates the manual_payments table
5. Creates a default admin user

Run this script once to migrate your existing database.
"""
import sqlite3
import os
import bcrypt

def get_database_path():
    """Get the path to the billing.db database"""
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    return os.path.join(backend_dir, "billing.db")

def migrate_database():
    """Run all migration steps"""
    db_path = get_database_path()
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        print("The database will be created automatically when you run the application.")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("Starting database migration...")
    
    try:
        # Step 1: Add new columns to customers table
        print("1. Adding new columns to customers table...")
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(customers)")
        existing_columns = [col[1] for col in cursor.fetchall()]
        
        if 'phone_number' not in existing_columns:
            cursor.execute("ALTER TABLE customers ADD COLUMN phone_number TEXT")
            print("   - Added phone_number column")
        
        if 'email' not in existing_columns:
            cursor.execute("ALTER TABLE customers ADD COLUMN email TEXT")
            print("   - Added email column")
        
        if 'payment_method' not in existing_columns:
            cursor.execute("ALTER TABLE customers ADD COLUMN payment_method TEXT DEFAULT 'credit'")
            print("   - Added payment_method column")
            # Set default for existing customers
            cursor.execute("UPDATE customers SET payment_method = 'credit' WHERE payment_method IS NULL")
        
        # Note: SQLite doesn't support ALTER COLUMN to make fields nullable
        # Existing card fields will remain as-is, but the model allows None
        
        conn.commit()
        
        # Step 2: Create users table
        print("2. Creating users table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                hashed_password TEXT NOT NULL,
                full_name TEXT NOT NULL,
                role TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)")
        print("   - Users table created")
        conn.commit()
        
        # Step 3: Create manual_payments table
        print("3. Creating manual_payments table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS manual_payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                payment_type TEXT NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                payment_date TIMESTAMP NOT NULL,
                check_number TEXT,
                notes TEXT,
                recorded_by INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id),
                FOREIGN KEY (recorded_by) REFERENCES users(id)
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_manual_payments_customer ON manual_payments(customer_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_manual_payments_date ON manual_payments(payment_date)")
        print("   - Manual payments table created")
        conn.commit()
        
        # Step 4: Create default admin user
        print("4. Creating default admin user...")
        cursor.execute("SELECT COUNT(*) FROM users WHERE username = 'admin'")
        if cursor.fetchone()[0] == 0:
            default_password = "admin123"
            hashed_password = bcrypt.hashpw(default_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            cursor.execute("""
                INSERT INTO users (username, hashed_password, full_name, role, is_active)
                VALUES (?, ?, ?, ?, ?)
            """, ("admin", hashed_password, "Administrator", "admin", 1))
            print(f"   - Default admin user created")
            print(f"   - Username: admin")
            print(f"   - Password: {default_password}")
            print(f"   - IMPORTANT: Change this password immediately after first login!")
        else:
            print("   - Admin user already exists, skipping")
        
        conn.commit()
        
        print("\n✓ Migration completed successfully!")
        print("\nYou can now start the application with the new features.")
        
    except Exception as e:
        conn.rollback()
        print(f"\n✗ Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()

