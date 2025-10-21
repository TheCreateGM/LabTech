# Quick Start Guide - Authentication System

## Prerequisites

1. **PostgreSQL** - Database must be running
2. **Redis** - Required for token blacklist and account lockout
3. **Node.js** - Version 18+ recommended

## Setup Steps

### 1. Install Redis (if not already installed)

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

**Verify Redis is running:**
```bash
redis-cli ping
# Should return: PONG
```

### 2. Configure Environment

Ensure your `.env` file has these settings:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/labtech_geolab

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# JWT (use strong secrets in production!)
JWT_ACCESS_SECRET=your-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-secret-refresh-key-min-32-chars

# Encryption (use strong key in production!)
ENCRYPTION_KEY=your-32-character-encryption-key-here

# MFA
MFA_ISSUER=LabTech GeoLab
```

### 3. Run Database Migrations

```bash
npm run migrate:up
```

### 4. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm run build
npm start
```

Server should start on `http://localhost:3000`

## Testing the Authentication Flow

### Test 1: User Registration

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

**Expected Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid-here",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Test 2: User Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123!@#"
  }'
```

**Expected Response (200):**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "uuid-here",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user"
  }
}
```

**Save the accessToken for next tests!**

### Test 3: Get Current User

```bash
# Replace YOUR_ACCESS_TOKEN with the token from login
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "user": {
    "id": "uuid-here",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user",
    "mfaEnabled": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLogin": "2024-01-01T12:00:00.000Z"
  }
}
```

### Test 4: Setup MFA

```bash
curl -X POST http://localhost:3000/api/v1/auth/mfa/setup \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "message": "MFA setup initiated. Scan the QR code with your authenticator app",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "secret": "JBSWY3DPEHPK3PXP",
  "backupCodes": [
    "ABCD-1234",
    "EFGH-5678",
    ...
  ],
  "instructions": [...]
}
```

**To test MFA:**
1. Copy the `secret` value
2. Add it to Google Authenticator manually, or
3. Save the QR code image and scan it
4. Get the 6-digit code from your authenticator app

### Test 5: Verify MFA Token

```bash
# Replace 123456 with the actual code from your authenticator app
curl -X POST http://localhost:3000/api/v1/auth/mfa/verify \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "123456"
  }'
```

**Expected Response (200):**
```json
{
  "message": "MFA enabled successfully",
  "mfaEnabled": true
}
```

### Test 6: Login with MFA

Now that MFA is enabled, login will require two steps:

**Step 1: Initial login**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123!@#"
  }'
```

**Response (200):**
```json
{
  "mfaRequired": true,
  "tempToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "MFA verification required"
}
```

**Step 2: Verify MFA**
```bash
curl -X POST http://localhost:3000/api/v1/auth/mfa/verify \
  -H "Authorization: Bearer TEMP_TOKEN_FROM_STEP_1" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "123456"
  }'
```

**Response (200):**
```json
{
  "message": "MFA verification successful",
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "uuid-here",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user"
  }
}
```

### Test 7: Refresh Token

```bash
# Replace YOUR_REFRESH_TOKEN with the refresh token from login
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

**Expected Response (200):**
```json
{
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

### Test 8: Logout

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "message": "Logout successful"
}
```

**After logout, the token is blacklisted and cannot be used again.**

### Test 9: Rate Limiting

Try making more than 10 login requests in 1 minute:

```bash
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}'
  echo ""
done
```

**After 10 requests, you should see (429):**
```json
{
  "error": {
    "code": "AUTH_RATE_LIMIT_EXCEEDED",
    "message": "Too many authentication attempts from this IP, please try again later",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Test 10: Account Lockout

Try 5 failed login attempts:

```bash
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser","password":"wrongpassword"}'
  echo ""
done
```

**After 5 failed attempts, you should see (429):**
```json
{
  "error": {
    "code": "ACCOUNT_LOCKED",
    "message": "Account is temporarily locked due to too many failed login attempts. Please try again in 15 minute(s)",
    "remainingSeconds": 900,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Troubleshooting

### Redis Connection Error

**Error:** `Redis connection error: connect ECONNREFUSED`

**Solution:**
```bash
# Check if Redis is running
redis-cli ping

# If not running, start it
brew services start redis  # macOS
sudo systemctl start redis  # Linux
```

### JWT Verification Failed

**Error:** `Invalid token` or `Token verification failed`

**Solution:**
- Ensure RSA keys exist in `backend/keys/`
- Check that keys were generated correctly
- Verify JWT secrets are set in `.env`

### Database Connection Error

**Error:** `Failed to initialize database connection`

**Solution:**
- Check PostgreSQL is running
- Verify `DATABASE_URL` in `.env`
- Run migrations: `npm run migrate:up`

### MFA QR Code Not Displaying

**Error:** QR code is empty or invalid

**Solution:**
- Ensure `qrcode` package is installed
- Check `MFA_ISSUER` is set in `.env`
- Verify encryption key is configured

## Monitoring

### Check Redis Keys

```bash
# View all blacklisted tokens
redis-cli KEYS "blacklist:*"

# View locked accounts
redis-cli KEYS "account_locked:*"

# View login attempts
redis-cli KEYS "login_attempts:*"

# Get specific key value
redis-cli GET "account_locked:testuser"
```

### Check Server Logs

```bash
# Development mode shows detailed logs
npm run dev

# Look for:
# - "Redis connected successfully"
# - "Database connected successfully"
# - "Server running on: http://localhost:3000"
```

## Next Steps

Once authentication is working:

1. ✅ Test all endpoints with Postman or similar tool
2. ✅ Create admin user for testing admin endpoints
3. ✅ Integrate with frontend authentication service
4. ✅ Implement activity tracking endpoints (Task 4)
5. ✅ Build admin dashboard (Task 8)

## Security Checklist

Before deploying to production:

- [ ] Change all default secrets in `.env`
- [ ] Use strong encryption keys (32+ characters)
- [ ] Enable HTTPS/TLS
- [ ] Secure RSA keys (never commit to git)
- [ ] Set up proper CORS origins
- [ ] Configure Redis password
- [ ] Enable rate limiting
- [ ] Set up monitoring and alerts
- [ ] Regular security audits
- [ ] Keep dependencies updated

