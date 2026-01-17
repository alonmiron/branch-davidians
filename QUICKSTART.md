# Quick Start Guide

## Local Testing - Quick Start

The fastest way to get started:

**macOS/Linux:**
```bash
./start.sh
```

**Windows (PowerShell):**
```powershell
.\start.sh
```

*Note: If `start.sh` doesn't work on Windows, follow the Manual Setup instructions below.*

This will:
1. Set up the backend virtual environment
2. Install all dependencies
3. Initialize the database
4. Start both backend and frontend servers

Then open your browser to:
- **Application**: http://localhost:5173
- **API Documentation**: http://localhost:8000/docs

## Manual Setup

If you prefer to run services separately:

### Terminal 1 - Backend

**macOS/Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m app.init_db
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Windows (PowerShell):**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m app.init_db
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Windows (CMD):**
```cmd
cd backend
python -m venv venv
venv\Scripts\activate.bat
pip install -r requirements.txt
python -m app.init_db
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 - Frontend
```bash
cd frontend
npm install
npm run dev
```

## First Steps

1. **Add a customer**:
   - Go to "Customers" page
   - Click "Add Customer"
   - Fill in the form with test data

2. **Generate a batch file**:
   - Go to "Batch Operations"
   - Select month and year
   - Click "Generate & Download"

3. **View the dashboard**:
   - Go to "Dashboard" to see the billing overview

## Test Data

You can add test customers with these example values:

**Customer 1**:
- Taxpayer ID: 7080324
- Payee Name: Test Customer 1
- Address: 124 Test Street
- Monthly Amount: 150
- Card Token: p58dc33be42d29d6571
- Card Expiry: 830

**Customer 2**:
- Taxpayer ID: 7080314
- Payee Name: Test Customer 2
- Address: 114 Sample Ave
- Monthly Amount: 450
- Card Token: I33ef8f9cc0800c4446
- Card Expiry: 1126

## Troubleshooting

**Port already in use**:

**macOS/Linux:**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

**Windows (PowerShell):**
```powershell
# Kill process on port 8000
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }

# Kill process on port 5173
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

**Windows (CMD):**
```cmd
# Kill process on port 8000
for /f "tokens=5" %a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do taskkill /F /PID %a

# Kill process on port 5173
for /f "tokens=5" %a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do taskkill /F /PID %a
```

**Database issues**:

**macOS/Linux:**
```bash
# Reset database
cd backend
rm billing.db
python -m app.init_db
```

**Windows (PowerShell/CMD):**
```powershell
# Reset database
cd backend
Remove-Item billing.db -ErrorAction SilentlyContinue
python -m app.init_db
```

**Dependencies not installing**:

**macOS/Linux:**
```bash
# Backend
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Windows (PowerShell):**
```powershell
# Backend
cd backend
Remove-Item -Recurse -Force venv -ErrorAction SilentlyContinue
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt

# Frontend
cd frontend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install
```

## Ready for Digital Ocean?

Once you've tested locally and are ready to deploy:

1. Upload your project to your Digital Ocean droplet
2. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

See README.md for detailed deployment instructions.



