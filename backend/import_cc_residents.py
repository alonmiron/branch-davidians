"""
One-time import script: reads Hogla_Tax_Sheets.csv and seeds the cc_residents table.

Usage (from backend directory, with venv active):
    python import_cc_residents.py /path/to/Hogla_Tax_Sheets.csv

The CSV is expected to have NO header row (or a non-data first row that will be skipped
if the first field cannot be parsed as a numeric/blank taxpayer ID).

Column mapping:
  A (0) - taxpayer_id
  B (1) - house
  C (2) - landlord
  D (3) - tenant
  E (4) - monthly_amount
  F (5) - card_expiry (3 or 4 digit, padded to MMYY)
  G (6) - card_token
  H (7) - current_debt / balance (positive = debt, negative = credit)

Monthly columns (pairs per month: W = charge written, T = transaction result):
  01 W = col 8,  01 T = col 9
  02 W = col 10, 02 T = col 11
  ...
  12 W = col 32, 12 T = col 33
  Annual total = col 34

Historical monthly entries for 2025 are also imported if present.
"""

import sys
import csv
import os
from decimal import Decimal, InvalidOperation
from pathlib import Path

# Add backend root to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.database import engine, Base, SessionLocal
from app.models.cc_resident import CcResident
from app.models.cc_monthly_entry import CcMonthlyEntry, CcEntryStatus
import app.models  # ensure all models are registered


HISTORICAL_YEAR = 2025

MONTH_W_OFFSETS = {m: 8 + (m - 1) * 2 for m in range(1, 13)}
MONTH_T_OFFSETS = {m: 9 + (m - 1) * 2 for m in range(1, 13)}

FAILED_TEXT_INDICATORS = {"סירוב", "refusal", "refused", "denied"}


def normalize_expiry(value: str) -> str:
    v = str(value).strip()
    if len(v) == 3:
        v = "0" + v
    return v


def parse_amount(value: str) -> Decimal:
    try:
        cleaned = str(value).strip().replace(",", "")
        if not cleaned:
            return Decimal("0")
        return Decimal(cleaned)
    except (InvalidOperation, ValueError):
        return Decimal("0")


def is_header_row(row: list) -> bool:
    """
    Returns True if this row is a column-header row rather than real data.
    Detection: the monthly-amount field (col 4) contains non-numeric text.
    """
    if len(row) <= 4:
        return False
    amount_cell = str(row[4]).strip()
    # Non-empty and not parseable as a number → it's a header label (e.g. "סכום")
    if amount_cell and not amount_cell.replace(".", "").replace("-", "").replace(",", "").isdigit():
        return True
    return False


def import_from_csv(csv_path: str, historical_year: int = HISTORICAL_YEAR):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        with open(csv_path, encoding="utf-8-sig") as f:
            reader = csv.reader(f)
            rows = list(reader)
    except UnicodeDecodeError:
        with open(csv_path, encoding="cp1255") as f:
            reader = csv.reader(f)
            rows = list(reader)

    created = 0
    skipped = 0
    entry_created = 0

    for idx, row in enumerate(rows):
        # Pad short rows
        while len(row) < 35:
            row.append("")

        # Skip header row (detected by non-numeric monthly-amount column)
        if is_header_row(row):
            print(f"  Skipping header row at index {idx}")
            continue

        tenant = str(row[3]).strip()
        if not tenant:
            print(f"  Row {idx + 1}: skipping – no tenant name")
            continue

        taxpayer_id = str(row[0]).strip() or None
        house = str(row[1]).strip() or None
        landlord = str(row[2]).strip() or None
        monthly_amount = parse_amount(row[4])
        expiry_raw = str(row[5]).strip()
        card_expiry = normalize_expiry(expiry_raw) if expiry_raw else None
        card_token = str(row[6]).strip() or None

        # Balance/debt: positive means debt owed, negative means credit
        balance_raw = str(row[7]).strip()
        current_debt = parse_amount(balance_raw) if balance_raw else Decimal("0")

        r = CcResident(
            taxpayer_id=taxpayer_id,
            house=house,
            landlord=landlord,
            tenant=tenant,
            monthly_amount=monthly_amount,
            card_expiry=card_expiry,
            card_token=card_token,
            current_debt=current_debt,
            active=True,
            sort_order=idx,
        )
        db.add(r)
        db.flush()  # get r.id

        # Import historical monthly entries for the given year
        for m in range(1, 13):
            w_col = MONTH_W_OFFSETS[m]
            t_col = MONTH_T_OFFSETS[m]

            written_raw = str(row[w_col]).strip() if w_col < len(row) else ""
            transaction_raw = str(row[t_col]).strip() if t_col < len(row) else ""

            if not written_raw and not transaction_raw:
                continue

            expected_amount = parse_amount(written_raw) or monthly_amount
            transaction_text = transaction_raw

            # Determine status from transaction cell
            if transaction_text.strip() in FAILED_TEXT_INDICATORS:
                status = CcEntryStatus.FAILED
                actual_amount = Decimal("0")
                accumulates_debt = True
            else:
                actual = parse_amount(transaction_text)
                if actual == Decimal("0") and not written_raw:
                    continue
                actual_amount = actual
                if actual > Decimal("0"):
                    status = CcEntryStatus.SUCCESS
                    accumulates_debt = False
                elif actual == Decimal("0"):
                    status = CcEntryStatus.ZERO
                    accumulates_debt = False
                else:
                    status = CcEntryStatus.MANUAL
                    accumulates_debt = False

            entry = CcMonthlyEntry(
                resident_id=r.id,
                year=historical_year,
                month=m,
                expected_amount=expected_amount,
                attempted_amount=expected_amount,
                actual_amount=actual_amount,
                status=status,
                accumulates_debt=accumulates_debt,
                notes="Imported from Hogla_Tax_Sheets.csv",
            )
            db.add(entry)
            entry_created += 1

        created += 1

    db.commit()
    print(f"\nImport complete: {created} residents, {entry_created} historical entries.")
    db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python import_cc_residents.py <path_to_Hogla_Tax_Sheets.csv>")
        sys.exit(1)

    csv_file = sys.argv[1]
    if not os.path.exists(csv_file):
        print(f"File not found: {csv_file}")
        sys.exit(1)

    print(f"Importing from: {csv_file}")
    import_from_csv(csv_file)
