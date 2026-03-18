#!/usr/bin/env python3
"""
Create or update a super_admin user.
Run from the backend directory: python create_super_admin.py

Edit USERNAME / PASSWORD / EMAIL before running.
"""
import sqlite3
import sys
import os
import bcrypt

USERNAME  = "superadmin"
PASSWORD  = "change-me-now!"
EMAIL     = "superadmin@local"
FULL_NAME = "Super Admin"
ROLE      = "super_admin"


def get_database_path():
    try:
        from app.config import DATABASE_PATH
        return DATABASE_PATH
    except Exception:
        return os.path.join(os.path.dirname(os.path.abspath(__file__)), "billing.db")


def main():
    db_path = get_database_path()
    if not os.path.exists(db_path):
        print(f"ERROR: Database not found at {db_path}")
        sys.exit(1)

    hashed = bcrypt.hashpw(PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        row = cursor.execute("SELECT id FROM users WHERE username = ?", (USERNAME,)).fetchone()
        if row:
            cursor.execute(
                """UPDATE users SET hashed_password=?, role=?, is_active=1,
                   email_verified=1, requires_email_update=0, requires_password_reset=0,
                   community_id=NULL WHERE username=?""",
                (hashed, ROLE, USERNAME),
            )
            conn.commit()
            print(f"[OK] User '{USERNAME}' updated with super_admin role.")
        else:
            cursor.execute(
                """INSERT INTO users (username, email, hashed_password, full_name, role,
                   is_active, email_verified, requires_email_update, requires_password_reset,
                   community_id)
                   VALUES (?, ?, ?, ?, ?, 1, 1, 0, 0, NULL)""",
                (USERNAME, EMAIL, hashed, FULL_NAME, ROLE),
            )
            conn.commit()
            print(f"[OK] User '{USERNAME}' created with super_admin role.")

        print(f"\nLogin with:\n  Username: {USERNAME}\n  Password: {PASSWORD}\n")
        print("IMPORTANT: Change the password immediately after first login.")
    except Exception as e:
        conn.rollback()
        import traceback; traceback.print_exc()
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
