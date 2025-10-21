# Authentication System Documentation

## Overview

This document describes the authentication and authorization system implemented for the LabTech GeoLab backend. The system provides secure user authentication using JWT tokens with RS256 signing, multi-factor authentication (MFA) using TOTP, and comprehensive security features including rate limiting and account lockout.

## Features

- **JWT Authentication**: RS256-signed tokens with access and refresh token support
- **Multi-Factor Authentication (MFA)**: TOTP-based MFA using Google Authenticator or similar apps
- **Password Security**: Bcrypt hashing with 12 salt rounds
- **Token Blacklisting**: Redis-based token revocation for logout
- **Rate Limiting**: Configurable rate limits for API and authentication endpoints
- **Account Lockout**: Automatic lockout after 5 failed login attempts
- **Role-Based Access Control**: Support for user and admin roles
- **Encrypted Storage**: MFA secrets encrypted before database storage

## Architecture

### Components

1. **AuthService** (`src/services/AuthService.ts`)
   - JWT token generation and verification
   - Password hashing and comparison
   - Token blacklisting for logout
   - RS256 signing using public/private key pairs

2. **MFAService** (`src/services/MFAService.ts`)
   - TOTP secret generation
   - QR code generation for authenticator apps
   - Token verification with time window
   - Backup code generation
   - Secret encryption/decryption

3. **Authentication Middleware** (`src/middleware/auth.middleware.ts`)
   - `authenticateToken`: Verify JWT on protected routes
   - `requireAdmin`: Check admin role
   - `requireMFA`: Require MFA verification for sensitive operations
   - `checkAccountLockout`: Prevent login during lockout period
   - `LoginAttemptTracker`: Track and manage failed login attempts

4. **Rate Limiting Middleware** (`src/middleware/rateLimiter.middleware.ts`)
   - `apiLimiter`: 100 requests/minute for general API
   - `authLimiter`: 10 requests/minute for auth endpoints
   - `mfaLimiter`: 5 requests/minute for MFA endpoints

5. **Controllers**
   - `AuthController`: Handle registration, login, logout, token refresh
   - `MFAController`: Handle MFA setup, verification, and disable

## API Endpoints

### Public Endpoints

#### Register User
```
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "user"  // optional, defaults to "user"
}

Response (201):
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Login
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "SecurePass123!"
}

Response (200) - Without MFA:
{
  "message": "Login successful",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user"
  }
}

Response (200) - With MFA Enabled:
{
  "mfaRequired": true,
  "tempToken": "eyJhbGc...",
  "message": "MFA verification required"
}
```

#### Refresh Token
```
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

Response (200):
{
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGc...",
  "expiresIn": 900
}
```

### Protected Endpoints (Require Authentication)

#### Logout
```
POST /api/v1/auth/logout
Authorization: Bearer <access_token>

Response (200):
{
  "message": "Logout successful"
}
```

#### Get Current User
```
GET /api/v1/auth/me
Authorization: Bearer <access_token>

Response (200):
{
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "mfaEnabled": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLogin": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Setup MFA
```
POST /api/v1/auth/mfa/setup
Authorization: Bearer <access_token>

Response (200):
{
  "message": "MFA setup initiated. Scan the QR code with your authenticator app",
  "qrCode": "data:image/png;base64,...",
  "secret": "JBSWY3DPEHPK3PXP",
  "backupCodes": [
    "ABCD-1234",
    "EFGH-5678",
    ...
  ],
  "instructions": [
    "1. Scan the QR code with Google Authenticator or similar app",
    "2. Enter the 6-digit code from your app to verify setup",
    "3. Save your backup codes in a secure location"
  ]
}
```

#### Verify MFA
```
POST /api/v1/auth/mfa/verify
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "token": "123456"
}

Response (200) - First time (enabling MFA):
{
  "message": "MFA enabled successfully",
  "mfaEnabled": true
}

