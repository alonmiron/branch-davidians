# Tax Billing Management System - Project Overview

## What This System Does

This application automates the monthly tax billing process by:
1. Managing customer and payment information
2. Generating CSV files for batch credit card charging
3. Processing charge result files from payment processors
4. Tracking payment status throughout the year
5. Managing failed charges and customer follow-ups

## Key Features

### 1. Customer Management
- Add new customers with payment details
- Edit existing customer information
- Track card history when cards are updated
- Delete customers when needed

### 2. Billing Dashboard
- Visual overview of all customers
- 12-month payment status grid
- Color-coded indicators (Green=Paid, Red=Failed, Yellow=Pending)
- Running totals per customer and per month

### 3. Batch Operations
- Generate CSV files for credit card processor
- Upload and process result files
- Automatic status updates based on results
- Download generated files instantly

### 4. Failed Charge Management
- View all failed payments
- See error codes with descriptions
- Add notes and action items
- Track customer contact status

### 5. Card History
- Maintain old card tokens for refunds
- Track when cards were replaced
- Historical record of all payment methods

## System Architecture

```
┌─────────────────┐
│   Web Browser   │
│  (React App)    │
└────────┬────────┘
         │ HTTP/REST
         ↓
┌─────────────────┐
│  FastAPI Server │
│   (Python)      │
└────────┬────────┘
         │ SQLAlchemy
         ↓
┌─────────────────┐
│ SQLite Database │
│  (billing.db)   │
└─────────────────┘
```

## Technology Choices

### Why FastAPI?
- Modern, fast Python web framework
- Automatic API documentation
- Type checking with Pydantic
- Easy to deploy and maintain

### Why React?
- Component-based architecture
- Fast, interactive UI
- Large ecosystem of tools
- Easy to extend

### Why SQLite?
- No separate database server needed
- Simple file-based storage
- Perfect for single-server deployment
- Easy backups (just copy the file)

### Why TailwindCSS?
- Utility-first CSS framework
- Consistent, modern design
- Responsive out of the box
- Small production bundle

## File Structure Explained

```
dad_test/
│
├── backend/                    # Python API server
│   ├── app/
│   │   ├── models/            # Database table definitions
│   │   ├── routes/            # API endpoint handlers
│   │   ├── schemas/           # Request/response formats
│   │   ├── services/          # Business logic
│   │   ├── database.py        # Database connection
│   │   ├── init_db.py         # Database setup script
│   │   ├── seed_data.py       # Sample data script
│   │   └── main.py            # Application entry point
│   ├── requirements.txt       # Python dependencies
│   └── billing.db            # SQLite database (created at runtime)
│
├── frontend/                  # React web application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Main page views
│   │   ├── services/        # API communication
│   │   ├── App.jsx          # Main application
│   │   └── main.jsx         # Entry point
│   ├── package.json         # Node.js dependencies
│   └── index.html           # HTML template
│
├── start.sh                  # Quick start script
├── deploy.sh                 # Digital Ocean deployment
├── README.md                 # Main documentation
├── QUICKSTART.md            # Getting started guide
├── TESTING.md               # Testing instructions
└── DEPLOYMENT.md            # Deployment checklist
```

## Data Flow

### Adding a Customer
```
User fills form → React validates → 
POST /api/customers → FastAPI validates → 
SQLAlchemy saves → Database stores → 
Response sent → UI updates
```

### Generating Batch File
```
User selects month → POST /api/charges/generate-batch →
Query all customers → Create pending charges →
Generate CSV content → Return as download →
User receives file
```

### Processing Results
```
User uploads CSV → POST /api/charges/upload-results →
Parse CSV file → Match by card token →
Update charge status → Save result file →
Return summary → UI shows results
```

## Database Schema

### customers
- Stores customer information
- Current card token and expiry
- Monthly charge amount

### monthly_charges
- One row per customer per month
- Status: pending/success/failed
- Error codes and confirmation numbers

### card_history
- Tracks old card tokens
- Used for refunds
- Links to customer

### error_codes
- Maps response codes to descriptions
- Pre-populated with common codes

### batch_files
- Stores uploaded result files
- Audit trail of all batches

