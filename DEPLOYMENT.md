# Digital Ocean Deployment Checklist

## Pre-Deployment Checklist

### Local Testing
- [ ] Application runs successfully locally
- [ ] All features tested and working
- [ ] Database schema is finalized
- [ ] Sample data works correctly
- [ ] CSV generation produces correct format
- [ ] CSV upload processes results correctly
- [ ] No console errors in browser
- [ ] API documentation accessible

### Preparation
- [ ] Digital Ocean account created
- [ ] Droplet created (Ubuntu 20.04/22.04, minimum 1GB RAM recommended)
- [ ] SSH access to droplet configured
- [ ] Domain name pointed to droplet IP (optional but recommended)
- [ ] SSL certificate plan (Let's Encrypt recommended)

## Deployment Steps

### 1. Initial Server Setup

```bash
# SSH into your droplet
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y

# Create non-root user (recommended)
adduser billing
usermod -aG sudo billing
su - billing
```

### 2. Upload Project Files

**Option A: Using Git (Recommended)**
```bash
cd /var/www
sudo git clone <your-repository-url> billing
sudo chown -R $USER:$USER billing
```

**Option B: Using SCP from local machine**
```bash
# From your local machine
cd /Users/alonmiron
scp -r dad_test root@your-droplet-ip:/var/www/billing
```

**Option C: Using SFTP**
Use FileZilla or similar SFTP client to upload the project folder

### 3. Run Deployment Script

```bash
cd /var/www/billing
chmod +x deploy.sh
./deploy.sh
```

### 4. Post-Deployment Verification

- [ ] Backend API is running: `sudo systemctl status billing-api`
- [ ] Nginx is running: `sudo systemctl status nginx`
- [ ] Application accessible at `http://your-ip`
- [ ] API docs accessible at `http://your-ip/docs`
- [ ] Database initialized: `ls -la /var/www/billing/backend/billing.db`

### 5. Security Configuration

#### A. Setup Firewall
```bash
sudo ufw status
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

#### B. Setup SSL (if using domain)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

- [ ] SSL certificate installed
- [ ] HTTPS redirect working
- [ ] Certificate auto-renewal configured

#### C. Secure Database
```bash
sudo chmod 600 /var/www/billing/backend/billing.db
sudo chown www-data:www-data /var/www/billing/backend/billing.db
```

### 6. Setup Backups

**Daily Database Backup**:
```bash
sudo mkdir -p /var/backups/billing
sudo nano /etc/cron.daily/billing-backup
```

Add this content:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
cp /var/www/billing/backend/billing.db /var/backups/billing/billing-$DATE.db
find /var/backups/billing/ -name "billing-*.db" -mtime +30 -delete
```

Make executable:
```bash
sudo chmod +x /etc/cron.daily/billing-backup
```

- [ ] Backup script created
- [ ] Backup script tested
- [ ] Backup retention policy set (30 days default)

### 7. Monitoring Setup

**Setup log rotation**:
```bash
sudo nano /etc/logrotate.d/billing-api
```

Add:
```
/var/log/billing-api/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
}
```

- [ ] Log rotation configured
- [ ] Disk space monitoring plan in place

### 8. Seed Initial Data

**Option 1: Add sample data for testing**
```bash
cd /var/www/billing/backend
source venv/bin/activate
python -m app.seed_data
```

**Option 2: Import real data**
- Use the application UI to add customers manually
- Or prepare and run a custom import script

- [ ] Initial data loaded
- [ ] Test customer created and verified

## Post-Deployment Testing

### Functional Tests
- [ ] Can access application via browser
- [ ] Can log in (if authentication added)
- [ ] Can add a customer
- [ ] Can edit a customer
- [ ] Can delete a customer
- [ ] Can generate batch file
- [ ] Can upload result file
- [ ] Dashboard displays correctly
- [ ] Failed charges page works
- [ ] Card history displays

### Performance Tests
- [ ] Application loads in < 3 seconds
- [ ] API responds in < 500ms
- [ ] No memory leaks after 1 hour
- [ ] Multiple concurrent users supported

### Security Tests
- [ ] HTTPS is enforced (if configured)
- [ ] Database file not accessible via web
- [ ] API endpoints respond correctly
- [ ] Error messages don't expose sensitive info

## Ongoing Maintenance

### Daily
- [ ] Monitor application logs: `sudo journalctl -u billing-api -f`
- [ ] Check system resources: `htop` or `top`
- [ ] Verify backups are running: `ls -la /var/backups/billing/`

### Weekly
- [ ] Review failed charges
- [ ] Check disk space: `df -h`
- [ ] Review Nginx access logs: `sudo tail -f /var/log/nginx/access.log`

### Monthly
- [ ] Update system packages: `sudo apt update && sudo apt upgrade`
- [ ] Review and clean old log files
- [ ] Test database restore from backup
- [ ] Review SSL certificate expiration

## Updating the Application

```bash
# Backup current version
cd /var/www/billing
sudo cp -r /var/www/billing /var/backups/billing-$(date +%Y%m%d)

# Pull latest changes (if using git)
git pull

# Or upload new files via SCP/SFTP

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

# Verify
sudo systemctl status billing-api
sudo systemctl status nginx
```

## Troubleshooting

### Application not accessible
```bash
# Check if services are running
sudo systemctl status billing-api
sudo systemctl status nginx

# Check ports
sudo netstat -tlnp | grep -E ':(80|443|8000)'

# Check firewall
sudo ufw status

# Check logs
sudo journalctl -u billing-api -n 50
sudo tail -f /var/log/nginx/error.log
```

### Database errors
```bash
# Check database file
ls -la /var/www/billing/backend/billing.db

# Check permissions
sudo chown www-data:www-data /var/www/billing/backend/billing.db
sudo chmod 644 /var/www/billing/backend/billing.db

# Restore from backup if needed
sudo cp /var/backups/billing/billing-YYYYMMDD.db /var/www/billing/backend/billing.db
```

### High memory usage
```bash
# Check processes
htop

# Restart services
sudo systemctl restart billing-api
sudo systemctl restart nginx

# Check for memory leaks in logs
sudo journalctl -u billing-api | grep -i memory
```

## Rollback Plan

If deployment fails:
```bash
# Stop services
sudo systemctl stop billing-api
sudo systemctl stop nginx

# Restore backup
sudo rm -rf /var/www/billing
sudo cp -r /var/backups/billing-YYYYMMDD /var/www/billing

# Restart services
sudo systemctl start billing-api
sudo systemctl start nginx
```

## Support Contacts

- **Server Provider**: Digital Ocean Support
- **Domain Registrar**: [Your registrar]
- **SSL Certificate**: Let's Encrypt (auto-renews)

## Checklist Summary

Before going live:
- [ ] All deployment steps completed
- [ ] Security configured
- [ ] Backups working
- [ ] Monitoring in place
- [ ] All tests passed
- [ ] DNS configured (if using domain)
- [ ] SSL certificate installed (if using domain)
- [ ] Documentation updated with production URLs
- [ ] Team trained on using the application
- [ ] Support plan in place

## Success Criteria

Deployment is successful when:
- ✅ Application accessible via public IP/domain
- ✅ HTTPS working (if configured)
- ✅ All features functional
- ✅ Backups running daily
- ✅ No errors in logs
- ✅ Services restart on server reboot
- ✅ Performance acceptable under load

---

**Ready to deploy?** Run `./deploy.sh` and check off each item!



