from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.customer import Customer
from app.models.monthly_charge import MonthlyCharge, ChargeStatus
from app.models.batch_file import BatchFile
from app.schemas.charge import ChargeResponse, BatchGenerateRequest, UploadResultResponse, ChargeUpdateNotes
from app.services.csv_service import generate_batch_csv, process_result_csv
import io

router = APIRouter()

@router.get("", response_model=List[ChargeResponse])
def get_charges(
    year: Optional[int] = None,
    month: Optional[int] = None,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get charges with optional filters"""
    query = db.query(MonthlyCharge)
    
    if year:
        query = query.filter(MonthlyCharge.year == year)
    if month:
        query = query.filter(MonthlyCharge.month == month)
    if customer_id:
        query = query.filter(MonthlyCharge.customer_id == customer_id)
    
    charges = query.all()
    return charges

@router.get("/failed", response_model=List[ChargeResponse])
def get_failed_charges(year: Optional[int] = None, db: Session = Depends(get_db)):
    """Get all failed charges"""
    query = db.query(MonthlyCharge).filter(MonthlyCharge.status == ChargeStatus.FAILED)
    
    if year:
        query = query.filter(MonthlyCharge.year == year)
    
    charges = query.order_by(MonthlyCharge.created_at.desc()).all()
    return charges

@router.post("/generate-batch")
def generate_batch(request: BatchGenerateRequest, db: Session = Depends(get_db)):
    """Generate batch CSV file for charging"""
    # Get customers to charge
    query = db.query(Customer)
    if request.customer_ids:
        query = query.filter(Customer.id.in_(request.customer_ids))
    customers = query.all()
    
    if not customers:
        raise HTTPException(status_code=404, detail="No customers found")
    
    # Create or update pending charges
    for customer in customers:
        # Check if charge already exists
        existing_charge = db.query(MonthlyCharge).filter(
            MonthlyCharge.customer_id == customer.id,
            MonthlyCharge.month == request.month,
            MonthlyCharge.year == request.year
        ).first()
        
        if not existing_charge:
            charge = MonthlyCharge(
                customer_id=customer.id,
                month=request.month,
                year=request.year,
                amount=customer.monthly_amount,
                status=ChargeStatus.PENDING
            )
            db.add(charge)
    
    db.commit()
    
    # Generate CSV
    csv_content = generate_batch_csv(customers)
    
    # Save batch file record
    batch_file = BatchFile(
        filename=f"batch_{request.year}_{request.month:02d}.csv",
        file_type="batch",
        file_content=csv_content
    )
    db.add(batch_file)
    db.commit()
    
    # Return CSV as downloadable file
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=batch_{request.year}_{request.month:02d}.csv"}
    )

@router.post("/upload-results", response_model=UploadResultResponse)
async def upload_results(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload and process result CSV file"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    # Read file content
    content = await file.read()
    csv_content = content.decode('utf-8')
    
    # Save the result file
    batch_file = BatchFile(
        filename=file.filename,
        file_type="result",
        file_content=csv_content
    )
    db.add(batch_file)
    db.commit()
    
    # Process the CSV
    result = process_result_csv(csv_content, db)
    
    # Mark batch file as processed
    batch_file.processed = 1
    db.commit()
    
    return result

@router.put("/{charge_id}/notes", response_model=ChargeResponse)
def update_charge_notes(charge_id: int, notes_update: ChargeUpdateNotes, db: Session = Depends(get_db)):
    """Update notes for a charge"""
    charge = db.query(MonthlyCharge).filter(MonthlyCharge.id == charge_id).first()
    if not charge:
        raise HTTPException(status_code=404, detail="Charge not found")
    
    charge.notes = notes_update.notes
    if notes_update.contacted is not None:
        charge.contacted = notes_update.contacted
    
    db.commit()
    db.refresh(charge)
    return charge



