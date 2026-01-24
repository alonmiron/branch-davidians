#!/bin/bash

# Deployment script for Digital Ocean
# Run this script on your Digital Ocean droplet

set -e

echo "=== Billing Management System Deployment ==="
echo ""

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "Installing dependencies..."
sudo apt install -y python3-pip python3-venv nginx nodejs npm git

# Setup project directory
PROJECT_DIR="/var/www/billing"
echo "Setting up project directory at $PROJECT_DIR..."

if [ ! -d "$PROJECT_DIR" ]; then
    sudo mkdir -p $PROJECT_DIR
fi

sudo chown -R $USER:$USER $PROJECT_DIR

# Backend setup
echo "Setting up backend..."
cd $PROJECT_DIR/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m app.init_db
python app/migrations/add_manual_payments.py || true
python fix_admin_user.py || true
deactivate

# Create systemd service (run as deploy user so API can read/write billing.db)
echo "Creating systemd service..."
sudo tee /etc/systemd/system/billing-api.service > /dev/null <<EOF
[Unit]
Description=Billing Management API
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR/backend
Environment="PATH=$PROJECT_DIR/backend/venv/bin"
ExecStart=$PROJECT_DIR/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable billing-api
sudo systemctl start billing-api

# Frontend setup
echo "Building frontend..."
cd $PROJECT_DIR/frontend
npm install
npm run build

# Nginx configuration
echo "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/billing > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    location / {
        root $PROJECT_DIR/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /docs {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/billing /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Configure firewall
echo "Configuring firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
echo "y" | sudo ufw enable

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Your application is now running!"
echo "Access it at: http://$(curl -s ifconfig.me)"
echo ""
echo "Useful commands:"
echo "  - Check API status: sudo systemctl status billing-api"
echo "  - View API logs: sudo journalctl -u billing-api -f"
echo "  - Restart API: sudo systemctl restart billing-api"
echo "  - Restart Nginx: sudo systemctl restart nginx"
echo ""



