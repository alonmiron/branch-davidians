# Production Deployment Guide

This guide explains how to use the `deploy-production.sh` script to update your production server with the latest code from GitHub.

## Overview

The `deploy-production.sh` script automates the entire deployment process:
1. ✅ Pulls latest code from GitHub
2. ✅ Updates backend Python dependencies
3. ✅ Rebuilds frontend React application
4. ✅ Restarts backend service (systemd)
5. ✅ Reloads Nginx web server
6. ✅ Verifies all services are running

## Prerequisites

Before using this script, ensure:
- ✅ Your server has been initially set up using `deploy.sh`
- ✅ The project is cloned from GitHub at `/var/www/billing`
- ✅ You have SSH access to your droplet
- ✅ Git is configured and can pull from your repository
- ✅ You're running as a non-root user (the script will check)

## Quick Start

### 1. Make the script executable

First time setup (run once):
```bash
cd /var/www/billing
chmod +x deploy-production.sh
```

### 2. Run the deployment script

**Deploy from main branch (default):**
```bash
./deploy-production.sh
```

**Deploy from a specific branch:**
```bash
./deploy-production.sh develop
./deploy-production.sh feature/new-feature
```

## How It Works

The script performs these steps in order:

1. **Validation**: Checks that the project directory exists and is a git repository
2. **Backup**: Creates a timestamped backup of the current version (stored in `/var/backups/`)
3. **Git Pull**: Fetches and pulls the latest code from the specified branch
4. **Backend Update**: 
   - Activates Python virtual environment
   - Upgrades pip
   - Installs/updates all Python dependencies from `requirements.txt`
5. **Frontend Build**:
   - Installs/updates Node.js dependencies
   - Builds production-ready frontend (outputs to `frontend/dist/`)
6. **Service Restart**:
   - Restarts the `billing-api` systemd service
   - Reloads Nginx configuration
7. **Verification**: Checks that all services are running correctly

## Running the Script

### Basic Usage

```bash
# SSH into your droplet
ssh your-user@your-droplet-ip

# Navigate to project directory
cd /var/www/billing

# Run deployment (uses 'main' branch by default)
./deploy-production.sh
```

### Deploy from Different Branch

```bash
# Deploy from 'develop' branch
./deploy-production.sh develop

# Deploy from 'staging' branch
./deploy-production.sh staging
```

### View Deployment Logs

The script logs all output to `/var/log/billing-deploy.log`:

```bash
# View last deployment
tail -f /var/log/billing-deploy.log

# View last 50 lines
tail -n 50 /var/log/billing-deploy.log
```

## What Happens During Deployment

### Step-by-Step Process

1. **Pre-flight Checks**
   - Verifies project directory exists
   - Confirms git repository is initialized
   - Checks user permissions

2. **Backup Creation**
   - Creates backup at `/var/backups/billing-YYYYMMDD-HHMMSS/`
   - This allows you to rollback if needed

3. **Code Update**
   - Fetches latest changes from GitHub
   - Pulls specified branch (default: `main`)
   - Shows commit hash changes

4. **Backend Update**
   - Activates virtual environment (`backend/venv/`)
   - Upgrades pip to latest version
   - Installs all packages from `requirements.txt`
   - Any new dependencies are automatically installed

5. **Frontend Build**
   - Runs `npm ci` (or `npm install` if that fails)
   - Builds production bundle with `npm run build`
   - Outputs optimized files to `frontend/dist/`

6. **Service Management**
   - Restarts `billing-api` systemd service
   - Reloads Nginx (no downtime for web server)
   - Waits 2 seconds for service to initialize

7. **Verification**
   - Checks backend service is active
   - Checks Nginx is running
   - Verifies frontend build exists

## Troubleshooting

### Script Fails with "Not a git repository"

**Solution**: Initialize git or clone the repository:
```bash
cd /var/www/billing
git init
git remote add origin <your-github-repo-url>
git pull origin main
```

### Script Fails with "Permission denied"

**Solution**: Ensure you have proper permissions:
```bash
# Check ownership
ls -la /var/www/billing

# Fix ownership if needed (replace 'your-user' with your username)
sudo chown -R your-user:your-user /var/www/billing
```

### Backend Service Fails to Start

**Check logs:**
```bash
sudo journalctl -u billing-api -n 50
```

**Common issues:**
- Missing Python dependencies: Check `requirements.txt` is up to date
- Database errors: Check database file permissions
- Port conflicts: Check if port 8000 is already in use

### Frontend Build Fails

**Check for errors:**
```bash
cd /var/www/billing/frontend
npm run build
```

