# Security Deployment Checklist

Use this checklist before deploying to production to ensure all security measures are properly configured.

## Pre-Deployment Checklist

### 1. Environment Configuration

- [ ] All required environment variables are set
  ```bash
  # Verify with:
  grep -v '^#' .env.example | cut -d '=' -f1 | while read var; do
    if [ -z "${!var}" ]; then
      echo "Missing: $var"
    fi
  done
  ```

- [ ] JWT secrets are strong random strings (min 32 characters)
  ```bash
  # Generate with:
  openssl rand -base64 32
  ```

- [ ] Encryption key is set and secure
- [ ] Database URL uses SSL connection
- [ ] Redis password is set
- [ ] CORS origins are configured for production domains only
- [ ] HTTPS is enabled (`HTTPS_ENABLED=true`)
- [ ] SSL certificates are valid and not expired
- [ ] Sentry DSN is configured (optional but recommended)
- [ ] AWS credentials are set (for backups)

### 2. Security Headers

- [ ] Helmet middleware is enabled
- [ ] HSTS is configured with 1-year max-age
- [ ] Content-Security-Policy is restrictive
- [ ] X-Frame-Options is set to DENY
- [ ] Additional security headers middleware is active

### 3. Rate Limiting

- [ ] General API rate limit is configured (100 req/min)
- [ ] Auth endpoint rate limit is stricter (10 req/min)
- [ ] MFA endpoint rate limit is strictest (5 req/min)
- [ ] IP blacklist system is enabled
- [ ] Request size limit is set (10MB)

### 4. Input Validation

- [ ] Sanitization middleware is applied to all routes
- [ ] express-validator is configured on all endpoints
- [ ] File upload validation is in place (if applicable)
- [ ] SQL injection protection is verified
- [ ] XSS protection is verified

### 5. Authentication & Authorization

- [ ] JWT signing uses RS256 algorithm
- [ ] Access token expiry is 15 minutes
- [ ] Refresh token expiry is 7 days
- [ ] Token blacklist is working (Redis)
- [ ] MFA is available and tested
- [ ] Account lockout is configured (5 failed attempts)
- [ ] Password requirements are enforced

### 6. Database Security

- [ ] Database connection uses SSL
- [ ] Database user has minimal required permissions
- [ ] Parameterized queries are used everywhere
- [ ] Connection pooling is configured
- [ ] Database backups are scheduled

### 7. Encryption

- [ ] TLS 1.3 is enabled for HTTPS
- [ ] AES-256-GCM is used for data at rest
- [ ] Bcrypt is used for password hashing
- [ ] Unique IVs are generated per encrypted record
- [ ] Encryption keys are stored securely (not in code)

### 8. Logging & Monitoring

- [ ] Winston logger is configured
- [ ] Log level is set to 'info' in production
- [ ] Sentry error tracking is enabled
- [ ] Prometheus metrics are exposed
- [ ] Grafana dashboards are set up
- [ ] Security events are logged
- [ ] Log rotation is configured

### 9. GDPR Compliance

- [ ] Data export endpoint is working
- [ ] Data deletion endpoint is working
- [ ] Consent tracking is implemented
- [ ] Privacy policy is available
- [ ] Data retention policies are defined

### 10. File Permissions

- [ ] .env file has 600 permissions
  ```bash
  chmod 600 .env
  ```

- [ ] Private keys have 600 permissions
  ```bash
  chmod 600 keys/private.pem
  ```

- [ ] Public keys have 644 permissions
  ```bash
  chmod 644 keys/public.pem
  ```

### 11. Dependencies

- [ ] npm audit shows no high/critical vulnerabilities
  ```bash
  npm audit --audit-level=high
  ```

- [ ] All dependencies are up to date
  ```bash
  npm outdated
  ```

- [ ] Dependabot is enabled on GitHub
- [ ] Security alerts are configured

### 12. Testing

- [ ] Security test suite passes
  ```bash
  ./scripts/security-test.sh
  ```

- [ ] TypeScript compiles without errors
  ```bash
  npm run build
  ```

- [ ] All unit tests pass
  ```bash
  npm test
  ```

- [ ] Manual security testing completed
  - [ ] SQL injection attempts blocked
  - [ ] XSS attempts blocked
  - [ ] CSRF protection verified
  - [ ] Rate limiting working
  - [ ] Authentication working
  - [ ] Authorization working

