#!/bin/bash

# Backup System Verification Script
# Checks if all backup components are properly configured

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Backup System Verification${NC}"
echo "========================================"
echo ""

# Check if required files exist
echo "Checking required files..."

FILES=(
  "scripts/backup-database.ts"
  "scripts/restore-database.ts"
  "scripts/cleanup-backups.ts"
  "scripts/schedule-backups.sh"
  "src/services/BackupMonitoringService.ts"
  "src/controllers/BackupController.ts"
  "src/routes/backup.routes.ts"
)

ALL_FILES_EXIST=true
for file in "${FILES[@]}"; do
  if [ -f "$BACKEND_DIR/$file" ]; then
    echo -e "  ${GREEN}✓${NC} $file"
  else
    echo -e "  ${RED}✗${NC} $file (missing)"
    ALL_FILES_EXIST=false
  fi
done

echo ""

# Check if backup directory exists
echo "Checking backup directory..."
if [ -d "$BACKEND_DIR/backups" ]; then
  echo -e "  ${GREEN}✓${NC} Backup directory exists"
else
  echo -e "  ${YELLOW}!${NC} Backup directory does not exist (will be created on first backup)"
fi

echo ""

# Check environment variables
echo "Checking environment variables..."

if [ -f "$BACKEND_DIR/.env" ]; then
  source "$BACKEND_DIR/.env"
  
  if [ -n "$DATABASE_URL" ]; then
    echo -e "  ${GREEN}✓${NC} DATABASE_URL is set"
  else
    echo -e "  ${RED}✗${NC} DATABASE_URL is not set"
  fi
  
  if [ -n "$ENCRYPTION_KEY" ]; then
    echo -e "  ${GREEN}✓${NC} ENCRYPTION_KEY is set"
  else
    echo -e "  ${YELLOW}!${NC} ENCRYPTION_KEY is not set (backups will not be encrypted)"
  fi
  
  if [ -n "$BACKUP_S3_BUCKET" ]; then
    echo -e "  ${GREEN}✓${NC} BACKUP_S3_BUCKET is set"
  else
    echo -e "  ${YELLOW}!${NC} BACKUP_S3_BUCKET is not set (backups will be stored locally only)"
  fi
else
  echo -e "  ${RED}✗${NC} .env file not found"
fi

echo ""

# Check if pg_dump is available
echo "Checking PostgreSQL tools..."
if command -v pg_dump &> /dev/null; then
  PG_VERSION=$(pg_dump --version | head -n 1)
  echo -e "  ${GREEN}✓${NC} pg_dump is available ($PG_VERSION)"
else
  echo -e "  ${RED}✗${NC} pg_dump is not available (required for backups)"
fi

if command -v pg_restore &> /dev/null; then
  echo -e "  ${GREEN}✓${NC} pg_restore is available"
else
  echo -e "  ${RED}✗${NC} pg_restore is not available (required for restores)"
fi

echo ""

# Check if AWS CLI is available (for S3 uploads)
echo "Checking AWS CLI..."
if command -v aws &> /dev/null; then
  AWS_VERSION=$(aws --version 2>&1 | head -n 1)
  echo -e "  ${GREEN}✓${NC} AWS CLI is available ($AWS_VERSION)"
else
  echo -e "  ${YELLOW}!${NC} AWS CLI is not available (S3 uploads will not work)"
fi

echo ""

# Check npm scripts
echo "Checking npm scripts..."
if grep -q "backup:full" "$BACKEND_DIR/package.json"; then
  echo -e "  ${GREEN}✓${NC} backup:full script is configured"
else
  echo -e "  ${RED}✗${NC} backup:full script is missing"
fi

if grep -q "backup:incremental" "$BACKEND_DIR/package.json"; then
  echo -e "  ${GREEN}✓${NC} backup:incremental script is configured"
else
  echo -e "  ${RED}✗${NC} backup:incremental script is missing"
fi

if grep -q "backup:restore" "$BACKEND_DIR/package.json"; then
  echo -e "  ${GREEN}✓${NC} backup:restore script is configured"
else
  echo -e "  ${RED}✗${NC} backup:restore script is missing"
fi

if grep -q "backup:cleanup" "$BACKEND_DIR/package.json"; then
  echo -e "  ${GREEN}✓${NC} backup:cleanup script is configured"
else
  echo -e "  ${RED}✗${NC} backup:cleanup script is missing"
fi

echo ""
echo "========================================"

if [ "$ALL_FILES_EXIST" = true ]; then
  echo -e "${GREEN}✓ Backup system is properly configured${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Configure environment variables in .env"
  echo "  2. Run 'npm run backup:schedule' to set up automated backups"
  echo "  3. Test with 'npm run backup:full'"
  exit 0
else
  echo -e "${RED}✗ Some components are missing${NC}"
  echo "Please ensure all required files are present"
  exit 1
fi
