# Testing Guide

## Running the Application

### Quick Start (Recommended for First Time)

```bash
./start.sh
```

This will automatically:
- Set up the backend environment
- Install all dependencies
- Initialize the database with error codes
- Start both servers

### Access Points

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## Manual Testing Workflow

### 1. Initialize Database with Sample Data

```bash
cd backend
source venv/bin/activate
python -m app.seed_data
```

This will add 5 sample customers to test with.

### 2. Test Customer Management

**Add a Customer**:
1. Go to http://localhost:5173/customers
2. Click "Add Customer"
3. Fill in the form:
   - Taxpayer ID: 7080500
   - Payee Name: Test User
   - Address: 123 Test St
   - Monthly Amount: 200
   - Card Token: test123token456789
   - Card Expiry: 1225
4. Click "Create"
5. Verify customer appears in the list

**Edit a Customer**:
1. Click "Edit" on any customer
2. Change the monthly amount
3. Click "Update"
4. Verify changes are saved

**Delete a Customer**:
1. Click "Delete" on a test customer
2. Confirm deletion
3. Verify customer is removed

### 3. Test Batch File Generation

**Generate Batch File**:
1. Go to http://localhost:5173/batch
2. Select current month and year
3. Click "Generate & Download"
4. Verify CSV file downloads with format:
   ```csv
   TranzilaTK,expdate,currency,sum,tranmode,cred_type
   p58dc33be42d29d6571,830,1,150,A,1
   ```

### 4. Test Result File Upload

**Create a Test Result File**:

Create a file named `test_result.csv` with this content:
```csv
TranzilaTK,expdate,currency,sum,tranmode,cred_type,response,index,confirmation_code,TranzilaTK
p58dc33be42d29d6571,830,1,150,A,1,0,681460,300921,
I33ef8f9cc0800c4446,1126,1,450,A,1,0,681462,75293,
z25ed5a8a796bdf0692,1026,1,150,A,1,2,681478,0,
```

**Upload Result File**:
1. Go to http://localhost:5173/batch
2. Click "Choose File" and select `test_result.csv`
3. Click "Upload & Process"
4. Verify success message shows:
   - Total processed: 3
   - Successful: 2
   - Failed: 1

### 5. Test Dashboard View

**View Billing Dashboard**:
1. Go to http://localhost:5173/
2. Verify you see:
   - List of all customers
   - 12 month columns (Jan-Dec)
   - Color-coded payment status
   - Running totals per customer
3. Change the year dropdown
4. Verify data updates for selected year

### 6. Test Failed Charges Management

**View Failed Charges**:
1. Go to http://localhost:5173/failed
2. Verify failed charges from the uploaded result file appear
3. Check that error code is displayed (e.g., "2")
4. Check that error description appears (e.g., "Card declined by issuer")

**Add Notes to Failed Charge**:
1. Click "Edit" on a failed charge
2. Add note: "Called customer, waiting for new card"
3. Check "Contacted" checkbox
4. Click "Save"
5. Verify notes are saved and status shows "Contacted"

### 7. Test Card History

**View Card History**:
1. Go to http://localhost:5173/customers
2. Click "History" on any customer
3. Modal should show previous card tokens (if any)
4. Close modal

**Test Card Replacement**:
1. Edit a customer
2. Change the card token to a new value
3. Change card expiry date
4. Save changes
5. Click "History" on that customer
6. Verify old card token is now in history

## API Testing

### Using Swagger UI

1. Open http://localhost:8000/docs
2. Test endpoints directly from the interactive documentation

### Using curl

**Get all customers**:
```bash
curl http://localhost:8000/api/customers
```

**Create a customer**:
```bash
curl -X POST http://localhost:8000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "taxpayer_id": "TEST001",
    "address": "123 Test St",
    "payee_name": "Test Customer",
    "monthly_amount": 150,
    "current_card_token": "testtoken123",
    "current_card_expiry": "1225"
  }'
```

**Get charges for a year**:
```bash
curl "http://localhost:8000/api/charges?year=2025"
```

**Get error codes**:
```bash
curl http://localhost:8000/api/error-codes
```

## Database Inspection

### View Database Contents

```bash
cd backend
sqlite3 billing.db
```

**Useful SQLite commands**:
```sql
-- List all tables
.tables

-- View customers
SELECT * FROM customers;

-- View charges
SELECT * FROM monthly_charges;

-- View error codes
SELECT * FROM error_codes;

-- View card history
SELECT * FROM card_history;

-- Exit SQLite
.quit
```

## Common Test Scenarios

### Scenario 1: Full Monthly Billing Cycle

1. **Month Start**: Add new customers or update existing ones
2. **Mid-Month**: Generate batch file for current month
3. **After Processing**: Upload result file
4. **Review**: Check failed charges and contact customers
5. **Update**: Change card tokens for failed customers
6. **Retry**: Generate new batch file for failed charges only

### Scenario 2: Customer Card Update

1. Customer calls about failed charge
2. Navigate to Failed Charges page
3. Add note about conversation
4. Mark as "Contacted"
5. Go to Customers page
6. Edit customer and update card token
7. Verify old token is saved in history
8. Generate new batch for that customer

### Scenario 3: Year-End Review

1. Navigate to Dashboard
2. Select the year
3. Review all customer payment statuses
4. Export data if needed
5. Identify customers with outstanding payments

## Performance Testing

### Load Testing

Test with many customers:
```bash
cd backend
source venv/bin/activate
python -c "
from app.database import SessionLocal
from app.models import Customer
from decimal import Decimal

db = SessionLocal()
for i in range(100):
    customer = Customer(
        taxpayer_id=f'PERF{i:04d}',
        address=f'{i} Test Street',
        payee_name=f'Customer {i}',
        monthly_amount=Decimal('150.00'),
        current_card_token=f'token{i:010d}',
        current_card_expiry='1225'
    )
    db.add(customer)
db.commit()
print('Added 100 test customers')
"
```

## Troubleshooting Tests

### Frontend not connecting to backend

**Check**:
```bash
# Verify backend is running
curl http://localhost:8000/health

# Check browser console for errors
# Open DevTools (F12) → Console tab
```

### CSV file not downloading

**Check**:
- Browser popup blocker settings
- Console for errors
- Network tab in DevTools

### Database locked error

**Fix**:
```bash
# Stop all processes using the database
cd backend
fuser billing.db  # Linux/Mac
# Kill any processes
# Restart backend
```

### Upload not processing

**Check**:
- File format is correct CSV
- File encoding is UTF-8
- No extra empty lines
- Headers match expected format

## Clean Up After Testing

### Reset Database

```bash
cd backend
rm billing.db
python -m app.init_db
python -m app.seed_data  # Optional: add sample data
```

### Clear All Data

```bash
cd backend
source venv/bin/activate
python -c "
from app.database import SessionLocal, engine, Base
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
print('Database reset')
"
python -m app.init_db
```

## Success Criteria

Your system is working correctly if:

- ✅ You can add, edit, and delete customers
- ✅ Dashboard shows all customers with monthly status
- ✅ Batch CSV files generate with correct format
- ✅ Result file upload updates charge statuses
- ✅ Failed charges appear with error descriptions
- ✅ Notes can be added to failed charges
- ✅ Card history tracks old tokens
- ✅ All pages load without errors
- ✅ API documentation is accessible

## Next Steps

Once local testing is complete:
1. Review the README.md for deployment instructions
2. Prepare your Digital Ocean droplet
3. Run the deployment script
4. Test in production environment



