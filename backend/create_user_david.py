#!/usr/bin/env python3
"""
Create or update user "david" with admin role and the given password.
Run from backend directory: python create_user_david.py
"""
import sqlite3
import os
import sys
import bcrypt

USERNAME = "david"
PASSWORD = "4357efi#"
EMAIL = "david@local"
FULL_NAME = "David"
ROLE = "admin"


def get_database_path():
    try:
        from app.config import DATABASE_PATH
        return DATABASE_PATH
    except Exception:
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        return os.path.join(backend_dir, "billing.db")


def main():
    db_path = get_database_path()
    if not os.path.exists(db_path):
        print(f"ERROR: Database not found at {db_path}")
        print("Run 'python -m app.init_db' from the backend directory first.")
        sys.exit(1)

    hashed = bcrypt.hashpw(PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id FROM users WHERE username = ?", (USERNAME,))
        row = cursor.fetchone()
        if row:
            cursor.execute(
                """UPDATE users SET hashed_password = ?, role = ?, is_active = 1,
                   email_verified = 1, requires_email_update = 0, requires_password_reset = 0
                   WHERE username = ?""",
                (hashed, ROLE, USERNAME),
            )
            conn.commit()
            print(f"[OK] User '{USERNAME}' updated with admin role and new password.")
        else:
            cursor.execute(
                """INSERT INTO users (username, email, hashed_password, full_name, role,
                   is_active, email_verified, requires_email_update, requires_password_reset)
                   VALUES (?, ?, ?, ?, ?, 1, 1, 0, 0)""",
                (USERNAME, EMAIL, hashed, FULL_NAME, ROLE),
            )
            conn.commit()
            print(f"[OK] User '{USERNAME}' created with admin role.")
        print("")
        print("Login with:")
        print(f"  Username: {USERNAME}")
        print(f"  Password: {PASSWORD}")
        print("")
    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
