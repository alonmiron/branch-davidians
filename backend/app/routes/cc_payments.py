"""
Payment operations: overview, batch generation, result upload, manual entry edits.
"""
import io
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.cc_resident import CcResident
from app.models.cc_monthly_entry import CcMonthlyEntry, CcEntryStatus
from app.models.cc_custom_field import CcCustomField
from app.models.cc_file_archive import CcFileArchive
from app.schemas.cc_schemas import (
    CcOverviewResponse,
    CcResidentOverviewRow,
    MonthCellData,
    CcResidentResponse,
    CcMonthlyEntryResponse,
    CcMonthlyEntryUpdate,
    CcUploadResultResponse,
    CcGenerateBatchRequest,
)
from app.services.cc_csv_service import (
    create_batch_archive,
    create_pending_entries,
    process_cc_result_csv,
)
from app.services.email_service import send_email_with_attachment
from app.config import CC_REPORT_EMAIL

router = APIRouter()

MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]


# ─── Overview ─────────────────────────────────────────────────────────────────

@router.get("/overview", response_model=CcOverviewResponse)
def get_overview(
    year: int = Query(..., description="Fiscal year to display"),
    db: Session = Depends(get_db),
):
    residents = (
        db.query(CcResident)
        .order_by(CcResident.sort_order, CcResident.id)
        .all()
    )
    entries = (
        db.query(CcMonthlyEntry)
        .filter(CcMonthlyEntry.year == year)
        .all()
    )
    custom_fields = db.query(CcCustomField).all()

    entries_by_resident: dict = {}
    for e in entries:
        entries_by_resident.setdefault(e.resident_id, {})[e.month] = e

    cf_by_resident: dict = {}
    for cf in custom_fields:
        cf_by_resident.setdefault(cf.resident_id, []).append(cf)

    rows = []
    for r in residents:
        month_map: dict = {}
        annual_expected = Decimal("0")
        annual_collected = Decimal("0")

        for m in range(1, 13):
            entry = entries_by_resident.get(r.id, {}).get(m)
            if entry:
                cell = MonthCellData(
                    entry_id=entry.id,
                    status=entry.status,
                    expected_amount=entry.expected_amount,
                    attempted_amount=entry.attempted_amount,
                    actual_amount=entry.actual_amount,
                    response_code=entry.response_code,
                    notes=entry.notes,
                )
                annual_expected += Decimal(str(entry.expected_amount or 0))
                if entry.status == CcEntryStatus.SUCCESS:
                    annual_collected += Decimal(str(entry.actual_amount or entry.attempted_amount or 0))
            else:
                cell = MonthCellData()
            month_map[m] = cell

        rows.append(
            CcResidentOverviewRow(
                resident=CcResidentResponse.model_validate(r),
                months=month_map,
                annual_expected=annual_expected,
                annual_collected=annual_collected,
                custom_fields=[
                    cf for cf in cf_by_resident.get(r.id, [])
                ],
            )
        )

    return CcOverviewResponse(year=year, rows=rows)


# ─── Monthly entry edits ──────────────────────────────────────────────────────

