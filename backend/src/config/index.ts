import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Application configuration loaded from environment variables
 */
export const config = {
  // Server configuration
  server: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost',
    httpsEnabled: process.env.HTTPS_ENABLED === 'true',
    sslKeyPath: process.env.SSL_KEY_PATH || './keys/server-key.pem',
    sslCertPath: process.env.SSL_CERT_PATH || './keys/server-cert.pem',
    sslCaPath: process.env.SSL_CA_PATH || '',
  },

  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/labtech_geolab',
    poolMin: parseInt(process.env.DATABASE_POOL_MIN || '5', 10),
    poolMax: parseInt(process.env.DATABASE_POOL_MAX || '20', 10),
  },

  // JWT configuration
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'default-access-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-me',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // Redis configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  // Encryption configuration
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'default-key-change-in-production',
    algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:8100',
      'http://localhost:4200',
    ],
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    authMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '10', 10),
  },

  // File system configuration
  fileSystem: {
    scanPath: process.env.FILE_SCAN_PATH || '../src',
    watchEnabled: process.env.FILE_WATCH_ENABLED === 'true',
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
  },

  // MFA configuration
  mfa: {
    issuer: process.env.MFA_ISSUER || 'LabTech GeoLab',
    window: parseInt(process.env.MFA_WINDOW || '1', 10),
  },

  // Backup configuration
  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
    s3Bucket: process.env.BACKUP_S3_BUCKET || '',
  },

  // AWS configuration
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },

  // Monitoring configuration
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN || '',
    prometheusEnabled: process.env.PROMETHEUS_ENABLED === 'true',
  },

  // Sentry configuration
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.SENTRY_RELEASE || '',
    environment: process.env.NODE_ENV || 'development',
  },
};

/**
 * Validate required environment variables
 */
export function validateConfig(): void {
  const requiredVars = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0 && config.server.env === 'production') {
    throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
  }

  if (missing.length > 0) {
    console.warn(`Warning: Missing environment variables (using defaults): ${missing.join(', ')}`);
  }
}

export default config;
