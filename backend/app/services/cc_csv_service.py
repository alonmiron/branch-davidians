"""
CSV generation and result-file parsing for the Hogla credit-card payment module.
"""
import csv
import io
import os
from datetime import datetime
from decimal import Decimal
from typing import List, Tuple
from pathlib import Path
from sqlalchemy.orm import Session

from app.config import FILES_STORAGE_PATH
from app.models.cc_resident import CcResident
from app.models.cc_monthly_entry import CcMonthlyEntry, CcEntryStatus
from app.models.cc_file_archive import CcFileArchive


# ─── Helpers ─────────────────────────────────────────────────────────────────

# Response codes that mean the charge failed and debt accumulates
DEBT_ACCUMULATING_CODES = {"1", "2", "3", "4"}
# Response code meaning zero amount / no debt
ZERO_AMOUNT_CODE = "20014"


def _ensure_storage_dir() -> Path:
    p = Path(FILES_STORAGE_PATH)
    p.mkdir(parents=True, exist_ok=True)
    return p


def _save_to_disk(content: str, filename: str) -> str:
    """Persist file content to disk and return the full path."""
    storage = _ensure_storage_dir()
    path = storage / filename
    path.write_text(content, encoding="utf-8")
    return str(path)


# ─── Batch CSV generation ────────────────────────────────────────────────────

def generate_cc_batch_csv(
    residents: List[CcResident],
    include_debt: bool = True,
) -> str:
    """
    Generate the Tranzila-format batch CSV.
    Columns: TranzilaTK, expdate, currency, sum, tranmode, cred_type
    When include_debt=True the sum = monthly_amount + current_debt.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["TranzilaTK", "expdate", "currency", "sum", "tranmode", "cred_type"])

    for r in residents:
        if not r.active:
            continue
        token = r.card_token or ""
        expiry = r.card_expiry or ""
        monthly = Decimal(str(r.monthly_amount or 0))
        debt = Decimal(str(r.current_debt or 0)) if include_debt else Decimal("0")
        charge = monthly + debt
        writer.writerow([token, expiry, 1, int(charge), "A", 1])

    return output.getvalue()


def create_batch_archive(
    residents: List[CcResident],
    year: int,
    month: int,
    include_debt: bool,
    db: Session,
) -> Tuple[str, int]:
    """
    Generate batch CSV, save to disk and DB archive.
    Returns (csv_content, archive_id).
    """
    content = generate_cc_batch_csv(residents, include_debt)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"ttxhogla_{year}{month:02d}_{timestamp}.csv"
    file_path = _save_to_disk(content, filename)

    archive = CcFileArchive(
        filename=filename,
        file_type="batch_export",
        file_path=file_path,
        file_content=content,
        month=month,
        year=year,
        record_count=len([r for r in residents if r.active]),
        processed=True,
    )
    db.add(archive)
    db.flush()  # get archive.id before commit

    return content, archive.id


# ─── Pending charge creation ─────────────────────────────────────────────────

def create_pending_entries(
    residents: List[CcResident],
    year: int,
    month: int,
    include_debt: bool,
    batch_archive_id: int,
    db: Session,
) -> None:
    """
    Create (or update) pending CcMonthlyEntry rows for the given month.
    """
    for r in residents:
        if not r.active:
            continue
        monthly = Decimal(str(r.monthly_amount or 0))
        debt = Decimal(str(r.current_debt or 0)) if include_debt else Decimal("0")
        attempted = monthly + debt

        existing = db.query(CcMonthlyEntry).filter(
            CcMonthlyEntry.resident_id == r.id,
            CcMonthlyEntry.year == year,
            CcMonthlyEntry.month == month,
        ).first()

        if existing:
            existing.expected_amount = monthly
            existing.attempted_amount = attempted
            existing.status = CcEntryStatus.PENDING
            existing.batch_file_id = batch_archive_id
        else:
            entry = CcMonthlyEntry(
                resident_id=r.id,
                year=year,
                month=month,
                expected_amount=monthly,
                attempted_amount=attempted,
                status=CcEntryStatus.PENDING,
                accumulates_debt=True,
                batch_file_id=batch_archive_id,
            )
            db.add(entry)


# ─── Result CSV processing ───────────────────────────────────────────────────

def process_cc_result_csv(
    csv_content: str,
    year: int,
    month: int,
    result_archive_id: int,
    db: Session,
) -> dict:
    """
    Parse the processor result CSV and update monthly entries and resident debt.

    Result CSV columns:
      TranzilaTK, expdate, currency, sum, tranmode, cred_type,
      response, index, confirmation_code, TranzilaTK
    """
    reader = csv.DictReader(io.StringIO(csv_content))

    total = 0
    successful = 0
    failed = 0
    zero = 0
    errors = []

    for row in reader:
        token = (row.get("TranzilaTK") or "").strip()
        if not token:
            continue

        response_code = str(row.get("response", "")).strip()
        index_number = str(row.get("index", "")).strip()
        confirmation_code = str(row.get("confirmation_code", "")).strip()
        try:
            row_sum = Decimal(str(row.get("sum", "0") or "0"))
        except Exception:
            row_sum = Decimal("0")

        resident = db.query(CcResident).filter(
            CcResident.card_token == token
        ).first()

        if not resident:
            errors.append(f"No resident found for token: {token}")
            continue

        entry = db.query(CcMonthlyEntry).filter(
            CcMonthlyEntry.resident_id == resident.id,
            CcMonthlyEntry.year == year,
            CcMonthlyEntry.month == month,
        ).first()

        monthly_amt = Decimal(str(resident.monthly_amount or 0))
        current_debt = Decimal(str(resident.current_debt or 0))

        if entry is None:
            entry = CcMonthlyEntry(
                resident_id=resident.id,
                year=year,
                month=month,
                expected_amount=monthly_amt,
                attempted_amount=row_sum,
            )
            db.add(entry)

        entry.response_code = response_code
        entry.index_number = index_number
        entry.confirmation_code = confirmation_code if confirmation_code else None
        entry.actual_amount = row_sum
        entry.result_file_id = result_archive_id

        if response_code == "0":
            entry.status = CcEntryStatus.SUCCESS
            entry.accumulates_debt = False
            # Clear debt if this payment included prior debt
            attempted = Decimal(str(entry.attempted_amount or 0))
            debt_portion = max(Decimal("0"), attempted - monthly_amt)
            if debt_portion > 0:
                resident.current_debt = max(Decimal("0"), current_debt - debt_portion)
            successful += 1

        elif response_code == ZERO_AMOUNT_CODE:
            entry.status = CcEntryStatus.ZERO
            entry.accumulates_debt = False
            zero += 1

        elif response_code in DEBT_ACCUMULATING_CODES:
            entry.status = CcEntryStatus.FAILED
            entry.accumulates_debt = True
            resident.current_debt = current_debt + monthly_amt
            failed += 1

        else:
            # Unknown failure code – still accumulate debt
            entry.status = CcEntryStatus.FAILED
            entry.accumulates_debt = True
            resident.current_debt = current_debt + monthly_amt
            failed += 1

        total += 1

    db.commit()
    return {
        "total_processed": total,
        "successful": successful,
        "failed": failed,
        "zero": zero,
        "errors": errors,
    }
