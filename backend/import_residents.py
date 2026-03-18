"""
Import residents from the Hogla community CSV file directly into the SQLite database.
Writes directly to DB (no HTTP) for speed.

Column layout (0-indexed, from header row 2):
  0  street name       1  house number    2  full name
  3  family name       4  first name      5  phone
  6  tenant (1=yes)    7  landlord (1=yes; text=landlord name means they are tenant)
  8  senior citizen    9  armed forces   10  armed
 11  medical/medic    12  service type   13  role/service
 14  tzahi            15  elected role   16  konenut class or helper role
 17  konenut class    18+ extra (ignored)
"""

import csv
import sys
import os

# Force UTF-8 output on Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.resident import Resident

CSV_PATH = r"c:\Users\David Miron\Downloads\Hogla Taxes\residents shirit edited.csv"

SKIP_FULL_NAMES = {
    "", "להוסיף", "לבדוק", "עובד זר", "מטפלת", "בן זוג", "דייר חדש",
    "רווה ילדה", "מינץ גונן", "ריינר גיא", "אייזנמן מינץ גל",
}
SKIP_KEYWORDS = (
    "עובד זר", "מטפלת", "בן זוג", "דייר חדש", "עובד זרה", "עובדת זרה", "ריינר"
)
SKIP_COL1 = {"להוסיף", "לבדוק"}
MILUIM_KEYWORDS = {"מילואים"}
SERVICE_KEYWORDS = {"מילואים", "סדיר", "קבע", "מגויס"}
MED_KEYWORDS = ("רפואה", "חובש", "ליווי משפחות")


def col(row, idx):
    try:
        return row[idx].strip()
    except IndexError:
        return ""


def flag(row, idx):
    return col(row, idx) == "1"


def contains_miluim(row):
    return any(col(row, i) in MILUIM_KEYWORDS for i in range(12, 18))


def is_armed_forces(row):
    if flag(row, 9):
        return True
    return any(col(row, i) in SERVICE_KEYWORDS for i in (12, 13))


def is_medical(row):
    if flag(row, 11):
        return True
    return any(
        any(kw in col(row, i) for kw in MED_KEYWORDS)
        for i in range(11, 18)
    )


def is_tzahi(row):
    if col(row, 14):
        return True
    return any("צח" in col(row, i) for i in range(12, 18))


def build_konenut(row):
    parts = [col(row, i) for i in range(12, 18) if col(row, i)]
    return " | ".join(parts) if parts else None


def clean_phone(v):
    v = v.strip()
    return v if v and v not in ("-", "--", "/") else None


def clean_street(v):
    v = v.strip()
    return v if v and not v.isdigit() else None


def clean_house(v):
    v = v.strip()
    return v if v and v not in SKIP_COL1 else None


def parse_name(row):
    family = col(row, 3)
    first  = col(row, 4)
    full   = col(row, 2)
    if family and first:
        return first.strip(), family.strip()
    if full:
        parts = full.split()
        if len(parts) >= 2:
            return parts[-1], " ".join(parts[:-1])
        if len(parts) == 1:
            return parts[0], parts[0]
    return None, None


def should_skip(row):
    if len(row) < 3:
        return True
    full = col(row, 2)
    col3 = col(row, 3)
    col4 = col(row, 4)
    if not full and not col3 and not col4:
        return True
    if full in SKIP_FULL_NAMES:
        return True
    if any(kw in full for kw in SKIP_KEYWORDS):
        return True
    if not col3 and not col4 and full.startswith(("להוסיף", "לבדוק")):
        return True
    return False


def main():
    print(f"Reading: {CSV_PATH}")
    with open(CSV_PATH, encoding="utf-8-sig", newline="") as f:
        all_rows = list(csv.reader(f))

    data_rows = all_rows[2:]  # skip 2 header rows
    print(f"Found {len(data_rows)} data rows. Importing...\n")

    db = SessionLocal()
    created = skipped = duplicate = error_count = 0
    errors = []

    try:
        for i, row in enumerate(data_rows):
            lineno = i + 3

            if should_skip(row):
                skipped += 1
                continue

            first_name, family_name = parse_name(row)
            if not first_name or not family_name:
                skipped += 1
                continue

            if first_name in ("להוסיף", "לבדוק") or family_name in ("להוסיף", "לבדוק"):
                skipped += 1
                continue

            full_name = f"{first_name} {family_name}"

            existing = db.query(Resident).filter(Resident.full_name == full_name).first()
            if existing:
                duplicate += 1
                print(f"  [{lineno:3d}] ~ dup: {full_name}")
                continue

            r = Resident(
                first_name            = first_name,
                family_name           = family_name,
                full_name             = full_name,
                street_name           = clean_street(col(row, 0)),
                house_address_number  = clean_house(col(row, 1)),
                telephone             = clean_phone(col(row, 5)),
                tenant                = flag(row, 6),
                landlord              = (col(row, 7) == "1"),
                senior_citizen        = flag(row, 8),
                armed_forces          = is_armed_forces(row),
                armed                 = flag(row, 10),
                active_miluim         = contains_miluim(row),
                medical_personal_team = is_medical(row),
                tzahi                 = is_tzahi(row),
                konenut               = build_konenut(row),
            )

            try:
                db.add(r)
                db.flush()
                created += 1
                print(f"  [{lineno:3d}] + {full_name}")
            except Exception as e:
                db.rollback()
                errors.append(f"Line {lineno}: {full_name} -> {e}")
                print(f"  [{lineno:3d}] ! {full_name} -> {e}")
                error_count += 1

        db.commit()

    except Exception as e:
        db.rollback()
        print(f"\nFatal: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

    print(f"\n{'='*50}")
    print(f"Import complete.")
    print(f"  Created:    {created}")
    print(f"  Duplicates: {duplicate}")
    print(f"  Skipped:    {skipped}")
    print(f"  Errors:     {error_count}")
    if errors:
        print("\nErrors detail:")
        for e in errors:
            print(f"  {e}")


if __name__ == "__main__":
    main()
