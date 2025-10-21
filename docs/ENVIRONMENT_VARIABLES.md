# Environment Variables Reference

Complete reference for all environment variables used in the LabTech GeoLab User Tracking System.

## Table of Contents

- [Application Configuration](#application-configuration)
- [Database Configuration](#database-configuration)
- [Redis Configuration](#redis-configuration)
- [Authentication & Security](#authentication--security)
- [CORS & Rate Limiting](#cors--rate-limiting)
- [Monitoring & Logging](#monitoring--logging)
- [AWS Configuration](#aws-configuration)
- [Email Configuration](#email-configuration)
- [Feature Flags](#feature-flags)

## Application Configuration

### NODE_ENV
- **Required**: Yes
- **Type**: String
- **Values**: `development`, `production`, `test`
- **Default**: `development`
- **Description**: Application environment mode
- **Example**: `NODE_ENV=production`

### PORT
- **Required**: No
- **Type**: Number
- **Default**: `3000`
- **Description**: Port number for the API server
- **Example**: `PORT=3000`

### API_VERSION
- **Required**: No
- **Type**: String
- **Default**: `v1`
- **Description**: API version prefix
- **Example**: `API_VERSION=v1`

### LOG_LEVEL
- **Required**: No
- **Type**: String
- **Values**: `debug`, `info`, `warn`, `error`
- **Default**: `info`
- **Description**: Logging level
- **Example**: `LOG_LEVEL=debug`

## Database Configuration

### DATABASE_URL
- **Required**: Yes
- **Type**: String (Connection URL)
- **Description**: PostgreSQL connection string
- **Format**: `postgresql://user:password@host:port/database`
- **Example**: `DATABASE_URL=postgresql://labtech:password@localhost:5432/labtech_geolab`

### POSTGRES_USER
- **Required**: Yes (for Docker)
- **Type**: String
- **Description**: PostgreSQL username
- **Example**: `POSTGRES_USER=labtech`

### POSTGRES_PASSWORD
- **Required**: Yes (for Docker)
- **Type**: String
- **Description**: PostgreSQL password
- **Security**: Use strong password (min 16 characters)
- **Example**: `POSTGRES_PASSWORD=SecurePassword123!`

### POSTGRES_DB
- **Required**: Yes (for Docker)
- **Type**: String
- **Description**: PostgreSQL database name
- **Example**: `POSTGRES_DB=labtech_geolab`

### DATABASE_POOL_MIN
- **Required**: No
- **Type**: Number
- **Default**: `5`
- **Description**: Minimum number of database connections in pool
- **Example**: `DATABASE_POOL_MIN=5`

### DATABASE_POOL_MAX
- **Required**: No
- **Type**: Number
- **Default**: `20`
- **Description**: Maximum number of database connections in pool
- **Example**: `DATABASE_POOL_MAX=20`

### DATABASE_SSL
- **Required**: No
- **Type**: Boolean
- **Default**: `false`
- **Description**: Enable SSL for database connections
- **Example**: `DATABASE_SSL=true`

## Redis Configuration

### REDIS_URL
- **Required**: Yes
- **Type**: String (Connection URL)
- **Description**: Redis connection string
- **Format**: `redis://[:password@]host:port[/database]`
- **Example**: `REDIS_URL=redis://:password@localhost:6379/0`

### REDIS_PASSWORD
- **Required**: No (but recommended)
- **Type**: String
- **Description**: Redis password
- **Example**: `REDIS_PASSWORD=RedisSecurePass123`

### REDIS_HOST
- **Required**: No (if REDIS_URL is set)
- **Type**: String
- **Default**: `localhost`
- **Description**: Redis host
- **Example**: `REDIS_HOST=redis`

### REDIS_PORT
- **Required**: No
- **Type**: Number
- **Default**: `6379`
- **Description**: Redis port
- **Example**: `REDIS_PORT=6379`

### REDIS_DB
- **Required**: No
- **Type**: Number
- **Default**: `0`
- **Description**: Redis database number
- **Example**: `REDIS_DB=0`

## Authentication & Security

### JWT_SECRET
- **Required**: Yes
- **Type**: String
- **Description**: Secret key for JWT signing (symmetric)
- **Security**: Use cryptographically secure random string (min 32 characters)
- **Generate**: `openssl rand -base64 32`
- **Example**: `JWT_SECRET=your-super-secret-jwt-key-here`

### JWT_PRIVATE_KEY
- **Required**: Yes (for RS256)
- **Type**: String (Base64 encoded)
- **Description**: RSA private key for JWT signing
- **Generate**: 
  ```bash
  openssl genrsa -out private.pem 2048
  cat private.pem | base64 -w 0
  ```
- **Example**: `JWT_PRIVATE_KEY=LS0tLS1CRUdJTi...`

### JWT_PUBLIC_KEY
- **Required**: Yes (for RS256)
- **Type**: String (Base64 encoded)
- **Description**: RSA public key for JWT verification
- **Generate**:
  ```bash
  openssl rsa -in private.pem -pubout -out public.pem
  cat public.pem | base64 -w 0
  ```
- **Example**: `JWT_PUBLIC_KEY=LS0tLS1CRUdJTi...`

### JWT_PRIVATE_KEY_PATH
- **Required**: Alternative to JWT_PRIVATE_KEY
- **Type**: String (File path)
- **Description**: Path to RSA private key file
- **Example**: `JWT_PRIVATE_KEY_PATH=/etc/labtech/keys/private.pem`

### JWT_PUBLIC_KEY_PATH
- **Required**: Alternative to JWT_PUBLIC_KEY
- **Type**: String (File path)
- **Description**: Path to RSA public key file
- **Example**: `JWT_PUBLIC_KEY_PATH=/etc/labtech/keys/public.pem`

### JWT_ACCESS_EXPIRY
- **Required**: No
- **Type**: String (Time span)
- **Default**: `15m`
- **Description**: Access token expiration time
- **Format**: `<number><unit>` where unit is `s`, `m`, `h`, `d`
- **Example**: `JWT_ACCESS_EXPIRY=15m`

### JWT_REFRESH_EXPIRY
- **Required**: No
- **Type**: String (Time span)
- **Default**: `7d`
- **Description**: Refresh token expiration time
- **Example**: `JWT_REFRESH_EXPIRY=7d`

### ENCRYPTION_KEY
- **Required**: Yes
- **Type**: String (Hex)
- **Description**: AES-256 encryption key for sensitive data
- **Security**: Must be exactly 32 bytes (64 hex characters)
- **Generate**: `openssl rand -hex 32`
- **Example**: `ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef`

### SESSION_SECRET
- **Required**: No
- **Type**: String
- **Description**: Secret for session cookies
- **Generate**: `openssl rand -base64 32`
- **Example**: `SESSION_SECRET=your-session-secret-here`

### MFA_ISSUER
- **Required**: No
- **Type**: String
- **Default**: `LabTech GeoLab`
- **Description**: Issuer name for MFA TOTP
- **Example**: `MFA_ISSUER=LabTech GeoLab`

## CORS & Rate Limiting

### CORS_ORIGIN
- **Required**: Yes
- **Type**: String or Array
- **Description**: Allowed CORS origins
- **Format**: Comma-separated URLs or `*` for all
- **Example**: `CORS_ORIGIN=https://labtech-geolab.com,https://www.labtech-geolab.com`

### CORS_CREDENTIALS
- **Required**: No
- **Type**: Boolean
- **Default**: `true`
- **Description**: Allow credentials in CORS requests
- **Example**: `CORS_CREDENTIALS=true`

### RATE_LIMIT_WINDOW_MS
- **Required**: No
- **Type**: Number (milliseconds)
- **Default**: `60000` (1 minute)
- **Description**: Rate limit time window
- **Example**: `RATE_LIMIT_WINDOW_MS=60000`

### RATE_LIMIT_MAX_REQUESTS
- **Required**: No
- **Type**: Number
- **Default**: `100`
- **Description**: Maximum requests per window
- **Example**: `RATE_LIMIT_MAX_REQUESTS=100`

### AUTH_RATE_LIMIT_MAX
- **Required**: No
- **Type**: Number
- **Default**: `10`
- **Description**: Maximum auth requests per window
- **Example**: `AUTH_RATE_LIMIT_MAX=10`

## Monitoring & Logging

### SENTRY_DSN
- **Required**: No (but recommended for production)
- **Type**: String (URL)
- **Description**: Sentry error tracking DSN
- **Example**: `SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/123456`

### SENTRY_ENVIRONMENT
- **Required**: No
- **Type**: String
- **Default**: Value of NODE_ENV
- **Description**: Sentry environment name
- **Example**: `SENTRY_ENVIRONMENT=production`

### SENTRY_TRACES_SAMPLE_RATE
- **Required**: No
- **Type**: Number (0.0 to 1.0)
- **Default**: `0.1`
- **Description**: Percentage of transactions to trace
- **Example**: `SENTRY_TRACES_SAMPLE_RATE=0.1`

### PROMETHEUS_PORT
- **Required**: No
- **Type**: Number
- **Default**: `9090`
- **Description**: Port for Prometheus metrics endpoint
- **Example**: `PROMETHEUS_PORT=9090`

### LOG_FILE_PATH
- **Required**: No
- **Type**: String (File path)
- **Default**: `./logs/app.log`
- **Description**: Path to log file
- **Example**: `LOG_FILE_PATH=/var/log/labtech/app.log`

### LOG_MAX_SIZE
- **Required**: No
- **Type**: String
- **Default**: `10m`
- **Description**: Maximum log file size before rotation
- **Example**: `LOG_MAX_SIZE=10m`

### LOG_MAX_FILES
- **Required**: No
- **Type**: Number
- **Default**: `30`
- **Description**: Maximum number of log files to keep
- **Example**: `LOG_MAX_FILES=30`

## AWS Configuration

### AWS_REGION
- **Required**: Yes (for AWS deployments)
- **Type**: String
- **Description**: AWS region
- **Example**: `AWS_REGION=us-east-1`

### AWS_ACCESS_KEY_ID
- **Required**: Yes (if not using IAM roles)
- **Type**: String
- **Description**: AWS access key ID
- **Security**: Use IAM roles when possible
- **Example**: `AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE`

### AWS_SECRET_ACCESS_KEY
- **Required**: Yes (if not using IAM roles)
- **Type**: String
- **Description**: AWS secret access key
- **Security**: Use IAM roles when possible
- **Example**: `AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

### AWS_S3_BUCKET
- **Required**: Yes (for backups)
- **Type**: String
- **Description**: S3 bucket name for backups
- **Example**: `AWS_S3_BUCKET=labtech-geolab-backups`

### AWS_S3_REGION
- **Required**: No
- **Type**: String
- **Default**: Value of AWS_REGION
- **Description**: S3 bucket region
- **Example**: `AWS_S3_REGION=us-east-1`

## Email Configuration

### SMTP_HOST
- **Required**: No
- **Type**: String
- **Description**: SMTP server hostname
- **Example**: `SMTP_HOST=smtp.gmail.com`

### SMTP_PORT
- **Required**: No
- **Type**: Number
- **Default**: `587`
- **Description**: SMTP server port
- **Example**: `SMTP_PORT=587`

### SMTP_USER
- **Required**: No
- **Type**: String
- **Description**: SMTP username
- **Example**: `SMTP_USER=noreply@labtech-geolab.com`

### SMTP_PASSWORD
- **Required**: No
- **Type**: String
- **Description**: SMTP password
- **Example**: `SMTP_PASSWORD=your-smtp-password`

### SMTP_FROM
- **Required**: No
- **Type**: String (Email)
- **Default**: Value of SMTP_USER
- **Description**: Default sender email address
- **Example**: `SMTP_FROM=LabTech GeoLab <noreply@labtech-geolab.com>`

### SMTP_SECURE
- **Required**: No
- **Type**: Boolean
- **Default**: `true`
- **Description**: Use TLS for SMTP
- **Example**: `SMTP_SECURE=true`

## Feature Flags

### ENABLE_MFA
- **Required**: No
- **Type**: Boolean
- **Default**: `true`
- **Description**: Enable multi-factor authentication
- **Example**: `ENABLE_MFA=true`

### ENABLE_WEBSOCKET
- **Required**: No
- **Type**: Boolean
- **Default**: `true`
- **Description**: Enable WebSocket real-time updates
- **Example**: `ENABLE_WEBSOCKET=true`

### ENABLE_METRICS
- **Required**: No
- **Type**: Boolean
- **Default**: `true`
- **Description**: Enable Prometheus metrics
- **Example**: `ENABLE_METRICS=true`

### ENABLE_SWAGGER
- **Required**: No
- **Type**: Boolean
- **Default**: `true` in development, `false` in production
- **Description**: Enable Swagger API documentation
- **Example**: `ENABLE_SWAGGER=true`

### ENABLE_GDPR
- **Required**: No
- **Type**: Boolean
- **Default**: `true`
- **Description**: Enable GDPR compliance endpoints
- **Example**: `ENABLE_GDPR=true`

## Example .env Files

### Development

```bash
# Application
NODE_ENV=development
PORT=3000
API_VERSION=v1
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://labtech:password@localhost:5432/labtech_geolab
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=dev-secret-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Encryption
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# CORS
CORS_ORIGIN=http://localhost:4200

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000

# Features
ENABLE_SWAGGER=true
ENABLE_METRICS=true
```

### Production

```bash
# Application
NODE_ENV=production
PORT=3000
API_VERSION=v1
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://labtech:SECURE_PASSWORD@db.example.com:5432/labtech_geolab
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
DATABASE_SSL=true

# Redis
REDIS_URL=redis://:REDIS_PASSWORD@redis.example.com:6379/0

# JWT
JWT_SECRET=GENERATE_SECURE_SECRET_HERE
JWT_PRIVATE_KEY=BASE64_ENCODED_PRIVATE_KEY
JWT_PUBLIC_KEY=BASE64_ENCODED_PUBLIC_KEY
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Encryption
ENCRYPTION_KEY=GENERATE_SECURE_32_BYTE_HEX_KEY

# CORS
CORS_ORIGIN=https://labtech-geolab.com,https://www.labtech-geolab.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=10

# Monitoring
SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/123456
SENTRY_ENVIRONMENT=production
PROMETHEUS_PORT=9090

# AWS
AWS_REGION=us-east-1
AWS_S3_BUCKET=labtech-geolab-backups

# Features
ENABLE_MFA=true
ENABLE_WEBSOCKET=true
ENABLE_METRICS=true
ENABLE_SWAGGER=false
ENABLE_GDPR=true
```

## Security Best Practices

1. **Never commit .env files**: Add `.env` to `.gitignore`
2. **Use strong secrets**: Generate cryptographically secure random values
3. **Rotate secrets regularly**: Change JWT secrets and encryption keys periodically
4. **Use environment-specific values**: Different secrets for dev/staging/production
5. **Limit access**: Restrict who can view production environment variables
6. **Use secret management**: Consider AWS Secrets Manager, HashiCorp Vault, or similar
7. **Validate on startup**: Application should validate all required variables on startup
8. **Document changes**: Keep this reference updated when adding new variables

## Validation

The application validates environment variables on startup. Missing required variables will cause the application to exit with an error message.

To test your configuration:

```bash
# Validate environment variables
npm run validate:env

# Or start the application (it will validate automatically)
npm start
```

## Troubleshooting

### Issue: "Missing required environment variable"

**Solution**: Ensure all required variables are set in your `.env` file or environment.

### Issue: "Invalid DATABASE_URL format"

**Solution**: Check the connection string format:
```
postgresql://username:password@host:port/database
```

### Issue: "JWT verification failed"

**Solution**: Ensure JWT_PUBLIC_KEY matches JWT_PRIVATE_KEY. Regenerate both if needed.

### Issue: "Encryption key must be 32 bytes"

**Solution**: Generate a new key:
```bash
openssl rand -hex 32
```

## Additional Resources

- [dotenv Documentation](https://github.com/motdotla/dotenv)
- [Node.js Environment Variables](https://nodejs.org/api/process.html#process_process_env)
- [12-Factor App Config](https://12factor.net/config)
