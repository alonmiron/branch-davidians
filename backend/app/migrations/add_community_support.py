"""
Migration: add multi-community support.
  1. Create communities table
  2. Seed 'Hogla Community' as community id=1
  3. Add community_id to users (default 1)
  4. Add community_id to residents (default 1)

Run from the backend directory:
  python -m app.migrations.add_community_support
"""
import sqlite3
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from app.config import DATABASE_PATH


def run():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # 1. Create communities table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS communities (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT    NOT NULL UNIQUE,
            website_url TEXT,
            phone_number TEXT,
            active     INTEGER NOT NULL DEFAULT 1,
            created_at TEXT    DEFAULT (datetime('now')),
            updated_at TEXT
        )
    """)
    print("[OK] communities table ready.")

    # 2. Seed Hogla Community as id=1
    existing = cursor.execute("SELECT id FROM communities WHERE id = 1").fetchone()
    if not existing:
        cursor.execute("""
            INSERT INTO communities (id, name, active)
            VALUES (1, 'Hogla Community', 1)
        """)
        print("[OK] Seeded 'Hogla Community' as community id=1.")
    else:
        print("[OK] Community id=1 already exists.")

    # 3. community_id on users
    user_cols = [r[1] for r in cursor.execute("PRAGMA table_info(users)").fetchall()]
    if "community_id" not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN community_id INTEGER REFERENCES communities(id)")
        cursor.execute("UPDATE users SET community_id = 1 WHERE community_id IS NULL")
        print("[OK] Added community_id to users (defaulted existing rows to 1).")
    else:
        print("[OK] users.community_id already exists.")

    # 4. community_id on residents
    res_cols = [r[1] for r in cursor.execute("PRAGMA table_info(residents)").fetchall()]
    if "community_id" not in res_cols:
        cursor.execute("ALTER TABLE residents ADD COLUMN community_id INTEGER REFERENCES communities(id)")
        cursor.execute("UPDATE residents SET community_id = 1 WHERE community_id IS NULL")
        print("[OK] Added community_id to residents (defaulted existing rows to 1).")
    else:
        print("[OK] residents.community_id already exists.")

    conn.commit()
    conn.close()
    print("\nMigration complete.")


if __name__ == "__main__":
    run()
