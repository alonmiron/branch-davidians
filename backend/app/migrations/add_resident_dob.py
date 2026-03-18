"""
Migration: add date_of_birth column to residents table.
Run from the backend directory: python -m app.migrations.add_resident_dob
"""
import sqlite3
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from app.config import DATABASE_PATH


def run():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cols = [row[1] for row in cursor.execute("PRAGMA table_info(residents)").fetchall()]
    if "date_of_birth" not in cols:
        cursor.execute("ALTER TABLE residents ADD COLUMN date_of_birth DATE")
        conn.commit()
        print("[OK] Added date_of_birth column to residents table.")
    else:
        print("[OK] date_of_birth column already exists — nothing to do.")
    conn.close()


if __name__ == "__main__":
    run()
