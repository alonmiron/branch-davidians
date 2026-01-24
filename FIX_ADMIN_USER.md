# Fix Admin User Issue

If you're getting password errors after deployment, the admin user might not exist in the database. Follow these steps to fix it.

## Quick Fix (Run on Server)

SSH into your Digital Ocean server and run:

```bash
cd /var/www/billing/backend
source venv/bin/activate
python fix_admin_user.py
deactivate
```

This script will:
- Check if the users table exists (create it if missing)
- Check if the admin user exists (create it if missing)
- Show you the default credentials

## Default Credentials

After running the fix script, you can log in with:
- **Username:** `admin`
- **Password:** `admin123`

⚠️ **IMPORTANT:** Change this password immediately after first login!

## Manual Fix (Alternative)

If the script doesn't work, you can manually run the migration:

```bash
cd /var/www/billing/backend
source venv/bin/activate
python app/migrations/add_manual_payments.py
deactivate
```

## Verify the Fix

After running the fix, you can verify the admin user exists:

```bash
cd /var/www/billing/backend
source venv/bin/activate
python -c "
import sqlite3
conn = sqlite3.connect('billing.db')
cursor = conn.cursor()
cursor.execute('SELECT username, full_name, role FROM users WHERE username=\"admin\"')
result = cursor.fetchone()
if result:
    print(f'Admin user found: {result[0]} ({result[1]}) - {result[2]}')
else:
    print('Admin user NOT found!')
conn.close()
"
deactivate
```

## Why This Happens

This issue can occur if:
1. The database was created fresh without running migrations
2. The migration script failed silently during deployment
3. The database file was reset or recreated

The deployment script now includes a step to ensure the admin user exists, but if you're experiencing this issue, run the fix script above.

## After Fixing

1. Log in with the default credentials
2. Go to your user settings/profile
3. Change the password immediately
4. If you have other users, make sure they can log in too