### 13. Backup & Recovery

- [ ] Backup scripts are tested
  ```bash
  npm run backup:full
  ```

- [ ] Restore process is documented and tested
- [ ] Backup retention policy is configured
- [ ] Backup monitoring is set up
- [ ] S3 bucket is configured (if using AWS)

### 14. Network Security

- [ ] Firewall rules are configured
- [ ] Only necessary ports are open (443, 80)
- [ ] Database port is not publicly accessible
- [ ] Redis port is not publicly accessible
- [ ] SSH access is restricted

### 15. Documentation

- [ ] Security audit report is reviewed
- [ ] Remediation guide is available
- [ ] Incident response plan is documented
- [ ] Security contacts are defined
- [ ] API documentation is up to date

## Post-Deployment Verification

### Immediate (Within 1 hour)

- [ ] Application is accessible via HTTPS
- [ ] HTTP redirects to HTTPS
- [ ] SSL certificate is valid
- [ ] Security headers are present
  ```bash
  curl -I https://yourdomain.com
  ```

- [ ] Rate limiting is working
  ```bash
  # Test with multiple rapid requests
  for i in {1..20}; do curl https://yourdomain.com/api/v1/health; done
  ```

- [ ] Authentication is working
- [ ] Logs are being written
- [ ] Metrics are being collected
- [ ] No errors in Sentry

### Within 24 hours

- [ ] Monitor logs for errors
- [ ] Check for failed login attempts
- [ ] Verify backup completed successfully
- [ ] Review security metrics
- [ ] Check for unusual traffic patterns

### Within 1 week

- [ ] Run full security audit
- [ ] Review all logs
- [ ] Check for any security alerts
- [ ] Verify all monitoring is working
- [ ] Test disaster recovery procedures

## Security Incident Response

If a security issue is detected:

1. **Immediate Actions:**
   - [ ] Assess severity
   - [ ] Block malicious IPs if identified
   - [ ] Take system offline if critical
   - [ ] Notify security team

2. **Investigation:**
   - [ ] Review logs
   - [ ] Identify attack vector
   - [ ] Assess data exposure
   - [ ] Document timeline

3. **Remediation:**
   - [ ] Patch vulnerabilities
   - [ ] Reset compromised credentials
   - [ ] Notify affected users (if required by GDPR)
   - [ ] Update security measures

4. **Post-Incident:**
   - [ ] Conduct post-mortem
   - [ ] Update security procedures
   - [ ] Implement additional monitoring
   - [ ] Train team on lessons learned

## Maintenance Schedule

### Daily
- [ ] Monitor logs
- [ ] Check Sentry errors
- [ ] Review metrics

### Weekly
- [ ] Run npm audit
- [ ] Run security test suite
- [ ] Review failed logins
- [ ] Check IP blacklist

### Monthly
- [ ] Update dependencies
- [ ] Check SSL expiry
- [ ] Review security config
- [ ] Test backups

### Quarterly
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Key rotation
- [ ] Update documentation

## Emergency Contacts

**Internal:**
- Security Team: security@labtech-geolab.com
- DevOps Team: devops@labtech-geolab.com
- On-Call Engineer: [Phone Number]

**External:**
- Hosting Provider: [Support Contact]
- Database Provider: [Support Contact]
- Security Consultant: [Contact Info]

## Quick Reference Commands

```bash
# Check security status
npm audit
./scripts/security-test.sh

# View logs
tail -f logs/combined.log
tail -f logs/error.log

# Check rate limit violations
grep "RATE_LIMIT_EXCEEDED" logs/combined.log | wc -l

# Check blacklisted IPs
redis-cli KEYS "ip_blacklist:*"

# Manual backup
npm run backup:full

# Check SSL certificate
openssl x509 -in /path/to/cert.pem -noout -dates

# Test HTTPS
curl -I https://yourdomain.com

# Check security headers
curl -I https://yourdomain.com | grep -E "Strict-Transport-Security|Content-Security-Policy|X-Frame-Options"
```

## Sign-Off

**Deployment Date:** _______________

**Deployed By:** _______________

**Reviewed By:** _______________

**Security Approved:** _______________

---

**Notes:**

_Use this space to document any deviations from the checklist or additional security measures implemented:_

_______________________________________________________________________________

_______________________________________________________________________________

_______________________________________________________________________________
