# Quick Start Guide - Manual Payment System

## 🚀 Getting Started in 3 Minutes

### 1. Start the Backend (Terminal 1)

```bash
cd /Users/alonmiron/dad_test/backend
source venv/bin/activate  # Already has all dependencies installed
uvicorn app.main:app --reload
```

✅ Backend running at: **http://localhost:8000**

### 2. Start the Frontend (Terminal 2)

```bash
cd /Users/alonmiron/dad_test/frontend
npm run dev
```

✅ Frontend running at: **http://localhost:5173**

### 3. Login

Open your browser to **http://localhost:5173**

**Credentials:**
- Username: `admin`
- Password: `admin123`

### 4. Record Your First Payment

1. Click **"Manual Payments"** in the navigation
2. Click **"Record Payment"**
3. Fill in the form:
   - Select a customer (or create new)
   - Choose Cash or Check
   - Enter amount
   - Add check number if paying by check
   - Click **"Record Payment"**

✅ Done! Your payment is now tracked in the system.

## 📋 What You Can Do

### For All Users
- ✅ Record cash payments
- ✅ Record check payments
- ✅ View payment history
- ✅ Filter payments by type and date
- ✅ Export payments to CSV
- ✅ Create customers with cash/check payment methods

### For Admins Only
- ✅ Delete payments
- ✅ Manage users
- ✅ Import bulk customer data

## 📱 Key Features at a Glance

- **Customer Management**: Add phone, email, and payment method to customers
- **Payment Tracking**: Record and track all manual payments
- **Smart Forms**: Card fields hide for non-credit customers
- **Search & Filter**: Find payments by type, customer, or date range
- **Export**: Download payment history as CSV
- **Secure**: JWT authentication with role-based access

## 🔗 Useful Links

- **API Docs**: http://localhost:8000/docs
- **Full Testing Guide**: See `TESTING_GUIDE.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`

## 🆘 Troubleshooting

**Backend won't start?**
```bash
cd /Users/alonmiron/dad_test/backend
pip install -r requirements.txt
```

**Login not working?**
- Check backend is running on port 8000
- Check browser console for errors
- Try clearing browser cache/localStorage

**Need to reset?**
```bash
cd /Users/alonmiron/dad_test/backend
rm billing.db
python app/migrations/add_manual_payments.py
```

## 📊 Database Schema

Your database now includes:

**customers** table (enhanced):
- ✨ phone_number
- ✨ email  
- ✨ payment_method (credit/cash/check)

**users** table (new):
- User authentication and roles

**manual_payments** table (new):
- All cash and check payment records

## 🎯 Next Steps

1. **Change the default password** (very important!)
2. Add more users if needed
3. Import your customer data using CSV/PDF
4. Start recording payments!

## 📞 Support

All features tested and working! If you encounter issues:
1. Check the console logs
2. Verify both servers are running
3. Check `TESTING_GUIDE.md` for detailed troubleshooting

---

**System Status**: ✅ All features implemented and tested
**Ready for use**: Yes!
**Documentation**: Complete


