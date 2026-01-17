import csv
import sys
from pathlib import Path


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
}

OUTPUT_HEADERS = [
    "taxpayer_id",
    "payee_name",
    "address",
    "monthly_amount",
    "payment_method",
    "current_card_token",
    "current_card_expiry",
    "landlord_name",
    "phone_number",
    "email",
]


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


def convert_rows(csv_text: str) -> tuple[list[dict], int]:
    reader = csv.DictReader(csv_text.splitlines())
    output_rows: list[dict] = []
    skipped = 0

    for row in reader:
        taxpayer_id = pick_value(row, SOURCE_HEADERS["taxpayer_id"])
        payee_name = pick_value(row, SOURCE_HEADERS["payee_name"])

        if not taxpayer_id or not payee_name:
            skipped += 1
            continue

        address = pick_value(row, SOURCE_HEADERS["address"]) or "Unknown"
        landlord_name = pick_value(row, SOURCE_HEADERS["landlord_name"]) or ""
        monthly_amount = pick_value(row, SOURCE_HEADERS["monthly_amount"]) or "0"
        token = pick_value(row, SOURCE_HEADERS["current_card_token"])
        expiry_raw = pick_value(row, SOURCE_HEADERS["current_card_expiry"])
        expiry = normalize_expiry(expiry_raw)

        payment_method = "credit" if token else "cash"

        output_rows.append(
            {
                "taxpayer_id": taxpayer_id,
                "payee_name": payee_name,
                "address": address,
                "monthly_amount": monthly_amount,
                "payment_method": payment_method,
                "current_card_token": token or "",
                "current_card_expiry": expiry or "",
                "landlord_name": landlord_name or "",
                "phone_number": "",
                "email": "",
            }
        )

    return output_rows, skipped


def write_csv(path: Path, rows: list[dict]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=OUTPUT_HEADERS)
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python convert_sheet_csv.py <input.csv> [output.csv]")
        return 1

    input_path = Path(sys.argv[1]).expanduser()
    output_path = (
        Path(sys.argv[2]).expanduser()
        if len(sys.argv) > 2
        else input_path.with_name("customers_import.csv")
    )

    csv_text = read_text_with_fallbacks(input_path)
    rows, skipped = convert_rows(csv_text)
    write_csv(output_path, rows)

    print(f"Wrote {len(rows)} rows to {output_path}")
    if skipped:
        print(f"Skipped {skipped} rows missing taxpayer_id or payee_name")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