@router.put("/entries/{entry_id}", response_model=CcMonthlyEntryResponse)
def update_entry(
    entry_id: int,
    data: CcMonthlyEntryUpdate,
    db: Session = Depends(get_db),
):
    entry = db.query(CcMonthlyEntry).filter(CcMonthlyEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/entries/{entry_id}")
def delete_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(CcMonthlyEntry).filter(CcMonthlyEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()
    return {"message": "Entry deleted"}


@router.post("/entries/manual")
def create_manual_entry(
    data: dict,
    db: Session = Depends(get_db),
):
    """Create a manual adjustment entry (prepaid, credit, custom note, etc.)"""
    resident_id = data.get("resident_id")
    year = data.get("year")
    month = data.get("month")
    amount = Decimal(str(data.get("amount", "0")))
    status = data.get("status", CcEntryStatus.MANUAL)
    notes = data.get("notes")

    resident = db.query(CcResident).filter(CcResident.id == resident_id).first()
    if not resident:
        raise HTTPException(status_code=404, detail="Resident not found")

    entry = CcMonthlyEntry(
        resident_id=resident_id,
        year=year,
        month=month,
        expected_amount=amount,
        attempted_amount=amount,
        actual_amount=amount,
        status=status,
        accumulates_debt=False,
        notes=notes,
    )
    db.add(entry)

    # If it's a prepaid entry, reduce resident's debt
    if status == CcEntryStatus.PREPAID and amount > 0:
        resident.current_debt = max(Decimal("0"), Decimal(str(resident.current_debt or 0)) - amount)

    db.commit()
    db.refresh(entry)
    return entry


# ─── Batch generation ─────────────────────────────────────────────────────────

@router.post("/generate-batch")
def generate_batch(
    request: CcGenerateBatchRequest,
    db: Session = Depends(get_db),
):
    """Generate and download the monthly batch CSV file."""
    residents = (
        db.query(CcResident)
        .filter(CcResident.active == True)
        .order_by(CcResident.sort_order, CcResident.id)
        .all()
    )
    if not residents:
        raise HTTPException(status_code=404, detail="No active residents found")

    csv_content, archive_id = create_batch_archive(
        residents, request.year, request.month, request.include_debt, db
    )
    create_pending_entries(
        residents, request.year, request.month, request.include_debt, archive_id, db
    )
    db.commit()

    filename = f"ttxhogla-{MONTH_NAMES[request.month - 1]}-{request.year}.csv"
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/generate-batch-and-email")
def generate_batch_and_email(
    request: CcGenerateBatchRequest,
    db: Session = Depends(get_db),
):
    """
    Generate the monthly batch CSV, archive it, create pending entries,
    and email the CSV to the configured address.
    Used by the automated monthly cron job.
    """
    residents = (
        db.query(CcResident)
        .filter(CcResident.active == True)
        .order_by(CcResident.sort_order, CcResident.id)
        .all()
    )
    if not residents:
        raise HTTPException(status_code=404, detail="No active residents found")

    csv_content, archive_id = create_batch_archive(
        residents, request.year, request.month, request.include_debt, db
    )
    create_pending_entries(
        residents, request.year, request.month, request.include_debt, archive_id, db
    )
    db.commit()

    month_name = MONTH_NAMES[request.month - 1]
    filename = f"ttxhogla-{month_name}-{request.year}.csv"
    body = (
        f"Monthly credit card charge file for {month_name} {request.year}.\n\n"
        f"Residents included: {len(residents)}\n"
        "Please process this file with the credit card processor and upload the result file "
        "to the Hogla Tax Management platform.\n"
    )
    try:
        send_email_with_attachment(
            to_email=CC_REPORT_EMAIL,
            subject=f"Hogla Monthly Charge – {month_name} {request.year}",
            body=body,
            attachment_content=csv_content,
            attachment_filename=filename,
        )
        email_status = "sent"
    except Exception as exc:
        email_status = f"failed: {exc}"

    return {
        "archive_id": archive_id,
        "filename": filename,
        "residents_count": len(residents),
        "email_status": email_status,
    }


# ─── Result upload ────────────────────────────────────────────────────────────

@router.post("/upload-results", response_model=CcUploadResultResponse)
async def upload_results(
    file: UploadFile = File(...),
    year: int = Query(...),
    month: int = Query(...),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    content_bytes = await file.read()
    csv_content = content_bytes.decode("utf-8-sig")  # handle BOM

    # Save archive record first so we have an ID
    archive = CcFileArchive(
        filename=file.filename,
        file_type="result_import",
        file_content=csv_content,
        month=month,
        year=year,
        processed=False,
    )
    db.add(archive)
    db.flush()

    # Write to disk
    from app.services.cc_csv_service import _save_to_disk
    file_path = _save_to_disk(csv_content, file.filename)
    archive.file_path = file_path

    result = process_cc_result_csv(csv_content, year, month, archive.id, db)
    archive.processed = True
    archive.record_count = result["total_processed"]
    db.commit()

    return CcUploadResultResponse(
        total_processed=result["total_processed"],
        successful=result["successful"],
        failed=result["failed"],
        zero=result["zero"],
        errors=result["errors"],
        archive_id=archive.id,
    )
