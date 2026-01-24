#!/usr/bin/env python3
"""
Script to ensure admin user exists in the database.
Run this on your server if you're having login issues.

Usage (from backend dir):
    python fix_admin_user.py
"""
import sqlite3
import os
import sys
import bcrypt

# Use same DB path as app (backend must be cwd or on path)
def get_database_path():
    try:
        from app.config import DATABASE_PATH
        return DATABASE_PATH
    except Exception:
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        return os.path.join(backend_dir, "billing.db")

def check_and_create_admin():
    """Check if admin user exists, create if missing"""
    db_path = get_database_path()
    
    if not os.path.exists(db_path):
        print(f"ERROR: Database not found at {db_path}")
        print("Please run 'python -m app.init_db' first to create the database.")
        sys.exit(1)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if users table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='users'
        """)
        if not cursor.fetchone():
            print("Users table does not exist. Creating it...")
            cursor.execute("""
                CREATE TABLE users (
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
            conn.commit()
            print("[OK] Users table created")
        
        # Check if admin user exists
        cursor.execute("SELECT COUNT(*) FROM users WHERE username = 'admin'")
        admin_exists = cursor.fetchone()[0] > 0
        
        if admin_exists:
            print("[OK] Admin user already exists")
            # Show admin user info (without password)
            cursor.execute("""
                SELECT username, full_name, role, is_active 
                FROM users 
                WHERE username = 'admin'
            """)
            admin_info = cursor.fetchone()
            print(f"  Username: {admin_info[0]}")
            print(f"  Full Name: {admin_info[1]}")
            print(f"  Role: {admin_info[2]}")
            print(f"  Active: {bool(admin_info[3])}")
        else:
            print("Admin user not found. Creating default admin user...")
            default_password = "admin123"
            hashed_password = bcrypt.hashpw(
                default_password.encode('utf-8'), 
                bcrypt.gensalt()
            ).decode('utf-8')
            
            cursor.execute("""
                INSERT INTO users (username, hashed_password, full_name, role, is_active)
                VALUES (?, ?, ?, ?, ?)
            """, ("admin", hashed_password, "Administrator", "admin", 1))
            conn.commit()
            
            print("[OK] Default admin user created successfully!")
            print("")
            print("=" * 50)
            print("DEFAULT LOGIN CREDENTIALS:")
            print("=" * 50)
            print(f"Username: admin")
            print(f"Password: {default_password}")
            print("=" * 50)
            print("")
            print("[!] IMPORTANT: Change this password immediately after first login!")
            print("")
        
        # List all users
        cursor.execute("SELECT username, full_name, role, is_active FROM users")
        all_users = cursor.fetchall()
        print(f"\nTotal users in database: {len(all_users)}")
        if all_users:
            print("\nAll users:")
            for user in all_users:
                status = "Active" if user[3] else "Inactive"
                print(f"  - {user[0]} ({user[1]}) - {user[2]} - {status}")
        
    except Exception as e:
        conn.rollback()
        print(f"\n[FAIL] Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    print("=" * 50)
    print("Admin User Check and Fix Script")
    print("=" * 50)
    print("")
    check_and_create_admin()
    print("")
    print("=" * 50)
    print("Script completed successfully!")
    print("=" * 50)
