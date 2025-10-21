# Security Remediation Guide

This document provides step-by-step instructions for addressing security findings from the security audit.

## Table of Contents

1. [Immediate Actions](#immediate-actions)
2. [Dependency Vulnerabilities](#dependency-vulnerabilities)
3. [Configuration Hardening](#configuration-hardening)
4. [Ongoing Security Maintenance](#ongoing-security-maintenance)

## Immediate Actions

### 1. Update Vulnerable Dependencies

**Issue:** validator.js URL validation bypass (GHSA-9965-vmph-33xx)

**Current Status:** Mitigated with custom sanitization

**Steps to Resolve:**

```bash
# Check for updates
npm outdated

# Update express-validator when patch is available
npm update express-validator

# Verify the update
npm audit

# Test the application
npm test
npm run build
```

**Verification:**
```bash
# Run security audit
npm audit --audit-level=moderate

# Should show 0 moderate or higher vulnerabilities
```

### 2. Verify Environment Variables

**Required Variables:**

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT Secrets (use strong random strings)
JWT_ACCESS_SECRET=<generate-with-openssl-rand-base64-32>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-base64-32>

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=<strong-password>

# Encryption
ENCRYPTION_KEY=<generate-with-openssl-rand-base64-32>

# CORS (comma-separated list)
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com

# HTTPS (production)
HTTPS_ENABLED=true
SSL_KEY_PATH=/path/to/private-key.pem
SSL_CERT_PATH=/path/to/certificate.pem

# Sentry (optional but recommended)
SENTRY_DSN=https://your-sentry-dsn

# AWS (for backups)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
BACKUP_S3_BUCKET=<your-bucket-name>
```

**Generate Secure Secrets:**

```bash
# Generate JWT secrets
openssl rand -base64 32

# Generate encryption key
openssl rand -base64 32

# Generate Redis password
openssl rand -base64 24
```

### 3. Set Correct File Permissions

**Sensitive Files:**

```bash
# Set restrictive permissions on .env file
chmod 600 .env

# Set restrictive permissions on private keys
chmod 600 keys/private.pem
chmod 644 keys/public.pem

# Verify permissions
ls -la .env keys/
```

### 4. Enable HTTPS in Production

**Generate SSL Certificates:**

```bash
# Option 1: Let's Encrypt (recommended for production)
sudo certbot certonly --standalone -d yourdomain.com

# Option 2: Self-signed (development only)
openssl req -x509 -newkey rsa:4096 -keyout keys/server-key.pem -out keys/server-cert.pem -days 365 -nodes
```

**Update .env:**

```bash
HTTPS_ENABLED=true
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

## Dependency Vulnerabilities

### Monitoring and Updates

**Weekly Checks:**

```bash
# Run npm audit
npm audit

# Check for outdated packages
npm outdated

# Update non-breaking changes
npm update

# For major updates, review changelog first
npm install package@latest
```

**Automated Monitoring:**

1. **Enable GitHub Dependabot:**
   - Go to repository Settings → Security & analysis
   - Enable "Dependabot alerts"
   - Enable "Dependabot security updates"

2. **Snyk Integration (Optional):**
   ```bash
   npm install -g snyk
   snyk auth
   snyk test
   snyk monitor
   ```

3. **npm audit in CI/CD:**
   ```yaml
   # Add to .github/workflows/ci.yml
   - name: Security Audit
     run: npm audit --audit-level=high
   ```

### Handling Vulnerabilities

**When a vulnerability is found:**

1. **Assess Severity:**
   - Critical/High: Immediate action required
   - Moderate: Plan update within 1 week
   - Low: Plan update in next sprint

2. **Check for Patches:**
   ```bash
   npm audit fix
   ```

3. **If no patch available:**
   - Implement workarounds (like custom sanitization)
   - Monitor for updates
   - Consider alternative packages

4. **Test After Updates:**
   ```bash
   npm test
   npm run build
   npm run dev # Manual testing
   ```

## Configuration Hardening

### 1. Rate Limiting Configuration

**Adjust based on your needs:**

```typescript
// backend/src/config/index.ts
rateLimit: {
  windowMs: 60000, // 1 minute
  maxRequests: 100, // General API
  authMaxRequests: 10, // Auth endpoints
}
```

**Monitor rate limit violations:**

```bash
# Check logs for rate limit events
grep "RATE_LIMIT_EXCEEDED" logs/combined.log

# Check IP blacklist
redis-cli KEYS "ip_blacklist:*"
```

### 2. CORS Configuration

**Production CORS:**

```typescript
// backend/src/config/index.ts
cors: {
  origin: [
    'https://yourdomain.com',
    'https://app.yourdomain.com',
    // Add mobile app origins if needed
  ],
}
```

**Never use in production:**
```typescript
cors: {
  origin: '*', // ❌ INSECURE
}
```

### 3. Database Security

**Connection String Security:**

```bash
# Use SSL for database connections
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# For AWS RDS
DATABASE_URL=postgresql://user:password@rds-instance.region.rds.amazonaws.com:5432/database?sslmode=require
```

**Database User Permissions:**

```sql
-- Create limited user for application
CREATE USER app_user WITH PASSWORD 'strong_password';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE labtech_geolab TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Revoke dangerous permissions
REVOKE CREATE ON SCHEMA public FROM app_user;
REVOKE ALL ON SCHEMA pg_catalog FROM app_user;
```

### 4. Redis Security

**Redis Configuration:**

```bash
# redis.conf
requirepass your_strong_password
bind 127.0.0.1
protected-mode yes
maxmemory 256mb
maxmemory-policy allkeys-lru
```

**Connection Security:**

```bash
# Use password in connection string
REDIS_URL=redis://:password@localhost:6379
```

### 5. Logging Configuration

**Production Logging:**

```typescript
// backend/src/config/index.ts
logging: {
  level: 'info', // Don't use 'debug' in production
  filePath: '/var/log/labtech-geolab',
}
```

**Log Rotation:**

```bash
# Configure logrotate
sudo nano /etc/logrotate.d/labtech-geolab

# Add configuration
/var/log/labtech-geolab/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload labtech-geolab
    endscript
}
```

## Ongoing Security Maintenance

### Daily Tasks

1. **Monitor Logs:**
   ```bash
   # Check for errors
   tail -f logs/error.log
   
   # Check for security events
   grep -i "unauthorized\|forbidden\|blacklist" logs/combined.log
   ```

2. **Monitor Metrics:**
   - Check Grafana dashboards
   - Review Sentry errors
   - Check CloudWatch alarms (AWS)

### Weekly Tasks

1. **Security Audit:**
   ```bash
   npm audit
   ./scripts/security-test.sh
   ```

2. **Review Logs:**
   ```bash
   # Failed login attempts
   grep "INVALID_CREDENTIALS" logs/combined.log | wc -l
   
   # Rate limit violations
   grep "RATE_LIMIT_EXCEEDED" logs/combined.log | wc -l
   
   # IP blacklist events
   grep "IP_BLACKLISTED" logs/combined.log
   ```

3. **Database Backup Verification:**
   ```bash
   npm run backup:full
   # Verify backup was created
   ls -lh backups/
   ```

### Monthly Tasks

1. **Dependency Updates:**
   ```bash
   npm outdated
   npm update
   npm audit fix
   ```

2. **SSL Certificate Check:**
   ```bash
   # Check certificate expiry
   openssl x509 -in /path/to/cert.pem -noout -dates
   
   # Renew Let's Encrypt (if needed)
   sudo certbot renew
   ```

3. **Security Review:**
   - Review access logs
   - Check for unusual patterns
   - Review user accounts
   - Update security documentation

### Quarterly Tasks

1. **Comprehensive Security Audit:**
   - Run full security test suite
   - Review all security configurations
   - Update security documentation
   - Conduct penetration testing

2. **Key Rotation:**
   ```bash
   # Generate new JWT keys
   openssl genrsa -out keys/private-new.pem 4096
   openssl rsa -in keys/private-new.pem -pubout -out keys/public-new.pem
   
   # Update environment variables
   # Gradually migrate to new keys
   ```

3. **Backup Testing:**
   ```bash
   # Test database restore
   npm run backup:restore -- --backup-file=backups/latest.sql
   
   # Verify data integrity
   ```

### Annual Tasks

1. **External Security Audit:**
   - Hire third-party security firm
   - Conduct penetration testing
   - Review and implement recommendations

2. **Compliance Review:**
   - GDPR compliance check
   - OWASP Top 10 review
   - Update security policies

3. **Disaster Recovery Test:**
   - Test full system recovery
   - Verify backup procedures
   - Update disaster recovery plan

## Security Incident Response

### If a Security Breach is Detected:

1. **Immediate Actions:**
   ```bash
   # Block suspicious IPs
   redis-cli SET "ip_blacklist:suspicious.ip.address" "Security incident" EX 86400
   
   # Revoke all active sessions
   redis-cli FLUSHDB
   
   # Take system offline if necessary
   systemctl stop labtech-geolab
   ```

2. **Investigation:**
   - Review logs for attack patterns
   - Identify compromised accounts
   - Assess data exposure
   - Document timeline

3. **Remediation:**
   - Patch vulnerabilities
   - Reset compromised credentials
   - Notify affected users (GDPR requirement)
   - Update security measures

4. **Post-Incident:**
   - Conduct post-mortem
   - Update security procedures
   - Implement additional monitoring
   - Train team on lessons learned

## Security Contacts

**Internal:**
- Security Team: security@labtech-geolab.com
- DevOps Team: devops@labtech-geolab.com

**External:**
- Hosting Provider Support
- Database Provider Support
- Security Consultant

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [GDPR Compliance Guide](https://gdpr.eu/)

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-21 | 1.0.0 | Initial remediation guide |