Response (200) - During login:
{
  "message": "MFA verification successful",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### Disable MFA
```
POST /api/v1/auth/mfa/disable
Authorization: Bearer <access_token>

Response (200):
{
  "message": "MFA disabled successfully",
  "mfaEnabled": false
}
```

## Security Features

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

### Token Security

- **Access Token**: 15-minute expiry, RS256 signed
- **Refresh Token**: 7-day expiry, RS256 signed
- **Token Blacklisting**: Revoked tokens stored in Redis until natural expiry
- **RS256 Signing**: Asymmetric encryption using RSA key pairs

### Rate Limiting

- **General API**: 100 requests per minute per IP
- **Auth Endpoints**: 10 requests per minute per IP
- **MFA Endpoints**: 5 requests per minute per IP

### Account Lockout

- **Trigger**: 5 failed login attempts
- **Duration**: 15 minutes
- **Tracking**: Redis-based with automatic expiry

### MFA Security

- **Algorithm**: TOTP (Time-based One-Time Password)
- **Time Window**: ±30 seconds (configurable)
- **Secret Storage**: AES-256-GCM encrypted
- **Backup Codes**: SHA-256 hashed (10 codes, 8 characters each)

## Setup Instructions

### 1. Generate RSA Keys

The system requires RSA key pairs for JWT signing. Keys are automatically generated during setup, but you can regenerate them:

```bash
cd backend
mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```

**Important**: Keep `keys/private.pem` secure and never commit it to version control.

### 2. Configure Environment Variables

Update your `.env` file with the following:

```env
# JWT Configuration
JWT_ACCESS_SECRET=your-access-token-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-token-secret-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Redis Configuration (required for token blacklist and lockout)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Encryption Configuration (for MFA secrets)
ENCRYPTION_KEY=your-32-character-encryption-key-change-this
ENCRYPTION_ALGORITHM=aes-256-gcm

# MFA Configuration
MFA_ISSUER=LabTech GeoLab
MFA_WINDOW=1

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=10
```

### 3. Install Redis

The authentication system requires Redis for:
- Token blacklisting (logout)
- Failed login attempt tracking
- Account lockout management

**Install Redis:**

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### 4. Run Database Migrations

Ensure the users table is created:

```bash
npm run migrate:up
```

### 5. Start the Server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Usage Examples

### Basic Authentication Flow

```typescript
// 1. Register a new user
const registerResponse = await fetch('http://localhost:3000/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    email: 'john@example.com',
    password: 'SecurePass123!'
  })
});

// 2. Login
const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    password: 'SecurePass123!'
  })
});

const { accessToken, refreshToken } = await loginResponse.json();

// 3. Access protected endpoint
const userResponse = await fetch('http://localhost:3000/api/v1/auth/me', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// 4. Refresh token when expired
const refreshResponse = await fetch('http://localhost:3000/api/v1/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken })
});

// 5. Logout
await fetch('http://localhost:3000/api/v1/auth/logout', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

### MFA Setup Flow

```typescript
// 1. Login first
const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    password: 'SecurePass123!'
  })
});

const { accessToken } = await loginResponse.json();

// 2. Setup MFA
const setupResponse = await fetch('http://localhost:3000/api/v1/auth/mfa/setup', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

const { qrCode, secret, backupCodes } = await setupResponse.json();

// Display QR code to user
// User scans with Google Authenticator

// 3. Verify MFA token to enable
const verifyResponse = await fetch('http://localhost:3000/api/v1/auth/mfa/verify', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ token: '123456' }) // From authenticator app
});

// MFA is now enabled!
```

### Login with MFA

```typescript
// 1. Initial login
const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    password: 'SecurePass123!'
  })
});

const loginData = await loginResponse.json();

if (loginData.mfaRequired) {
  // 2. Verify MFA token
  const mfaResponse = await fetch('http://localhost:3000/api/v1/auth/mfa/verify', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${loginData.tempToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token: '123456' })
  });

  const { accessToken, refreshToken } = await mfaResponse.json();
  // Now fully authenticated!
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [], // Optional validation errors
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Common Error Codes

- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: Insufficient permissions
- `VALIDATION_ERROR`: Invalid input data
- `INVALID_CREDENTIALS`: Wrong username or password
- `ACCOUNT_LOCKED`: Too many failed login attempts
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `MFA_REQUIRED`: MFA verification needed
- `INVALID_MFA_TOKEN`: Wrong MFA code
- `TOKEN_EXPIRED`: JWT token has expired
- `INVALID_TOKEN`: JWT token is invalid

## Testing

### Manual Testing with cURL

```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123!@#"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"Test123!@#"}'

# Get current user
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Logout
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Troubleshooting

### Redis Connection Issues

If you see "Redis connection error" in logs:

1. Ensure Redis is running: `redis-cli ping` (should return "PONG")
2. Check Redis URL in `.env`: `REDIS_URL=redis://localhost:6379`
3. Verify Redis password if set: `REDIS_PASSWORD=your_password`

### JWT Verification Failures

If tokens are not verifying:

1. Ensure RSA keys exist in `backend/keys/`
2. Check that keys have correct permissions (readable by app)
3. Verify JWT secrets are set in `.env`

### MFA QR Code Not Displaying

If QR codes are not generating:

1. Check that `qrcode` package is installed
2. Verify MFA issuer is set: `MFA_ISSUER=LabTech GeoLab`
3. Ensure encryption key is configured

### Account Lockout Not Working

If account lockout is not triggering:

1. Verify Redis is running and connected
2. Check lockout settings in config
3. Test with: `redis-cli KEYS "account_locked:*"`

## Security Best Practices

1. **Never commit RSA keys** to version control
2. **Use strong encryption keys** (32+ characters, random)
3. **Enable HTTPS** in production
4. **Rotate JWT secrets** periodically
5. **Monitor failed login attempts** for suspicious activity
6. **Keep dependencies updated** for security patches
7. **Use environment-specific configs** (dev/staging/prod)
8. **Enable MFA for admin accounts**
9. **Implement IP whitelisting** for admin endpoints
10. **Regular security audits** and penetration testing

## Future Enhancements

- [ ] Email verification for new accounts
- [ ] Password reset via email
- [ ] OAuth2 integration (Google, GitHub)
- [ ] Session management dashboard
- [ ] Audit logging for authentication events
- [ ] Biometric authentication support
- [ ] Hardware security key support (WebAuthn)
- [ ] IP-based geolocation tracking
- [ ] Suspicious activity alerts

