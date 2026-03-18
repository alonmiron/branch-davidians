"""
Migration: add configurable section flags to communities table.
  Adds: section_people, section_places, section_community, section_payments
  All default to 1 (enabled) for existing rows.

Run from the backend directory:
  python -m app.migrations.add_community_sections
"""
import sqlite3
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from app.config import DATABASE_PATH


def run():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    cursor.execute("PRAGMA table_info(communities)")
    existing_cols = {row[1] for row in cursor.fetchall()}

    added = []
    for col in ("section_people", "section_places", "section_community", "section_payments"):
        if col not in existing_cols:
            cursor.execute(f"ALTER TABLE communities ADD COLUMN {col} INTEGER NOT NULL DEFAULT 1")
            cursor.execute(f"UPDATE communities SET {col} = 1 WHERE {col} IS NULL")
            added.append(col)
            print(f"[OK] Added '{col}' column to communities (existing rows set to 1).")
        else:
            print(f"[OK] '{col}' already exists in communities.")

    conn.commit()
    conn.close()

    if added:
        print(f"\nMigration complete. Added columns: {', '.join(added)}")
    else:
        print("\nNothing to migrate — all columns already present.")


if __name__ == "__main__":
    run()
