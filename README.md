# Tax Billing Management System

A web-based application for managing monthly tax billing, automating batch credit card charges, and tracking payment status throughout the fiscal year.

## Features

- **Customer Management**: Add, edit, and track customer information including payment details
- **Monthly Billing Dashboard**: Visual overview of payment status for all customers across 12 months
- **Batch Operations**: Generate CSV files for batch credit card charging and process result files
- **Failed Charge Tracking**: Monitor and manage failed payments with error code descriptions
- **Card History**: Track old credit card tokens for refund purposes
- **Automated Processing**: CSV file generation and result parsing

## Technology Stack

### Backend
- Python 3.9+
- FastAPI (REST API framework)
- SQLAlchemy (ORM)
- SQLite (Database)

### Frontend
- React 18
- Vite (Build tool)
- TailwindCSS (Styling)
- React Router (Navigation)
- Axios (HTTP client)

## Project Structure

```
dad_test/
├── backend/
│   ├── app/
│   │   ├── models/          # Database models
│   │   ├── routes/          # API endpoints
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   ├── database.py      # Database configuration
│   │   ├── init_db.py       # Database initialization
│   │   └── main.py          # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── billing.db          # SQLite database (created on first run)
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── package.json        # Node dependencies
│   └── vite.config.js      # Vite configuration
└── README.md
```

## Local Development Setup

### Prerequisites

- Python 3.9 or higher
- Node.js 18 or higher
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Initialize the database:
```bash
python -m app.init_db
```

5. Start the backend server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
API documentation (Swagger UI) will be available at `http://localhost:8000/docs`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage

### 1. Add Customers

- Navigate to the "Customers" page
- Click "Add Customer"
- Fill in all required information:
  - Taxpayer ID
  - Payee Name
  - Address
  - Monthly Amount
  - Card Token (provided by your credit card processor)
  - Card Expiry (format: MMYY, e.g., 1225 for December 2025)
- Click "Create"

### 2. Generate Batch Charge File

- Navigate to "Batch Operations"
- Select the month and year for charging
- Click "Generate & Download"
- The CSV file will be downloaded automatically
- Submit this file to your credit card processor

### 3. Upload Result File

- Once you receive the result file from the credit card processor
- Navigate to "Batch Operations"
- Select the result CSV file
- Click "Upload & Process"
- The system will automatically update all charge statuses

### 4. Review Failed Charges

- Navigate to "Failed Charges"
- Review any failed payments
- See error codes with descriptions
- Add notes and mark as "Contacted" when following up with customers

### 5. View Dashboard

- The main dashboard shows a year-at-a-glance view
- Green badges indicate successful payments
- Red badges indicate failed payments
- Yellow badges indicate pending charges
- Running totals are shown for each customer

## CSV File Formats

### Batch Charge File (Generated)
```csv
TranzilaTK,expdate,currency,sum,tranmode,cred_type
p58dc33be42d29d6571,830,1,150,A,1
```

### Result File (Uploaded)
```csv
TranzilaTK,expdate,currency,sum,tranmode,cred_type,response,index,confirmation_code,TranzilaTK
p58dc33be42d29d6571,830,1,150,A,1,0,681460,300921,
```

## Error Codes

Common response codes:
- `0`: Success
- `2`: Card declined by issuer
- `4`: Card expired
- `15`: Invalid card number
- `20014`: Invalid token or card not found
- `51`: Insufficient funds
- `54`: Card expired

See the "Failed Charges" page for full descriptions.

## Deployment to Digital Ocean

### Prerequisites

- Ubuntu 20.04 or 22.04 server
- Root or sudo access
- Domain name (optional, but recommended)

### Deployment Steps

1. **Update system and install dependencies**:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install python3-pip python3-venv nginx nodejs npm git -y
```

2. **Clone or upload your project**:
```bash
cd /var/www
sudo git clone <your-repo-url> billing
# Or upload files via SCP/SFTP
sudo chown -R $USER:$USER /var/www/billing
```

3. **Setup Backend**:
```bash
cd /var/www/billing/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m app.init_db
deactivate
```

4. **Create systemd service for backend**:
```bash
sudo nano /etc/systemd/system/billing-api.service
```

Add the following content:
```ini
[Unit]
Description=Billing Management API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/billing/backend
Environment="PATH=/var/www/billing/backend/venv/bin"
ExecStart=/var/www/billing/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable billing-api
sudo systemctl start billing-api
sudo systemctl status billing-api
```

5. **Build Frontend**:
```bash
cd /var/www/billing/frontend
npm install
npm run build
```

6. **Configure Nginx**:
```bash
sudo nano /etc/nginx/sites-available/billing
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    # Frontend
    location / {
        root /var/www/billing/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API docs
    location /docs {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/billing /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

7. **Configure Firewall**:
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

8. **Optional: Setup SSL with Let's Encrypt**:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

### Post-Deployment

1. Access your application at `http://your-domain.com` or `http://your-server-ip`
2. Test all functionality
3. Set up regular backups of the SQLite database at `/var/www/billing/backend/billing.db`

### Updating the Application

```bash
cd /var/www/billing
git pull  # or upload new files

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
deactivate
sudo systemctl restart billing-api

# Update frontend
cd ../frontend
npm install
npm run build
sudo systemctl reload nginx
```

### Maintenance

**View API logs**:
```bash
sudo journalctl -u billing-api -f
```

**Backup database**:
```bash
sudo cp /var/www/billing/backend/billing.db /var/backups/billing-$(date +%Y%m%d).db
```

**Restart services**:
```bash
sudo systemctl restart billing-api
sudo systemctl restart nginx
```

## Troubleshooting

### Backend not starting
- Check logs: `sudo journalctl -u billing-api -n 50`
- Verify Python dependencies: `pip list`
- Check database permissions

### Frontend not loading
- Ensure frontend was built: `npm run build`
- Check Nginx configuration: `sudo nginx -t`
- View Nginx error log: `sudo tail -f /var/log/nginx/error.log`

### API not accessible
- Verify backend is running: `sudo systemctl status billing-api`
- Check if port 8000 is in use: `sudo lsof -i :8000`
- Test API directly: `curl http://localhost:8000/health`

## Security Considerations

1. **Change default ports** if deploying on shared hosting
2. **Set up SSL/TLS** for production (use Let's Encrypt)
3. **Regular backups** of the database
4. **Limit API access** with firewall rules if needed
5. **Keep dependencies updated** regularly

## Support

For issues or questions, refer to the API documentation at `/docs` endpoint.

## License

Proprietary - All rights reserved


# branch-davidians
