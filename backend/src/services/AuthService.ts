import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import Redis from 'ioredis';
import { config } from '../config';

/**
 * JWT payload interface
 */
export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

/**
 * Token pair interface
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Authentication service for JWT token management and password hashing
 */
export class AuthService {
  private privateKey: string;
  private publicKey: string;
  private redis: Redis;
  private readonly SALT_ROUNDS = 12;
  private readonly TOKEN_BLACKLIST_PREFIX = 'blacklist:';

  constructor() {
    // Load RSA keys for JWT signing
    const keysPath = path.join(__dirname, '../../keys');
    this.privateKey = fs.readFileSync(path.join(keysPath, 'private.pem'), 'utf8');
    this.publicKey = fs.readFileSync(path.join(keysPath, 'public.pem'), 'utf8');

    // Initialize Redis client for token blacklist
    this.redis = new Redis(config.redis.url, {
      password: config.redis.password || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    this.redis.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }

  /**
   * Generate access token with 15-minute expiry
   * @param payload - User information to encode in token
   * @returns JWT access token
   */
  public generateAccessToken(payload: Omit<JWTPayload, 'type'>): string {
    const tokenPayload: JWTPayload = {
      ...payload,
      type: 'access',
    };

    return jwt.sign(tokenPayload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: config.jwt.accessExpiry,
      issuer: 'labtech-geolab',
      audience: 'labtech-geolab-api',
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token with 7-day expiry
   * @param payload - User information to encode in token
   * @returns JWT refresh token
   */
  public generateRefreshToken(payload: Omit<JWTPayload, 'type'>): string {
    const tokenPayload: JWTPayload = {
      ...payload,
      type: 'refresh',
    };

    return jwt.sign(tokenPayload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: config.jwt.refreshExpiry,
      issuer: 'labtech-geolab',
      audience: 'labtech-geolab-api',
    } as jwt.SignOptions);
  }

  /**
   * Generate both access and refresh tokens
   * @param payload - User information to encode in tokens
   * @returns Token pair with access and refresh tokens
   */
  public generateTokenPair(payload: Omit<JWTPayload, 'type'>): TokenPair {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Calculate expiry time in seconds (15 minutes)
    const expiresIn = 15 * 60;

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Verify and decode JWT token
   * @param token - JWT token to verify
   * @returns Decoded token payload
   * @throws Error if token is invalid or expired
   */
  public async verifyToken(token: string): Promise<JWTPayload> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }

      // Verify token signature and expiry
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer: 'labtech-geolab',
        audience: 'labtech-geolab-api',
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Hash password using bcrypt
   * @param password - Plain text password
   * @returns Hashed password
   */
  public async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare plain text password with hashed password
   * @param password - Plain text password
   * @param hashedPassword - Hashed password from database
   * @returns True if passwords match, false otherwise
   */
  public async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Add token to blacklist (for logout functionality)
   * @param token - JWT token to blacklist
   * @param expirySeconds - Time until token naturally expires
   */
  public async blacklistToken(token: string, expirySeconds: number): Promise<void> {
    const key = `${this.TOKEN_BLACKLIST_PREFIX}${token}`;
    await this.redis.setex(key, expirySeconds, '1');
  }

  /**
   * Check if token is blacklisted
   * @param token - JWT token to check
   * @returns True if token is blacklisted, false otherwise
   */
  public async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `${this.TOKEN_BLACKLIST_PREFIX}${token}`;
    const result = await this.redis.get(key);
    return result !== null;
  }

  /**
   * Extract token from Authorization header
   * @param authHeader - Authorization header value
   * @returns JWT token or null
   */
  public extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Calculate remaining time until token expires
   * @param token - JWT token
   * @returns Remaining seconds until expiry
   */
  public getTokenExpiryTime(token: string): number {
    try {
      const decoded = jwt.decode(token) as jwt.JwtPayload;
      if (!decoded || !decoded.exp) {
        return 0;
      }
      const now = Math.floor(Date.now() / 1000);
      return Math.max(0, decoded.exp - now);
    } catch {
      return 0;
    }
  }

  /**
   * Close Redis connection
   */
  public async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}

// Export singleton instance
export const authService = new AuthService();

