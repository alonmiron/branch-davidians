#!/bin/bash

# Production Deployment Script
# This script pulls the latest code from GitHub, updates dependencies,
# rebuilds both frontend and backend, and restarts services.
#
# Usage: ./deploy-production.sh [branch-name]
# Default branch: main (or master if main doesn't exist)

set -e  # Exit on any error

# Configuration
PROJECT_DIR="/var/www/billing"
BRANCH="${1:-main}"  # Use provided branch or default to 'main'
LOG_FILE="/var/log/billing-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root - warn but allow (some setups require root)
if [ "$EUID" -eq 0 ]; then
    warning "Running as root. Consider using a non-root user for better security."
    SUDO_CMD=""  # No need for sudo when running as root
else
    SUDO_CMD="sudo"  # Use sudo when running as regular user
fi

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    error "Project directory $PROJECT_DIR does not exist. Please run initial deployment first."
fi

# Create log file if it doesn't exist
$SUDO_CMD touch "$LOG_FILE"
if [ "$EUID" -ne 0 ]; then
    $SUDO_CMD chown $USER:$USER "$LOG_FILE"
fi

log "=== Starting Production Deployment ==="
log "Project directory: $PROJECT_DIR"
log "Branch: $BRANCH"
log ""

# Navigate to project directory
cd "$PROJECT_DIR" || error "Failed to change to project directory"

# Check if this is a git repository
if [ ! -d ".git" ]; then
    error "Not a git repository. Please initialize git or clone the repository first."
fi

# Backup current version (optional but recommended)
log "Creating backup of current version..."
BACKUP_DIR="/var/backups/billing-$(date +%Y%m%d-%H%M%S)"
$SUDO_CMD mkdir -p "$BACKUP_DIR"
$SUDO_CMD cp -r "$PROJECT_DIR" "$BACKUP_DIR/" 2>/dev/null || warning "Backup creation failed, continuing anyway..."
log "Backup created at: $BACKUP_DIR"

# Hard pull latest code from GitHub (overwrites local changes)
log "Hard pulling latest code from GitHub (branch: $BRANCH) - local changes will be overwritten..."
git fetch origin || error "Failed to fetch from origin"

# Check if branch exists
if ! git rev-parse --verify "origin/$BRANCH" >/dev/null 2>&1; then
    # Try master if main doesn't exist
    if [ "$BRANCH" = "main" ] && git rev-parse --verify "origin/master" >/dev/null 2>&1; then
        warning "Branch 'main' not found, using 'master' instead"
        BRANCH="master"
    else
        error "Branch '$BRANCH' not found in remote repository"
    fi
fi

# Get current commit hash before reset
CURRENT_COMMIT=$(git rev-parse HEAD)

# Hard reset to match remote branch exactly (discards all local changes)
log "Resetting local branch to match origin/$BRANCH (hard reset)..."
git reset --hard "origin/$BRANCH" || error "Failed to reset to origin/$BRANCH"

# Clean untracked files and directories (optional but thorough)
log "Cleaning untracked files and directories..."
git clean -fd || warning "Failed to clean untracked files"

# Get new commit hash
NEW_COMMIT=$(git rev-parse HEAD)

if [ "$CURRENT_COMMIT" = "$NEW_COMMIT" ]; then
    log "No new changes detected. Code is already up to date."
else
    log "Code updated: $CURRENT_COMMIT -> $NEW_COMMIT"
fi

# Update Backend Dependencies
log ""
log "=== Updating Backend Dependencies ==="
cd "$PROJECT_DIR/backend" || error "Failed to change to backend directory"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    warning "Virtual environment not found. Creating new one..."
    python3 -m venv venv
fi

# Activate virtual environment and update dependencies
source venv/bin/activate
log "Updating Python dependencies..."
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet || error "Failed to install backend dependencies"
deactivate

log "Backend dependencies updated successfully"

# Run database migrations (ensures users table + default admin exist)
log "Running database migrations..."
cd "$PROJECT_DIR/backend" || error "Failed to change to backend directory"
source venv/bin/activate
if [ -f "billing.db" ]; then
    python app/migrations/add_manual_payments.py || warning "Migration had issues (may already be applied)"
else
    python -m app.init_db || error "Failed to initialize database"
    python app/migrations/add_manual_payments.py || warning "Migration had issues (may already be applied)"
fi

# Ensure admin user exists (fix script)
log "Ensuring admin user exists..."
python fix_admin_user.py || warning "Admin user check had issues"
deactivate

# Update Frontend Dependencies and Build
log ""
log "=== Updating Frontend Dependencies and Building ==="
cd "$PROJECT_DIR/frontend" || error "Failed to change to frontend directory"

log "Installing/updating Node dependencies..."
npm ci --silent || npm install --silent || error "Failed to install frontend dependencies"

log "Building frontend for production..."
npm run build || error "Failed to build frontend"

log "Frontend built successfully"

# Configure SMTP environment for backend service
log ""
log "=== Configuring SMTP Environment ==="
if [ -f "$PROJECT_DIR/set-smtp-env.sh" ]; then
    $SUDO_CMD bash "$PROJECT_DIR/set-smtp-env.sh" || warning "Failed to configure SMTP environment"
else
    warning "SMTP env script not found at $PROJECT_DIR/set-smtp-env.sh"
fi

# Restart Backend Service
log ""
log "=== Restarting Backend Service ==="
$SUDO_CMD systemctl restart billing-api || error "Failed to restart billing-api service"

# Wait a moment for service to start
sleep 2

# Check if service is running
if $SUDO_CMD systemctl is-active --quiet billing-api; then
    log "Backend service restarted successfully"
else
    error "Backend service failed to start. Check logs with: $SUDO_CMD journalctl -u billing-api -n 50"
fi

# Reload Nginx
log ""
log "=== Reloading Nginx ==="
$SUDO_CMD nginx -t || error "Nginx configuration test failed"
$SUDO_CMD systemctl reload nginx || error "Failed to reload nginx"

log "Nginx reloaded successfully"

# Verify services are running
log ""
log "=== Verifying Services ==="
if $SUDO_CMD systemctl is-active --quiet billing-api; then
    log "✓ Backend service is running"
else
    error "✗ Backend service is not running"
fi

if $SUDO_CMD systemctl is-active --quiet nginx; then
    log "✓ Nginx is running"
else
    error "✗ Nginx is not running"
fi

# Check if frontend build exists
if [ -d "$PROJECT_DIR/frontend/dist" ] && [ "$(ls -A $PROJECT_DIR/frontend/dist)" ]; then
    log "✓ Frontend build exists"
else
    error "✗ Frontend build is missing or empty"
fi

# Summary
log ""
log "=== Deployment Complete ==="
log ""
log "Summary:"
log "  - Code pulled from: origin/$BRANCH"
log "  - Backend dependencies updated"
log "  - Frontend rebuilt"
log "  - Services restarted"
log ""
log "Useful commands:"
log "  - View backend logs: $SUDO_CMD journalctl -u billing-api -f"
log "  - View nginx logs: $SUDO_CMD tail -f /var/log/nginx/error.log"
log "  - Check service status: $SUDO_CMD systemctl status billing-api"
log "  - View deployment log: tail -f $LOG_FILE"
log ""
log "Deployment log saved to: $LOG_FILE"
log ""
