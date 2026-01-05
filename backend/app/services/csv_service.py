import csv
import io
from typing import List
from sqlalchemy.orm import Session
from app.models.customer import Customer
from app.models.monthly_charge import MonthlyCharge, ChargeStatus

def generate_batch_csv(customers: List[Customer]) -> str:
    """
    Generate batch CSV file for credit card charging
    Format: TranzilaTK,expdate,currency,sum,tranmode,cred_type
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(['TranzilaTK', 'expdate', 'currency', 'sum', 'tranmode', 'cred_type'])
    
    # Write customer data
    for customer in customers:
        writer.writerow([
            customer.current_card_token,
            customer.current_card_expiry,
            customer.currency,
            int(customer.monthly_amount),  # Convert to integer as shown in sample
            customer.tranmode,
            customer.cred_type
        ])
    
    return output.getvalue()

def process_result_csv(csv_content: str, db: Session) -> dict:
    """
    Process result CSV file and update charges
    Format: TranzilaTK,expdate,currency,sum,tranmode,cred_type,response,index,confirmation_code,TranzilaTK
    """
    reader = csv.DictReader(io.StringIO(csv_content))
    
    total_processed = 0
    successful = 0
    failed = 0
    errors = []
    
    for row in reader:
        try:
            token = row['TranzilaTK']
            response_code = row.get('response', '')
            index_number = row.get('index', '')
            confirmation_code = row.get('confirmation_code', '')
            
            # Skip empty rows
            if not token:
                continue
            
            # Find customer by token
            customer = db.query(Customer).filter(
                Customer.current_card_token == token
            ).first()
            
            if not customer:
                errors.append(f"Customer not found for token: {token}")
                continue
            
            # Find the most recent pending charge for this customer
            charge = db.query(MonthlyCharge).filter(
                MonthlyCharge.customer_id == customer.id,
                MonthlyCharge.status == ChargeStatus.PENDING
            ).order_by(MonthlyCharge.created_at.desc()).first()
            
            if not charge:
                errors.append(f"No pending charge found for customer: {customer.payee_name}")
                continue
            
            # Update charge based on response code
            charge.response_code = int(response_code) if response_code else None
            charge.index_number = index_number
            charge.confirmation_code = confirmation_code if confirmation_code else None
            
            # Response code 0 means success
            if response_code == '0':
                charge.status = ChargeStatus.SUCCESS
                successful += 1
            # Response code 20014 means invalid token (no charge made)
            elif response_code == '20014':
                charge.status = ChargeStatus.FAILED
                charge.error_code = response_code
                failed += 1
            else:
                charge.status = ChargeStatus.FAILED
                charge.error_code = response_code
                failed += 1
            
            total_processed += 1
            
        except Exception as e:
            errors.append(f"Error processing row: {str(e)}")
    
    db.commit()
    
    return {
        "total_processed": total_processed,
        "successful": successful,
        "failed": failed,
        "errors": errors
    }



