from typing import List, Dict, Any
import re
from decimal import Decimal
from io import BytesIO

def parse_pdf_table_data(file_content: bytes) -> List[Dict[str, Any]]:
    """
    Parse the PDF customer data table.
    Based on the provided structure with columns:
    - House/ID number
    - Address info
    - Name
    - Amount
    - Payment tracking columns (S1-S19, etc.)
    
    Note: This is a simplified parser. For production use, consider using
    libraries like pdfplumber or tabula-py for better table extraction.
    """
    try:
        from PyPDF2 import PdfReader
    except ImportError:
        raise ImportError("PyPDF2 is required for PDF parsing")
    
    # Read PDF
    pdf_reader = PdfReader(BytesIO(file_content))
    
    customers = []
    
    # Extract text from all pages
    for page in pdf_reader.pages:
        text = page.extract_text()
        lines = text.split('\n')
        
        # Parse each line looking for customer data
        # Expected format based on the sample:
        # ID | Address Number | Name | Amount | Token/ID | ... payment columns ...
        for line in lines:
            # Skip header lines and empty lines
            if not line.strip() or 'בית' in line or 'גישור' in line:
                continue
            
            # Split by whitespace/delimiters
            parts = re.split(r'\s+\|\s+|\s{2,}', line.strip())
            
            if len(parts) >= 4:
                try:
                    # Extract basic customer info
                    # Format: [ID, House#, Name, Amount, ...]
                    taxpayer_id = parts[0].strip() if len(parts) > 0 else ""
                    address_num = parts[1].strip() if len(parts) > 1 else ""
                    payee_name = parts[2].strip() if len(parts) > 2 else ""
                    amount_str = parts[3].strip() if len(parts) > 3 else "0"
                    
                    # Skip if essential data is missing
                    if not taxpayer_id or not payee_name:
                        continue
                    
                    # Parse amount (handle decimal)
                    try:
                        monthly_amount = Decimal(amount_str)
                    except:
                        monthly_amount = Decimal("0")
                    
                    # Build full address (using address number)
                    address = f"House {address_num}" if address_num else "Unknown Address"
                    
                    customer_data = {
                        "taxpayer_id": taxpayer_id,
                        "payee_name": payee_name,
                        "address": address,
                        "monthly_amount": float(monthly_amount),
                        "payment_method": "cash",  # Default for imported customers
                        "phone_number": None,
                        "email": None,
                        "landlord_name": None,
                        "current_card_token": None,
                        "current_card_expiry": None,
                        "currency": 1,
                        "tranmode": "A",
                        "cred_type": 1
                    }
                    
                    customers.append(customer_data)
                    
                except (ValueError, IndexError) as e:
                    # Skip malformed lines
                    continue
    
    return customers

def parse_csv_customer_data(csv_content: str) -> List[Dict[str, Any]]:
    """
    Alternative parser for CSV format.
    Expected CSV format: taxpayer_id,payee_name,address,monthly_amount,phone,email
    """
    import csv
    from io import StringIO
    
    customers = []
    csv_reader = csv.DictReader(StringIO(csv_content))
    
    for row in csv_reader:
        try:
            customer_data = {
                "taxpayer_id": row.get("taxpayer_id", "").strip(),
                "payee_name": row.get("payee_name", "").strip(),
                "address": row.get("address", "").strip(),
                "monthly_amount": float(row.get("monthly_amount", "0")),
                "payment_method": row.get("payment_method", "cash"),
                "phone_number": row.get("phone_number", row.get("phone", "")).strip() or None,
                "email": row.get("email", "").strip() or None,
                "landlord_name": row.get("landlord_name", "").strip() or None,
                "current_card_token": row.get("current_card_token", "").strip() or None,
                "current_card_expiry": row.get("current_card_expiry", "").strip() or None,
                "currency": int(row.get("currency", "1")),
                "tranmode": row.get("tranmode", "A"),
                "cred_type": int(row.get("cred_type", "1"))
            }
            
            # Skip if essential data is missing
            if not customer_data["taxpayer_id"] or not customer_data["payee_name"]:
                continue
            
            customers.append(customer_data)
        except (ValueError, KeyError) as e:
            # Skip malformed rows
            continue
    
    return customers

def validate_customer_data(customers: List[Dict[str, Any]]) -> tuple[List[Dict[str, Any]], List[str]]:
    """
    Validate customer data and return valid customers and error messages.
    """
    valid_customers = []
    errors = []
    
    for idx, customer in enumerate(customers):
        row_errors = []
        
        # Required fields
        if not customer.get("taxpayer_id"):
            row_errors.append(f"Row {idx + 1}: Missing taxpayer_id")
        if not customer.get("payee_name"):
            row_errors.append(f"Row {idx + 1}: Missing payee_name")
        if not customer.get("address"):
            row_errors.append(f"Row {idx + 1}: Missing address")
        
        # Amount validation
        if customer.get("monthly_amount", 0) < 0:
            row_errors.append(f"Row {idx + 1}: Invalid monthly_amount")
        
        # Payment method validation
        if customer.get("payment_method") not in ["credit", "cash", "check"]:
            row_errors.append(f"Row {idx + 1}: Invalid payment_method")
        
        # Card fields for credit customers
        if customer.get("payment_method") == "credit":
            if not customer.get("current_card_token"):
                row_errors.append(f"Row {idx + 1}: Missing card token for credit customer")
            if not customer.get("current_card_expiry"):
                row_errors.append(f"Row {idx + 1}: Missing card expiry for credit customer")
        
        if row_errors:
            errors.extend(row_errors)
        else:
            valid_customers.append(customer)
    
    return valid_customers, errors


