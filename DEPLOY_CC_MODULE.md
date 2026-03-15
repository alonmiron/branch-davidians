# Credit Card Payments Module – Deployment & Operations

## First-Time Setup on Ubuntu

### 1. File archive storage directory

The module saves every exported batch file and imported result file to disk at:
```
/var/www/billing/backend/cc_archives/
```
Create it and set ownership:
```bash
mkdir -p /var/www/billing/backend/cc_archives
chown -R www-data:www-data /var/www/billing/backend/cc_archives
```
Override the path via environment variable if needed:
```bash
export FILES_STORAGE_PATH=/your/custom/path
```

### 2. Import initial residents from Hogla_Tax_Sheets.csv

Copy the CSV to the server then run the one-time import script:
```bash
cd /var/www/billing/backend
source venv/bin/activate
python import_cc_residents.py /path/to/Hogla_Tax_Sheets.csv
```
This creates all resident records and imports the 2025 historical monthly entries.

### 3. Set SMTP credentials

The monthly batch email is sent to `dmiron@gmail.com`.
Set these environment variables in the systemd service file (or in a `.env` sourced by the service):
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_gmail@gmail.com
CC_REPORT_EMAIL=dmiron@gmail.com
```

### 4. Install `requests` for the cron job script

```bash
source venv/bin/activate
pip install requests
```

---

## Monthly Automation – First Day of Each Month

### Option A: cron (simplest)

Edit crontab for the service user:
```bash
sudo crontab -u www-data -e
```
Add this line (runs at 06:00 on the 1st of every month):
```
0 6 1 * * /var/www/billing/backend/venv/bin/python /var/www/billing/backend/monthly_batch_job.py >> /var/log/billing-monthly.log 2>&1
```

### Option B: systemd timer (recommended for Ubuntu 20+)

Create `/etc/systemd/system/billing-monthly.service`:
```ini
[Unit]
Description=Hogla Monthly CC Batch Job
After=network.target billing-api.service

[Service]
Type=oneshot
User=www-data
WorkingDirectory=/var/www/billing/backend
Environment="PATH=/var/www/billing/backend/venv/bin"
ExecStart=/var/www/billing/backend/venv/bin/python monthly_batch_job.py
StandardOutput=journal
StandardError=journal
```

Create `/etc/systemd/system/billing-monthly.timer`:
```ini
[Unit]
Description=Run Hogla Monthly CC Batch on the 1st of each month

[Timer]
OnCalendar=*-*-01 06:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable billing-monthly.timer
sudo systemctl start billing-monthly.timer
sudo systemctl status billing-monthly.timer
```

Check the last run:
```bash
sudo journalctl -u billing-monthly.service -n 50
```

---

## What the monthly job does

1. Calls the API endpoint `POST /api/cc/payments/generate-batch-and-email` with the current month and year.
2. The API:
   - Generates the Tranzila-format CSV (`ttxhogla-MonthName-YYYY.csv`).
   - Saves the file to `/var/www/billing/backend/cc_archives/` and records it in the database.
   - Creates `pending` monthly ledger entries for all active residents.
   - Emails the CSV as an attachment to `dmiron@gmail.com`.
3. Returns a summary with archive ID, resident count, and email send status.

---

## After receiving the processor result file

1. Log into the Hogla Tax Management platform.
2. Navigate to **CC Payments**.
3. In the **Upload Processor Result File** panel, select the correct month and year, choose the CSV file, and click **Upload & Process**.
4. The system will:
   - Archive the result file on disk and in the database.
   - Update each resident's monthly ledger entry with the actual payment result.
   - Update `current_debt` for residents with failed charges (codes 1, 2, 3, 4).
   - Mark response-code-0 entries as successful and reduce debt if the charge included prior debt.

---

## Legal archive

All files are stored in `/var/www/billing/backend/cc_archives/` **and** in the database (`cc_file_archives` table).

View/download any archived file through the **Archive** page in the platform.

Back up the archive directory and the database regularly:
```bash
# Database
cp /var/www/billing/backend/billing.db /var/backups/billing-$(date +%Y%m%d).db

# File archives
tar -czf /var/backups/cc_archives-$(date +%Y%m%d).tar.gz \
    /var/www/billing/backend/cc_archives/
```