## API Endpoints

### Customers
- `GET /api/customers` - List all
- `POST /api/customers` - Create new
- `PUT /api/customers/{id}` - Update
- `DELETE /api/customers/{id}` - Delete

### Charges
- `GET /api/charges?year=2025` - Get charges
- `GET /api/charges/failed` - Failed charges
- `POST /api/charges/generate-batch` - Generate CSV
- `POST /api/charges/upload-results` - Upload result
- `PUT /api/charges/{id}/notes` - Update notes

### Other
- `GET /api/error-codes` - All error codes
- `GET /api/card-history/{id}` - Card history

## Security Considerations

1. **No Authentication Built-In**: This is designed for internal use. Add authentication if deploying publicly.

2. **Database Security**: 
   - SQLite file should have restricted permissions
   - Regular backups recommended
   - Not accessible via web

3. **CORS Protection**: 
   - Backend only accepts requests from configured origins
   - Update in production deployment

4. **HTTPS**: 
   - Use SSL certificate in production
   - Let's Encrypt provides free certificates

5. **Input Validation**:
   - FastAPI validates all inputs
   - Pydantic schemas enforce types
   - SQLAlchemy prevents SQL injection

## Scaling Considerations

Current setup is designed for:
- Up to 1000 customers
- Single user or small team
- Light to moderate usage

To scale beyond this:
- Switch from SQLite to PostgreSQL
- Add caching layer (Redis)
- Implement rate limiting
- Add user authentication
- Consider load balancer

## Backup Strategy

**Critical Data**:
- `backend/billing.db` - Main database
- Uploaded result CSV files (stored in database)

**Backup Methods**:
1. Manual: `cp billing.db backup-$(date +%Y%m%d).db`
2. Automated: Daily cron job (see DEPLOYMENT.md)
3. Off-site: Regular uploads to cloud storage

## Monitoring

**What to Monitor**:
- Disk space (database grows over time)
- Memory usage (should be < 500MB)
- API response times
- Error rates in logs
- Backup success

**Tools**:
- System logs: `journalctl -u billing-api`
- Nginx logs: `/var/log/nginx/`
- Resource usage: `htop`

## Common Workflows

### Monthly Billing Cycle
1. Review customer list
2. Generate batch file
3. Submit to credit card processor
4. Wait for results (usually same day)
5. Upload result file
6. Review failed charges
7. Contact affected customers
8. Update cards as needed
9. Generate retry batch if needed

### Handling Failed Charge
1. View in Failed Charges page
2. Check error code description
3. Call customer
4. Add notes about conversation
5. Mark as "Contacted"
6. Get new card information
7. Update customer record
8. Old card saved to history
9. Include in next batch

### Year-End Review
1. Select year in Dashboard
2. Export data if needed
3. Identify outstanding payments
4. Generate annual reports
5. Archive old data if desired

## Performance Tips

1. **Database Size**: SQLite handles millions of rows easily
2. **File Uploads**: Limit CSV file size to < 10MB
3. **Concurrent Users**: Fine for 5-10 simultaneous users
4. **Response Time**: Most operations < 200ms

## Troubleshooting Quick Reference

| Problem | Solution |
|---------|----------|
| Port in use | Kill process: `lsof -ti:8000 \| xargs kill -9` |
| Database locked | Stop backend, restart |
| CSV won't download | Check browser popup blocker |
| Upload fails | Verify CSV format matches expected |
| Dashboard empty | Check year selection, add charges |
| Can't edit customer | Check for database permission errors |

## Next Steps

1. ✅ **Setup Locally**: Follow QUICKSTART.md
2. ✅ **Test Features**: Use TESTING.md guide
3. ✅ **Deploy**: Follow DEPLOYMENT.md checklist
4. ✅ **Go Live**: Start using for monthly billing

## Support and Resources

- **API Documentation**: http://localhost:8000/docs (when running)
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **React Docs**: https://react.dev/
- **Digital Ocean**: https://www.digitalocean.com/community/tutorials

---

**Quick Start**: `./start.sh` then open http://localhost:5173

**Questions?** Check the README.md or TESTING.md files.



