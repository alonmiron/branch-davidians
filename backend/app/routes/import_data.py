from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.customer import Customer
from app.models.user import User
from app.services.auth_service import require_admin
from app.services.pdf_import_service import (
    parse_pdf_table_data,
    parse_csv_customer_data,
    validate_customer_data
)
from app.schemas.customer import CustomerResponse
from pydantic import BaseModel

router = APIRouter()

class ImportPreviewResponse(BaseModel):
    total_rows: int
    valid_rows: int
    errors: List[str]
    preview: List[dict]

class BulkImportRequest(BaseModel):
    customers: List[dict]
    skip_duplicates: bool = True

class BulkImportResponse(BaseModel):
    created: int
    skipped: int
    errors: List[str]

@router.post("/pdf", response_model=ImportPreviewResponse)
async def upload_pdf_for_preview(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Upload and parse PDF file to preview customer data before importing.
    Admin only.
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    try:
        # Read file content
        content = await file.read()
        
        # Parse PDF
        customers = parse_pdf_table_data(content)
        
        # Validate data
        valid_customers, errors = validate_customer_data(customers)
        
        # Return preview (first 20 rows)
        return {
            "total_rows": len(customers),
            "valid_rows": len(valid_customers),
            "errors": errors[:50],  # Limit errors shown
            "preview": valid_customers[:20]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing PDF: {str(e)}")

@router.post("/csv", response_model=ImportPreviewResponse)
async def upload_csv_for_preview(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Upload and parse CSV file to preview customer data before importing.
    Admin only.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        # Read file content
        content = await file.read()
        csv_content = content.decode('utf-8')
        
        # Parse CSV
        customers = parse_csv_customer_data(csv_content)
        
        # Validate data
        valid_customers, errors = validate_customer_data(customers)
        
        # Return preview (first 20 rows)
        return {
            "total_rows": len(customers),
            "valid_rows": len(valid_customers),
            "errors": errors[:50],  # Limit errors shown
            "preview": valid_customers[:20]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing CSV: {str(e)}")

@router.post("/customers", response_model=BulkImportResponse)
def bulk_import_customers(
    import_request: BulkImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Bulk import customers from validated data.
    Admin only.
    """
    created_count = 0
    skipped_count = 0
    errors = []
    
    for idx, customer_data in enumerate(import_request.customers):
        try:
            # Check for existing taxpayer_id
            existing = db.query(Customer).filter(
                Customer.taxpayer_id == customer_data["taxpayer_id"]
            ).first()
            
            if existing:
                if import_request.skip_duplicates:
                    skipped_count += 1
                    continue
                else:
                    errors.append(
                        f"Row {idx + 1}: Taxpayer ID {customer_data['taxpayer_id']} already exists"
                    )
                    continue
            
            # Create customer
            db_customer = Customer(**customer_data)
            db.add(db_customer)
            created_count += 1
            
        except Exception as e:
            errors.append(f"Row {idx + 1}: {str(e)}")
    
    # Commit all changes
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    return {
        "created": created_count,
        "skipped": skipped_count,
        "errors": errors
    }


