import csv
import sys
from decimal import Decimal, InvalidOperation
from io import StringIO
from pathlib import Path

from app.database import SessionLocal
from app.models.customer import Customer


ENCODING_CANDIDATES = [
    "utf-8-sig",
    "utf-8",
    "cp1255",
    "iso-8859-8",
    "windows-1255",
]

SOURCE_HEADERS = {
    "taxpayer_id": ["tax payer id", "taxpayer_id"],
    "address": ["בית", "address"],
    "landlord_name": ["בעל בית", "landlord_name"],
    "payee_name": ["שם", "payee_name"],
    "monthly_amount": ["סכום", "monthly_amount"],
    "current_card_expiry": ["תוקף", "current_card_expiry"],
    "current_card_token": ["טוקן", "current_card_token"],
    "payment_method": ["payment_method"],
    "phone_number": ["phone_number", "phone"],
    "email": ["email"],
}


def read_text_with_fallbacks(path: Path) -> str:
    data = path.read_bytes()
    last_error = None
    for encoding in ENCODING_CANDIDATES:
        try:
            return data.decode(encoding)
        except UnicodeDecodeError as exc:
            last_error = exc
    raise UnicodeDecodeError(
        "unknown",
        data,
        0,
        min(len(data), 1),
        f"Unable to decode file with {ENCODING_CANDIDATES}: {last_error}",
    )


def pick_value(row: dict, keys: list[str]) -> str:
    for key in keys:
        if key in row and row[key] is not None:
            value = str(row[key]).strip()
            if value:
                return value
    return ""


def normalize_expiry(raw_value: str) -> str:
    digits = "".join(ch for ch in raw_value if ch.isdigit())
    if len(digits) == 3:
        return f"0{digits}"
    return digits


def parse_amount(raw_value: str) -> Decimal:
    cleaned = raw_value.replace(",", "").strip()
    if not cleaned:
        return Decimal("0")
    try:
        return Decimal(cleaned)
    except InvalidOperation:
        return Decimal("0")


def build_customer_data(row: dict) -> dict:
    taxpayer_id = pick_value(row, SOURCE_HEADERS["taxpayer_id"])
    payee_name = pick_value(row, SOURCE_HEADERS["payee_name"])
    address = pick_value(row, SOURCE_HEADERS["address"]) or "Unknown"
    landlord_name = pick_value(row, SOURCE_HEADERS["landlord_name"]) or None
    monthly_amount_raw = pick_value(row, SOURCE_HEADERS["monthly_amount"]) or "0"
    token = pick_value(row, SOURCE_HEADERS["current_card_token"])
    expiry_raw = pick_value(row, SOURCE_HEADERS["current_card_expiry"])
    expiry = normalize_expiry(expiry_raw)
    payment_method = pick_value(row, SOURCE_HEADERS["payment_method"]) or ""
    phone_number = pick_value(row, SOURCE_HEADERS["phone_number"]) or None
    email = pick_value(row, SOURCE_HEADERS["email"]) or None

    if not payment_method:
        payment_method = "credit" if token else "cash"

    return {
        "taxpayer_id": taxpayer_id,
        "payee_name": payee_name,
        "address": address,
        "landlord_name": landlord_name,
        "monthly_amount": parse_amount(monthly_amount_raw),
        "payment_method": payment_method,
        "current_card_token": token or None,
        "current_card_expiry": expiry or None,
        "phone_number": phone_number,
        "email": email,
        "currency": 1,
        "tranmode": "A",
        "cred_type": 1,
    }


def import_customers(csv_text: str, skip_duplicates: bool = True) -> tuple[int, int, list[str]]:
    reader = csv.DictReader(StringIO(csv_text))
    created = 0
    skipped = 0
    errors: list[str] = []
    seen_taxpayer_ids: set[str] = set()

    if not reader.fieldnames:
        return 0, 0, ["CSV file has no headers"]

    db = SessionLocal()
    try:
        for idx, row in enumerate(reader, start=1):
            customer_data = build_customer_data(row)
            if not customer_data["taxpayer_id"] or not customer_data["payee_name"]:
                skipped += 1
                continue
            if customer_data["taxpayer_id"] in seen_taxpayer_ids:
                skipped += 1
                continue
            seen_taxpayer_ids.add(customer_data["taxpayer_id"])

            if customer_data["payment_method"] == "credit":
                if not customer_data["current_card_token"] or not customer_data["current_card_expiry"]:
                    errors.append(f"Row {idx}: Missing card token or expiry for credit customer")
                    continue

            existing = (
                db.query(Customer)
                .filter(Customer.taxpayer_id == customer_data["taxpayer_id"])
                .first()
            )
            if existing:
                if skip_duplicates:
                    skipped += 1
                    continue
                errors.append(f"Row {idx}: Taxpayer ID {customer_data['taxpayer_id']} already exists")
                continue

            db_customer = Customer(**customer_data)
            db.add(db_customer)
            created += 1

        db.commit()
    except Exception as exc:
        db.rollback()
        errors.append(f"Database error: {exc}")
    finally:
        db.close()

    return created, skipped, errors


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python import_customers_from_csv.py <input.csv> [--no-skip-duplicates]")
        return 1

    input_path = Path(sys.argv[1]).expanduser()
    skip_duplicates = "--no-skip-duplicates" not in sys.argv[2:]

    csv_text = read_text_with_fallbacks(input_path)
    created, skipped, errors = import_customers(csv_text, skip_duplicates=skip_duplicates)

    print(f"Created {created} customers")
    print(f"Skipped {skipped} customers")
    if errors:
        print("Errors:")
        for error in errors[:50]:
            print(f"- {error}")

    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
