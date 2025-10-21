#!/bin/bash

# Heroku Setup Script for LabTech GeoLab
# This script automates the Heroku deployment setup process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    log_error "Heroku CLI is not installed. Please install it first:"
    echo "  macOS: brew tap heroku/brew && brew install heroku"
    echo "  Ubuntu: curl https://cli-assets.heroku.com/install-ubuntu.sh | sh"
    exit 1
fi

log_info "Heroku CLI found: $(heroku --version)"

# Login to Heroku
log_step "Logging in to Heroku..."
heroku login

# Get app name
read -p "Enter Heroku app name (or press Enter to generate): " APP_NAME

# Create Heroku app
log_step "Creating Heroku app..."
if [ -z "$APP_NAME" ]; then
    APP_NAME=$(heroku create --json | jq -r '.name')
    log_info "Created app: $APP_NAME"
else
    heroku create "$APP_NAME"
fi

# Set buildpack
log_step "Setting Node.js buildpack..."
heroku buildpacks:set heroku/nodejs -a "$APP_NAME"

# Provision add-ons
log_step "Provisioning add-ons..."

read -p "Select PostgreSQL plan (mini/standard-0/standard-2) [standard-0]: " PG_PLAN
PG_PLAN=${PG_PLAN:-standard-0}
heroku addons:create "heroku-postgresql:$PG_PLAN" -a "$APP_NAME"
log_info "PostgreSQL provisioned"

read -p "Select Redis plan (mini/premium-0/premium-2) [premium-0]: " REDIS_PLAN
REDIS_PLAN=${REDIS_PLAN:-premium-0}
heroku addons:create "heroku-redis:$REDIS_PLAN" -a "$APP_NAME"
log_info "Redis provisioned"

read -p "Add Papertrail logging? (y/n) [y]: " ADD_PAPERTRAIL
ADD_PAPERTRAIL=${ADD_PAPERTRAIL:-y}
if [ "$ADD_PAPERTRAIL" = "y" ]; then
    heroku addons:create papertrail:choklad -a "$APP_NAME"
    log_info "Papertrail provisioned"
fi

read -p "Add Heroku Scheduler? (y/n) [y]: " ADD_SCHEDULER
ADD_SCHEDULER=${ADD_SCHEDULER:-y}
if [ "$ADD_SCHEDULER" = "y" ]; then
    heroku addons:create scheduler:standard -a "$APP_NAME"
    log_info "Scheduler provisioned"
fi

# Generate secrets
log_step "Generating secure secrets..."
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32 | cut -c1-32)

# Set environment variables
log_step "Configuring environment variables..."
heroku config:set \
    NODE_ENV=production \
    JWT_SECRET="$JWT_SECRET" \
    JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" \
    ENCRYPTION_KEY="$ENCRYPTION_KEY" \
    MFA_ISSUER="LabTech GeoLab" \
    CORS_ORIGIN="https://$APP_NAME.herokuapp.com" \
    LOG_LEVEL=info \
    -a "$APP_NAME"

log_info "Environment variables configured"

# Optional: Email configuration
read -p "Configure email settings? (y/n) [n]: " CONFIGURE_EMAIL
CONFIGURE_EMAIL=${CONFIGURE_EMAIL:-n}
if [ "$CONFIGURE_EMAIL" = "y" ]; then
    read -p "SMTP Host: " SMTP_HOST
    read -p "SMTP Port [587]: " SMTP_PORT
    SMTP_PORT=${SMTP_PORT:-587}
    read -p "SMTP User: " SMTP_USER
    read -sp "SMTP Password: " SMTP_PASSWORD
    echo
    read -p "From Email [noreply@labtech.com]: " SMTP_FROM
    SMTP_FROM=${SMTP_FROM:-noreply@labtech.com}
    
    heroku config:set \
        SMTP_HOST="$SMTP_HOST" \
        SMTP_PORT="$SMTP_PORT" \
        SMTP_USER="$SMTP_USER" \
        SMTP_PASSWORD="$SMTP_PASSWORD" \
        SMTP_FROM="$SMTP_FROM" \
        -a "$APP_NAME"
    
    log_info "Email configuration set"
fi

# Add git remote
log_step "Adding Heroku git remote..."
heroku git:remote -a "$APP_NAME"
log_info "Git remote added"

# Deploy application
read -p "Deploy application now? (y/n) [y]: " DEPLOY_NOW
DEPLOY_NOW=${DEPLOY_NOW:-y}
if [ "$DEPLOY_NOW" = "y" ]; then
    log_step "Deploying application to Heroku..."
    git push heroku main || git push heroku master:main
    log_info "Application deployed"
    
    # Scale dynos
    log_step "Scaling dynos..."
    heroku ps:scale web=1 worker=1 -a "$APP_NAME"
    log_info "Dynos scaled"
    
    # Open application
    log_step "Opening application..."
    heroku open -a "$APP_NAME"
fi

# Summary
echo ""
echo "=========================================="
log_info "Setup Complete!"
echo "=========================================="
echo ""
echo "App Name: $APP_NAME"
echo "App URL: https://$APP_NAME.herokuapp.com"
echo ""
echo "Useful commands:"
echo "  View logs:        heroku logs --tail -a $APP_NAME"
echo "  View dynos:       heroku ps -a $APP_NAME"
echo "  View config:      heroku config -a $APP_NAME"
echo "  Run migrations:   heroku run npm run migrate -a $APP_NAME"
echo "  Open dashboard:   heroku dashboard -a $APP_NAME"
echo ""
echo "Next steps:"
echo "  1. Configure custom domain (if needed)"
echo "  2. Set up automated backups in Scheduler"
echo "  3. Configure monitoring and alerts"
echo "  4. Set up CI/CD pipeline"
echo ""