**Common issues:**
- Out of memory: Increase server RAM or add swap space
- Node version mismatch: Update Node.js
- Missing dependencies: Delete `node_modules` and reinstall

### Nginx Configuration Errors

**Test configuration:**
```bash
sudo nginx -t
```

**View error logs:**
```bash
sudo tail -f /var/log/nginx/error.log
```

### Login fails / "Incorrect username or password" or error on password

**Causes:**
1. **API not reachable** – Frontend must use `/api` in production (same origin). The app uses this automatically when built for production.
2. **No admin user** – The migration creates the default admin. Ensure it has run:
   ```bash
   cd /var/www/billing/backend
   source venv/bin/activate
   python app/migrations/add_manual_payments.py
   deactivate
   ```
3. **Wrong credentials** – Default login: **Username** `admin`, **Password** `admin123`. Change this after first login.
4. **Database not saving user data** – The API must run as the **deploy user** (same user that runs migration) so it can read/write `billing.db`. If you previously used `User=www-data` in the systemd unit, the DB was created by the deploy user and www-data could not write to it. Fix:
   - Edit the service: `sudo nano /etc/systemd/system/billing-api.service`
   - Set `User=` to your deploy username (e.g. `ubuntu`), not `www-data`
   - Run `sudo systemctl daemon-reload && sudo systemctl restart billing-api`
   - New deploys use the deploy user by default.

**Verify persistence:** `curl http://localhost:8000/health` returns `users_count` and `database: "ok"`. If `database` is `"error"` or `users_count` is 0 when you expect users, the app is not using the same DB as the migration or cannot write to it.

**Optional:** Set `PRODUCTION_URL` (e.g. `http://your-domain.com`) in the `billing-api` systemd service environment so CORS allows your production origin. Set `DATABASE_PATH` to override the DB location (e.g. `/var/lib/billing/billing.db`).

## Rollback Procedure

If deployment fails or causes issues, you can rollback:

```bash
# Stop services
sudo systemctl stop billing-api
sudo systemctl stop nginx

# Restore from backup (replace timestamp with your backup)
sudo rm -rf /var/www/billing
sudo cp -r /var/backups/billing-YYYYMMDD-HHMMSS /var/www/billing

# Fix permissions
sudo chown -R $USER:$USER /var/www/billing

# Restart services
sudo systemctl start billing-api
sudo systemctl start nginx
```

## Automation Options

### Option 1: Manual Deployment (Recommended)

Run the script manually when you want to deploy:
```bash
ssh your-user@your-droplet-ip
cd /var/www/billing
./deploy-production.sh
```

### Option 2: Cron Job (Automatic)

Set up automatic deployments (e.g., daily at 2 AM):
```bash
# Edit crontab
crontab -e

# Add this line (adjust time as needed)
0 2 * * * cd /var/www/billing && ./deploy-production.sh >> /var/log/billing-deploy-cron.log 2>&1
```

### Option 3: GitHub Actions / Webhook

You can set up a webhook that triggers deployment when code is pushed to GitHub. This requires additional setup with a webhook receiver on your server.

## Best Practices

1. **Test Before Deploying**: Always test changes locally first
2. **Deploy During Low Traffic**: Schedule deployments during off-peak hours
3. **Monitor After Deployment**: Watch logs for the first few minutes after deployment
4. **Keep Backups**: The script creates backups, but consider additional backup strategies
5. **Use Branches**: Deploy from stable branches (main/master) to production
6. **Review Changes**: Check what changed before deploying:
   ```bash
   cd /var/www/billing
   git fetch origin
   git log HEAD..origin/main  # See what will be deployed
   ```

## Monitoring After Deployment

After running the script, verify everything is working:

```bash
# Check service status
sudo systemctl status billing-api
sudo systemctl status nginx

# Test API endpoint
curl http://localhost:8000/health

# View real-time logs
sudo journalctl -u billing-api -f
```

## Security Notes

- The script should be run as a non-root user (it will check and fail if run as root)
- Backups are stored in `/var/backups/` - ensure this directory has proper permissions
- Logs are stored in `/var/log/billing-deploy.log` - review regularly
- Consider setting up SSH key authentication instead of passwords

## Support

If you encounter issues:

1. Check the deployment log: `tail -f /var/log/billing-deploy.log`
2. Check service logs: `sudo journalctl -u billing-api -n 50`
3. Verify git repository: `cd /var/www/billing && git status`
4. Test services manually: Follow the troubleshooting section above

---

**Ready to deploy?** Run `./deploy-production.sh` and watch the magic happen! 🚀
