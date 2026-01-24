"""
Migration script to add requires_password_reset to users.

Run this script once to migrate existing databases.
Uses the same DATABASE_PATH as the app (including DATABASE_PATH env override).
"""
import os
import sys
import sqlite3
from datetime import datetime

# Ensure backend is on path when run as python app/migrations/add_requires_password_reset.py
_backend = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _backend not in sys.path:
    sys.path.insert(0, _backend)


def get_database_path():
    """Use same path as app (config.DATABASE_PATH) so migration and API use one DB."""
    from app.config import DATABASE_PATH
    return DATABASE_PATH


def migrate_database():
    db_path = get_database_path()
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        print("Run 'python -m app.init_db' first, then run this migration.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Starting requires_password_reset migration...")

    try:
        cursor.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='users'
        """)
        if not cursor.fetchone():
            print("Users table missing. Run init_db before this migration.")
            return

        cursor.execute("PRAGMA table_info(users)")
        existing_columns = [col[1] for col in cursor.fetchall()]

        if "requires_password_reset" not in existing_columns:
            cursor.execute(
                "ALTER TABLE users ADD COLUMN requires_password_reset INTEGER DEFAULT 0"
            )
            conn.commit()
            print("Added requires_password_reset column")
        else:
            print("requires_password_reset column already exists")

        print("\n[OK] Migration completed successfully!")
        print(f"Completed at {datetime.utcnow().isoformat()}Z")

    except Exception as exc:
        conn.rollback()
        print(f"\n[FAIL] Migration failed: {exc}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    migrate_database()
