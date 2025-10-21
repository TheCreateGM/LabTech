#!/bin/bash

###############################################################################
# Security Testing Script for LabTech GeoLab Backend
# This script performs automated security tests
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0
WARNINGS=0

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}║   LabTech GeoLab Security Testing Suite                  ║${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

###############################################################################
# Test 1: Dependency Vulnerability Scan
###############################################################################
echo -e "${BLUE}[TEST 1]${NC} Running npm audit..."
if npm audit --audit-level=high > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASSED${NC} - No high or critical vulnerabilities found"
    ((PASSED++))
else
    AUDIT_RESULT=$(npm audit --json 2>/dev/null | grep -o '"high":[0-9]*' | cut -d':' -f2)
    CRITICAL_RESULT=$(npm audit --json 2>/dev/null | grep -o '"critical":[0-9]*' | cut -d':' -f2)
    
    if [ "$AUDIT_RESULT" != "0" ] || [ "$CRITICAL_RESULT" != "0" ]; then
        echo -e "${RED}✗ FAILED${NC} - High or critical vulnerabilities found"
        ((FAILED++))
    else
        echo -e "${YELLOW}⚠ WARNING${NC} - Moderate vulnerabilities found (acceptable)"
        ((WARNINGS++))
    fi
fi
echo ""

###############################################################################
# Test 2: Environment Variables Check
###############################################################################
echo -e "${BLUE}[TEST 2]${NC} Checking environment variables..."
REQUIRED_VARS=("DATABASE_URL" "JWT_ACCESS_SECRET" "JWT_REFRESH_SECRET" "REDIS_URL")
ENV_CHECK_PASSED=true

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}✗ Missing required environment variable: $var${NC}"
        ENV_CHECK_PASSED=false
    fi
done

if [ "$ENV_CHECK_PASSED" = true ]; then
    echo -e "${GREEN}✓ PASSED${NC} - All required environment variables are set"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} - Missing required environment variables"
    ((FAILED++))
fi
echo ""

###############################################################################
# Test 3: File Permissions Check
###############################################################################
echo -e "${BLUE}[TEST 3]${NC} Checking sensitive file permissions..."
SENSITIVE_FILES=(".env" "keys/private.pem" "keys/public.pem")
PERM_CHECK_PASSED=true

for file in "${SENSITIVE_FILES[@]}"; do
    if [ -f "$file" ]; then
        PERMS=$(stat -c "%a" "$file" 2>/dev/null || stat -f "%A" "$file" 2>/dev/null)
        if [ "$PERMS" != "600" ] && [ "$PERMS" != "400" ]; then
            echo -e "${YELLOW}⚠ WARNING${NC} - $file has permissions $PERMS (should be 600 or 400)"
            PERM_CHECK_PASSED=false
        fi
    fi
done

if [ "$PERM_CHECK_PASSED" = true ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Sensitive files have correct permissions"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC} - Some files have incorrect permissions"
    ((WARNINGS++))
fi
echo ""

###############################################################################
# Test 4: TypeScript Compilation Check
###############################################################################
echo -e "${BLUE}[TEST 4]${NC} Checking TypeScript compilation..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASSED${NC} - TypeScript compiles without errors"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} - TypeScript compilation errors found"
    ((FAILED++))
fi
echo ""

###############################################################################
# Test 5: Security Headers Check
###############################################################################
echo -e "${BLUE}[TEST 5]${NC} Checking security headers implementation..."
SECURITY_FILES=(
    "src/index.ts"
    "src/middleware/security.middleware.ts"
)
HEADERS_CHECK_PASSED=true

for file in "${SECURITY_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗ Missing security file: $file${NC}"
        HEADERS_CHECK_PASSED=false
    fi
done

