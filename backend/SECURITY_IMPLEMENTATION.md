# Security and Encryption Implementation

This document describes the security features implemented for the LabTech GeoLab user tracking system, including field-level encryption, HTTPS/TLS configuration, and GDPR compliance.

## Overview

The security implementation includes three main components:
1. **Field-Level Encryption** - AES-256-GCM encryption for sensitive data
2. **HTTPS/TLS Configuration** - TLS 1.3 support with security headers
3. **GDPR Compliance** - Data privacy and user rights management

## 1. Field-Level Encryption

### EncryptionService

**Location**: `src/services/EncryptionService.ts`

The EncryptionService provides AES-256-GCM encryption for sensitive fields in the database.

#### Key Features:
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Unique IVs**: Each encryption uses a unique 128-bit initialization vector
- **Authentication Tags**: 128-bit authentication tags for data integrity
- **Key Derivation**: Uses scrypt for key derivation from environment variable

#### Methods:
- `encrypt(data, key?)` - Encrypt data with optional custom key
- `decrypt(encryptedData, key?)` - Decrypt data with optional custom key
- `generateIV()` - Generate random initialization vector
- `encryptFields(obj, fields)` - Encrypt specific fields in an object
- `decryptFields(obj, fields)` - Decrypt specific fields in an object
- `hash(data)` - One-way SHA-256 hash for checksums
- `generateToken(length)` - Generate secure random tokens

#### Encrypted Fields:
The following sensitive fields are encrypted before storage:
- `user_id` in activity_logs table
- `resource_path` in activity_logs table

#### Configuration:
```env
ENCRYPTION_KEY=your-32-character-encryption-key-change-this
ENCRYPTION_ALGORITHM=aes-256-gcm
```

#### Usage Example:
```typescript
import encryptionService from './services/EncryptionService';

// Encrypt a single value
const encrypted = encryptionService.encrypt('sensitive-data');

// Decrypt a value
const decrypted = encryptionService.decrypt(encrypted);

// Encrypt multiple fields
const user = { id: '123', email: 'user@example.com' };
const encrypted = encryptionService.encryptFields(user, ['id', 'email']);
```

### Integration with ActivityLogRepository

The ActivityLogRepository automatically encrypts sensitive fields before storage and decrypts them when retrieving data:

```typescript
// Encryption happens automatically in create()
const log = await activityLogRepository.create({
  user_id: 'user-123',
  resource_path: '/path/to/file',
  action: 'read',
  // ... other fields
});

// Decryption happens automatically when retrieving
const logs = await activityLogRepository.findAllWithFilters({});
// logs contain decrypted user_id and resource_path
```

## 2. HTTPS/TLS Configuration

### Server Configuration

**Location**: `src/index.ts`

The server supports both HTTP and HTTPS modes with TLS 1.3.

#### Features:
- **TLS 1.3**: Latest TLS version for maximum security
- **Strong Cipher Suites**: Only secure ciphers enabled
- **Certificate Loading**: Supports file-based certificates or Let's Encrypt
- **Automatic Fallback**: Falls back to HTTP if certificates fail to load

#### Configuration:
```env
HTTPS_ENABLED=true
SSL_KEY_PATH=./keys/server-key.pem
SSL_CERT_PATH=./keys/server-cert.pem
SSL_CA_PATH=./keys/ca-cert.pem  # Optional
```

#### Cipher Suites:
- TLS_AES_256_GCM_SHA384
- TLS_CHACHA20_POLY1305_SHA256
- TLS_AES_128_GCM_SHA256

### Security Headers

**Helmet Middleware Configuration**:

```typescript
helmet({
  // HTTP Strict Transport Security (1 year)
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // X-Frame-Options: DENY
  frameguard: { action: 'deny' },
  // X-Content-Type-Options: nosniff
  noSniff: true,
  // X-XSS-Protection
  xssFilter: true,
  // Referrer-Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
})
```

### Secure Cookie Configuration

**Location**: `src/utils/cookieConfig.ts`

Utility functions for secure cookie settings:

```typescript
// Cookie options
{
  httpOnly: true,      // Prevents XSS attacks
  secure: true,        // HTTPS only
  sameSite: 'strict',  // Prevents CSRF attacks
  maxAge: 900000,      // 15 minutes for access tokens
  path: '/',
}
```

#### Functions:
- `getSecureCookieOptions()` - Base secure cookie configuration
- `getAccessTokenCookieOptions()` - Short-lived token cookies (15 min)
- `getRefreshTokenCookieOptions()` - Long-lived token cookies (7 days)
- `getClearCookieOptions()` - Options for clearing cookies

## 3. GDPR Compliance

### Database Migration

**Location**: `migrations/1761043621562_add-gdpr-consent-fields.js`

Adds GDPR-related fields to the users table:
- `consent_given` - Boolean flag for user consent
- `consent_date` - Timestamp when consent was given
- `data_retention_date` - Date when data should be deleted if consent not renewed

Creates `gdpr_audit_logs` table for tracking GDPR operations:
- User data exports
- Data deletion requests
- Data anonymization
- Consent changes

### GDPRService

**Location**: `src/services/GDPRService.ts`

Implements GDPR compliance features for data privacy.

#### Methods:

##### exportUserData(userId, performedBy?, ipAddress?, userAgent?)
Exports all user data in JSON format (GDPR Right to Access).

