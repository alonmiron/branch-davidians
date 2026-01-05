# Manual Payment System - Testing Guide

## System Overview

The manual payment system has been successfully implemented with the following features:

### Backend Features
✅ User authentication with JWT tokens
✅ Role-based access control (admin, payment_clerk)
✅ Manual payment tracking (cash and check)
✅ Enhanced customer model with phone/email and payment methods
✅ PDF/CSV import capability for bulk customer data
✅ Complete REST API with proper authorization

### Frontend Features
✅ Login page with authentication
✅ Protected routes
✅ Manual payment recording form
✅ Payment history view with filters
✅ Enhanced customer form with new fields
✅ CSV export functionality
✅ Role-based UI elements

## Testing Steps

### 1. Start the Backend Server

```bash
cd /Users/alonmiron/dad_test/backend
source venv/bin/activate  # or: . venv/bin/activate
uvicorn app.main:app --reload
```

The backend will be available at: http://localhost:8000

### 2. Start the Frontend Server

```bash
cd /Users/alonmiron/dad_test/frontend
npm run dev
```

The frontend will be available at: http://localhost:5173

### 3. Login to the System

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

**Important:** Change this password immediately in production!

### 4. Test Manual Payment Recording

#### A. Record Cash Payment for Existing Customer

1. Navigate to "Manual Payments" in the navigation
2. Click "Record Payment"
3. Select an existing customer from the dropdown
4. Choose "Cash" as payment type
5. Enter amount (e.g., 150)
6. Payment date should auto-fill to today
7. Optionally add notes
8. Click "Record Payment"
9. Verify the payment appears in the table

#### B. Record Check Payment with New Customer

1. Click "Record Payment"
2. Click "Create New Customer" toggle
3. Fill in new customer details:
   - Taxpayer ID: (e.g., 9000001)
   - Name: (e.g., Test Customer)
   - Address: (e.g., 123 Test St)
   - Phone: (optional)
   - Email: (optional)
   - Monthly Amount: (e.g., 200)
4. Select "Check" as payment type
5. Enter amount and check number
6. Click "Record Payment"
7. Verify both the customer and payment were created

### 5. Test Payment Filters

1. On the Manual Payments page, use the filters:
   - Filter by Payment Type (Cash/Check)
   - Filter by Date Range
2. Click "Clear Filters" to reset
3. Verify filtering works correctly

### 6. Test Customer Management

1. Navigate to "Customers"
2. Click "Add Customer"
3. Fill in customer details:
   - Required fields: Taxpayer ID, Name, Address, Monthly Amount
   - New fields: Phone, Email, Payment Method
4. If Payment Method = "Credit":
   - Card Token and Expiry are required
5. If Payment Method = "Cash" or "Check":
   - Card fields are hidden
6. Create the customer and verify it appears in the list

### 7. Test Admin vs Payment Clerk Permissions

#### Create a Payment Clerk User (as admin):
```bash
# Using API or through future admin panel
curl -X POST http://localhost:8000/api/auth/register \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "clerk1",
    "password": "clerk123",
    "full_name": "Payment Clerk",
    "role": "payment_clerk"
  }'
```

#### Test Permissions:
- **Payment Clerk** can:
  - View all payments
  - Record new payments
  - Create customers
  - View payment history

- **Payment Clerk** cannot:
  - Delete payments (button should not appear)
  - Update payments
  - Manage users

- **Admin** can:
  - Do everything a clerk can do
  - Delete payments
  - Update payments
  - Manage users

### 8. Test CSV Export

1. On Manual Payments page, add several test payments
2. Click "Export CSV" button
3. Verify CSV file downloads with correct data
4. Open in spreadsheet software to verify format

### 9. Test Payment History by Customer

1. Go to Customers page
2. View a specific customer's details
3. Their payment history should be visible
4. Verify all manual payments for that customer are shown

### 10. API Testing (Optional)

Use curl or Postman to test the API directly:

#### Get Access Token:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

#### Get All Manual Payments:
```bash
curl -X GET http://localhost:8000/api/manual-payments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create Manual Payment:
```bash
curl -X POST http://localhost:8000/api/manual-payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "payment_type": "cash",
    "amount": 150.00,
    "payment_date": "2025-01-04T12:00:00Z",
    "notes": "January payment"
  }'
```

## Verification Checklist

- [ ] Backend server starts without errors
- [ ] Frontend server starts without errors
- [ ] Login works with default credentials
- [ ] Can view Manual Payments page
- [ ] Can record cash payment for existing customer
- [ ] Can record check payment with check number
- [ ] Can create new customer through payment form
- [ ] Payment filters work correctly
- [ ] Enhanced customer form shows new fields (phone, email, payment method)
- [ ] Card fields hide/show based on payment method
- [ ] CSV export works
- [ ] Payment history displays correctly
- [ ] User info and role display in header
- [ ] Logout works
- [ ] Protected routes redirect to login when not authenticated
- [ ] Visual distinction between cash and check payments (colored badges)
- [ ] Admin can delete payments
- [ ] Recorded by name shows in payment table

## Database Schema Verification

Check that migrations applied correctly:

```bash
cd /Users/alonmiron/dad_test/backend
sqlite3 billing.db

# In SQLite:
.schema customers
.schema users
.schema manual_payments
```

Expected new columns in `customers`:
- phone_number
- email
- payment_method

Expected new tables:
- users
- manual_payments

## Troubleshooting

### Backend Issues

1. **Import errors**: Make sure all dependencies are installed:
   ```bash
   pip install -r requirements.txt
   ```

2. **Database errors**: Run migration script again:
   ```bash
   python app/migrations/add_manual_payments.py
   ```

3. **Authentication errors**: Check JWT token in browser DevTools > Application > Local Storage

### Frontend Issues

1. **Login not working**: Check browser console for errors
2. **API calls failing**: Verify backend is running on port 8000
3. **CORS errors**: Check CORS middleware in backend/app/main.py

## Next Steps

After testing is complete:

1. **Change default admin password**
2. **Set up proper environment variables** for SECRET_KEY
3. **Add more users** as needed (admins and clerks)
4. **Import customer data** using the PDF/CSV import feature
5. **Configure production settings** before deployment

## API Documentation

Full API documentation is available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Support

For issues or questions:
1. Check the console logs (backend and frontend)
2. Review the API documentation
3. Check authentication token validity
4. Verify database schema matches expected structure