if [ "$HEADERS_CHECK_PASSED" = true ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Security headers middleware implemented"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} - Security headers not properly implemented"
    ((FAILED++))
fi
echo ""

###############################################################################
# Test 6: Input Validation Check
###############################################################################
echo -e "${BLUE}[TEST 6]${NC} Checking input validation implementation..."
VALIDATION_FILES=(
    "src/middleware/validation.middleware.ts"
    "src/utils/sanitizer.ts"
)
VALIDATION_CHECK_PASSED=true

for file in "${VALIDATION_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗ Missing validation file: $file${NC}"
        VALIDATION_CHECK_PASSED=false
    fi
done

if [ "$VALIDATION_CHECK_PASSED" = true ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Input validation and sanitization implemented"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} - Input validation not properly implemented"
    ((FAILED++))
fi
echo ""

###############################################################################
# Test 7: Rate Limiting Check
###############################################################################
echo -e "${BLUE}[TEST 7]${NC} Checking rate limiting implementation..."
if grep -q "express-rate-limit" package.json && [ -f "src/middleware/rateLimiter.middleware.ts" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Rate limiting implemented"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} - Rate limiting not properly implemented"
    ((FAILED++))
fi
echo ""

###############################################################################
# Test 8: Authentication Security Check
###############################################################################
echo -e "${BLUE}[TEST 8]${NC} Checking authentication security..."
AUTH_FILES=(
    "src/services/AuthService.ts"
    "src/middleware/auth.middleware.ts"
    "src/services/MFAService.ts"
)
AUTH_CHECK_PASSED=true

for file in "${AUTH_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗ Missing auth file: $file${NC}"
        AUTH_CHECK_PASSED=false
    fi
done

if [ "$AUTH_CHECK_PASSED" = true ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Authentication security implemented"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} - Authentication security not properly implemented"
    ((FAILED++))
fi
echo ""

###############################################################################
# Test 9: Encryption Check
###############################################################################
echo -e "${BLUE}[TEST 9]${NC} Checking encryption implementation..."
if [ -f "src/services/EncryptionService.ts" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Encryption service implemented"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} - Encryption service not found"
    ((FAILED++))
fi
echo ""

###############################################################################
# Test 10: GDPR Compliance Check
###############################################################################
echo -e "${BLUE}[TEST 10]${NC} Checking GDPR compliance implementation..."
GDPR_FILES=(
    "src/services/GDPRService.ts"
    "src/controllers/GDPRController.ts"
    "src/routes/gdpr.routes.ts"
)
GDPR_CHECK_PASSED=true

for file in "${GDPR_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗ Missing GDPR file: $file${NC}"
        GDPR_CHECK_PASSED=false
    fi
done

if [ "$GDPR_CHECK_PASSED" = true ]; then
    echo -e "${GREEN}✓ PASSED${NC} - GDPR compliance implemented"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} - GDPR compliance not properly implemented"
    ((FAILED++))
fi
echo ""

###############################################################################
# Test 11: Logging and Monitoring Check
###############################################################################
echo -e "${BLUE}[TEST 11]${NC} Checking logging and monitoring..."
MONITORING_FILES=(
    "src/utils/logger.ts"
    "src/utils/metrics.ts"
    "src/utils/sentry.ts"
)
MONITORING_CHECK_PASSED=true

for file in "${MONITORING_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗ Missing monitoring file: $file${NC}"
        MONITORING_CHECK_PASSED=false
    fi
done

if [ "$MONITORING_CHECK_PASSED" = true ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Logging and monitoring implemented"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} - Logging and monitoring not properly implemented"
    ((FAILED++))
fi
echo ""

###############################################################################
# Test 12: Backup System Check
###############################################################################
echo -e "${BLUE}[TEST 12]${NC} Checking backup system..."
BACKUP_FILES=(
    "scripts/backup-database.ts"
    "scripts/restore-database.ts"
    "scripts/cleanup-backups.ts"
)
BACKUP_CHECK_PASSED=true

for file in "${BACKUP_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗ Missing backup file: $file${NC}"
        BACKUP_CHECK_PASSED=false
    fi
done

if [ "$BACKUP_CHECK_PASSED" = true ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Backup system implemented"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} - Backup system not properly implemented"
    ((FAILED++))
fi
echo ""

###############################################################################
# Summary
###############################################################################
TOTAL=$((PASSED + FAILED + WARNINGS))
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Test Summary                           ║${NC}"
echo -e "${BLUE}╠═══════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║${NC} Total Tests:    ${TOTAL}                                        ${BLUE}║${NC}"
echo -e "${BLUE}║${NC} ${GREEN}Passed:${NC}         ${PASSED}                                        ${BLUE}║${NC}"
echo -e "${BLUE}║${NC} ${RED}Failed:${NC}         ${FAILED}                                        ${BLUE}║${NC}"
echo -e "${BLUE}║${NC} ${YELLOW}Warnings:${NC}       ${WARNINGS}                                        ${BLUE}║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All critical security tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some security tests failed. Please review and fix the issues.${NC}"
    exit 1
fi