Returns:
```typescript
{
  user: { /* user profile */ },
  activityLogs: [ /* all activity logs */ ],
  gdprAuditLogs: [ /* GDPR audit history */ ],
  exportDate: Date,
  exportedBy: string
}
```

##### deleteUserData(userId, performedBy?, ipAddress?, userAgent?)
Deletes all user data (GDPR Right to Erasure).

Actions:
- Anonymizes activity logs (sets user_id to NULL)
- Deletes admin sessions
- Deletes user account
- Logs deletion in audit log

##### anonymizeUserData(userId, performedBy?, ipAddress?, userAgent?)
Anonymizes user data (alternative to deletion).

Actions:
- Replaces username with `anonymous_<timestamp>`
- Replaces email with `anonymous_<timestamp>@deleted.local`
- Clears password and MFA settings
- Anonymizes activity logs
- Logs anonymization in audit log

##### recordConsent(userId, consentGiven, ipAddress?, userAgent?)
Records user consent for data processing.

Actions:
- Updates consent_given flag
- Sets consent_date
- Sets data_retention_date (1 year from consent)
- Logs consent action in audit log

##### hasConsent(userId)
Checks if user has given consent.

##### getExpiredDataRetentionUsers()
Returns list of users whose data retention period has expired.

### GDPRController

**Location**: `src/controllers/GDPRController.ts`

HTTP endpoints for GDPR operations.

#### Endpoints:

##### POST /api/v1/gdpr/export
Export user data as JSON file.

**Authentication**: Required  
**Response**: JSON file download

##### DELETE /api/v1/gdpr/delete
Delete all user data.

**Authentication**: Required  
**Response**: Success message

##### POST /api/v1/gdpr/anonymize
Anonymize user data.

**Authentication**: Required  
**Response**: Success message

##### POST /api/v1/gdpr/consent
Record user consent.

**Authentication**: Required  
**Body**: `{ consentGiven: boolean }`  
**Response**: Consent status

##### GET /api/v1/gdpr/consent
Get user consent status.

**Authentication**: Required  
**Response**: `{ userId, consentGiven, timestamp }`

### GDPR Routes

**Location**: `src/routes/gdpr.routes.ts`

All GDPR routes require authentication via JWT token.

## Security Best Practices

### 1. Encryption Keys
- Store encryption keys in environment variables
- Use strong, randomly generated keys (32+ characters)
- Rotate keys periodically (recommended: every 90 days)
- Never commit keys to version control

### 2. SSL/TLS Certificates
- Use certificates from trusted Certificate Authorities
- Enable automatic renewal (e.g., Let's Encrypt)
- Keep private keys secure and never expose them
- Use strong key sizes (2048-bit RSA minimum, 4096-bit recommended)

### 3. GDPR Compliance
- Obtain explicit user consent before tracking
- Provide clear privacy policy
- Honor data deletion requests within 30 days
- Maintain audit logs of all GDPR operations
- Implement data retention policies
- Regular review of stored data

### 4. General Security
- Keep dependencies updated
- Run security audits regularly (`npm audit`)
- Use rate limiting on all endpoints
- Implement proper error handling (don't leak sensitive info)
- Log security events
- Monitor for suspicious activity

## Testing

### Encryption Testing
```bash
# Test encryption service
npm test -- EncryptionService.test.ts
```

### HTTPS Testing
```bash
# Generate self-signed certificate for testing
openssl req -x509 -newkey rsa:4096 -keyout keys/server-key.pem -out keys/server-cert.pem -days 365 -nodes

# Start server with HTTPS
HTTPS_ENABLED=true npm run dev
```

### GDPR Testing
```bash
# Test GDPR endpoints
curl -X POST http://localhost:3000/api/v1/gdpr/export \
  -H "Authorization: Bearer <token>"

curl -X POST http://localhost:3000/api/v1/gdpr/consent \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"consentGiven": true}'
```

## Deployment Checklist

- [ ] Generate strong encryption key
- [ ] Obtain valid SSL/TLS certificates
- [ ] Configure HTTPS_ENABLED=true
- [ ] Set up certificate auto-renewal
- [ ] Enable HSTS in production
- [ ] Configure secure cookie domain
- [ ] Run database migrations
- [ ] Test GDPR endpoints
- [ ] Review security headers
- [ ] Enable monitoring and alerting
- [ ] Document data retention policies
- [ ] Train staff on GDPR procedures

## Troubleshooting

### Encryption Issues
- **Error: "ENCRYPTION_KEY environment variable is required"**
  - Set ENCRYPTION_KEY in .env file
  
- **Error: "Failed to decrypt data"**
  - Verify encryption key hasn't changed
  - Check data format (should be iv:authTag:encryptedData)

### HTTPS Issues
- **Error: "Failed to load SSL certificates"**
  - Verify certificate paths are correct
  - Check file permissions
  - Ensure certificates are valid

- **Server falls back to HTTP**
  - Check SSL_KEY_PATH and SSL_CERT_PATH
  - Verify certificate files exist
  - Check server logs for details

### GDPR Issues
- **Error: "User not found"**
  - Verify user ID is correct
  - Check user exists in database

- **Export fails**
  - Check database connectivity
  - Verify user has activity logs
  - Check disk space for export file

## References

- [OWASP Security Guidelines](https://owasp.org/)
- [GDPR Official Text](https://gdpr-info.eu/)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [TLS 1.3 Specification](https://tools.ietf.org/html/rfc8446)
