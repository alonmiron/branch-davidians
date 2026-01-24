"""
Migration script to add email and password reset support.

This script:
1. Adds email, email_verified, requires_email_update columns to users
2. Backfills emails for existing users (admin gets dmiron@gmail.com)
3. Creates password_reset_codes table

Run this script once to migrate your existing database.
Uses the same DATABASE_PATH as the app (including DATABASE_PATH env override).
"""
import sys
import os
import sqlite3
from datetime import datetime

# Ensure backend is on path when run as python app/migrations/add_password_reset_and_email.py
_backend = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _backend not in sys.path:
    sys.path.insert(0, _backend)


def get_database_path():
    """Use same path as app (config.DATABASE_PATH) so migration and API use one DB."""
    from app.config import DATABASE_PATH
    return DATABASE_PATH


def migrate_database():
    """Run all migration steps"""
    db_path = get_database_path()

    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        print("Run 'python -m app.init_db' first, then run this migration.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Starting password reset + email migration...")

    try:
        # Step 1: Ensure users table exists
        cursor.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='users'
        """)
        if not cursor.fetchone():
            print("1. Creating users table...")
            cursor.execute("""
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    hashed_password TEXT NOT NULL,
                    full_name TEXT NOT NULL,
                    role TEXT NOT NULL,
                    is_active INTEGER DEFAULT 1,
                    email_verified INTEGER DEFAULT 0,
                    requires_email_update INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)")
            cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)")
            conn.commit()
            print("   - Users table created")

        # Step 2: Add new columns if missing
        print("2. Adding email columns to users table...")
        cursor.execute("PRAGMA table_info(users)")
        existing_columns = [col[1] for col in cursor.fetchall()]

        if "email" not in existing_columns:
            cursor.execute("ALTER TABLE users ADD COLUMN email TEXT NOT NULL DEFAULT ''")
            print("   - Added email column")

        if "email_verified" not in existing_columns:
            cursor.execute("ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0")
            print("   - Added email_verified column")

        if "requires_email_update" not in existing_columns:
            cursor.execute("ALTER TABLE users ADD COLUMN requires_email_update INTEGER DEFAULT 0")
            print("   - Added requires_email_update column")

        conn.commit()

        # Step 3: Backfill emails
        print("3. Backfilling user emails...")
        cursor.execute("SELECT id, username, email FROM users")
        users = cursor.fetchall()
        for user_id, username, email in users:
            if email and email.strip():
                continue
            if username == "admin":
                new_email = "dmiron@gmail.com"
                cursor.execute(
                    "UPDATE users SET email = ?, email_verified = 1, requires_email_update = 0 WHERE id = ?",
                    (new_email, user_id),
                )
            else:
                placeholder = f"user_{user_id}@invalid.local"
                cursor.execute(
                    "UPDATE users SET email = ?, email_verified = 0, requires_email_update = 1 WHERE id = ?",
                    (placeholder, user_id),
                )

        conn.commit()

        # Step 4: Ensure unique index on email
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        print("   - Email unique index ensured")

        # Step 5: Create password_reset_codes table
        print("4. Creating password_reset_codes table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS password_reset_codes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                purpose TEXT NOT NULL,
                code_hash TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                used_at TIMESTAMP NULL,
                attempts INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_reset_codes_user ON password_reset_codes(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_reset_codes_expires ON password_reset_codes(expires_at)")
        conn.commit()
        print("   - Password reset codes table created")

        print("\n[OK] Migration completed successfully!")
        print(f"Completed at {datetime.utcnow().isoformat()}Z")

    except Exception as e:
        conn.rollback()
        print(f"\n[FAIL] Migration failed: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    migrate_database()
