#!/bin/bash

# Schedule Backups Script
# Sets up cron jobs for automated database backups

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up automated backup schedule...${NC}"

# Check if running on Heroku
if [ -n "$DYNO" ]; then
    echo -e "${YELLOW}Detected Heroku environment${NC}"
    echo "Please configure Heroku Scheduler add-on with the following commands:"
    echo ""
    echo "  Daily full backup (2 AM UTC):"
    echo "  cd backend && npm run backup:full"
    echo ""
    echo "  Incremental backup (every 6 hours):"
    echo "  cd backend && npm run backup:incremental"
    echo ""
    echo "Visit: https://dashboard.heroku.com/apps/YOUR_APP_NAME/scheduler"
    exit 0
fi

# Check if cron is available
if ! command -v crontab &> /dev/null; then
    echo -e "${RED}Error: crontab command not found${NC}"
    echo "Please install cron to schedule automated backups"
    exit 1
fi

# Create cron jobs
CRON_FILE="/tmp/backup-cron-$$"

# Get existing crontab
crontab -l > "$CRON_FILE" 2>/dev/null || true

# Remove existing backup jobs
sed -i '/# LabTech GeoLab Backup/d' "$CRON_FILE"
sed -i '/backup-database/d' "$CRON_FILE"

# Add new backup jobs
cat >> "$CRON_FILE" << EOF

# LabTech GeoLab Backup Jobs
# Daily full backup at 2 AM UTC
0 2 * * * cd $BACKEND_DIR && npm run backup:full >> $BACKEND_DIR/logs/backup.log 2>&1

# Incremental backup every 6 hours
0 */6 * * * cd $BACKEND_DIR && npm run backup:incremental >> $BACKEND_DIR/logs/backup.log 2>&1

# Weekly cleanup on Sunday at 3 AM UTC
0 3 * * 0 cd $BACKEND_DIR && npm run backup:cleanup >> $BACKEND_DIR/logs/backup-cleanup.log 2>&1

EOF

# Install new crontab
crontab "$CRON_FILE"
rm "$CRON_FILE"

echo -e "${GREEN}✓ Backup schedule configured successfully${NC}"
echo ""
echo "Scheduled jobs:"
echo "  - Full backup: Daily at 2:00 AM UTC"
echo "  - Incremental backup: Every 6 hours"
echo ""
echo "Logs will be written to: $BACKEND_DIR/logs/backup.log"
echo ""
echo "To view scheduled jobs, run: crontab -l"
echo "To remove scheduled jobs, run: crontab -r"
