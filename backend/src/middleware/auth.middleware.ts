import { Request, Response, NextFunction } from 'express';
import { authService, JWTPayload } from '../services/AuthService';
import Redis from 'ioredis';
import { config } from '../config';

/**
 * Extended Request interface with user information
 */
export interface AuthRequest extends Request {
  user?: JWTPayload;
}

/**
 * Failed login attempt tracking
 */
class LoginAttemptTracker {
  private redis: Redis;
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60; // 15 minutes in seconds
  private readonly ATTEMPT_PREFIX = 'login_attempts:';
  private readonly LOCKOUT_PREFIX = 'account_locked:';

  constructor() {
    this.redis = new Redis(config.redis.url, {
      password: config.redis.password || undefined,
    });
  }

  /**
   * Record failed login attempt
   * @param identifier - Username or email
   */
  async recordFailedAttempt(identifier: string): Promise<void> {
    const key = `${this.ATTEMPT_PREFIX}${identifier}`;
    const attempts = await this.redis.incr(key);

    // Set expiry on first attempt
    if (attempts === 1) {
      await this.redis.expire(key, this.LOCKOUT_DURATION);
    }

    // Lock account if max attempts reached
    if (attempts >= this.MAX_ATTEMPTS) {
      await this.lockAccount(identifier);
    }
  }

  /**
   * Lock account after too many failed attempts
   * @param identifier - Username or email
   */
  async lockAccount(identifier: string): Promise<void> {
    const key = `${this.LOCKOUT_PREFIX}${identifier}`;
    await this.redis.setex(key, this.LOCKOUT_DURATION, '1');
  }

  /**
   * Check if account is locked
   * @param identifier - Username or email
   * @returns True if account is locked
   */
  async isAccountLocked(identifier: string): Promise<boolean> {
    const key = `${this.LOCKOUT_PREFIX}${identifier}`;
    const result = await this.redis.get(key);
    return result !== null;
  }

  /**
   * Get remaining lockout time
   * @param identifier - Username or email
   * @returns Remaining seconds until unlock
   */
  async getRemainingLockoutTime(identifier: string): Promise<number> {
    const key = `${this.LOCKOUT_PREFIX}${identifier}`;
    const ttl = await this.redis.ttl(key);
    return Math.max(0, ttl);
  }

  /**
   * Reset failed attempts after successful login
   * @param identifier - Username or email
   */
  async resetAttempts(identifier: string): Promise<void> {
    const attemptKey = `${this.ATTEMPT_PREFIX}${identifier}`;
    const lockoutKey = `${this.LOCKOUT_PREFIX}${identifier}`;
    await this.redis.del(attemptKey, lockoutKey);
  }

  /**
   * Get current attempt count
   * @param identifier - Username or email
   * @returns Number of failed attempts
   */
  async getAttemptCount(identifier: string): Promise<number> {
    const key = `${this.ATTEMPT_PREFIX}${identifier}`;
    const count = await this.redis.get(key);
    return count ? parseInt(count, 10) : 0;
  }
}

// Export singleton instance
export const loginAttemptTracker = new LoginAttemptTracker();

/**
 * Middleware to authenticate JWT token
 */
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authService.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token is required',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Verify token
    const decoded = await authService.verifyToken(token);

    // Check token type
    if (decoded.type !== 'access') {
      res.status(401).json({
        error: {
          code: 'INVALID_TOKEN_TYPE',
          message: 'Invalid token type. Access token required',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Token verification failed';

    res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * Middleware to require admin role
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  next();
};

/**
 * Middleware to require MFA verification for sensitive operations
 */
export const requireMFA = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Check if user has MFA enabled (this would typically come from database)
  // For now, we'll check if there's an MFA verification header
  const mfaVerified = req.headers['x-mfa-verified'];

  if (!mfaVerified || mfaVerified !== 'true') {
    res.status(403).json({
      error: {
        code: 'MFA_REQUIRED',
        message: 'Multi-factor authentication required for this operation',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  next();
};

/**
 * Middleware to check account lockout status
 */
export const checkAccountLockout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, email } = req.body;
    const identifier = username || email;

    if (!identifier) {
      next();
      return;
    }

    const isLocked = await loginAttemptTracker.isAccountLocked(identifier);

    if (isLocked) {
      const remainingTime = await loginAttemptTracker.getRemainingLockoutTime(identifier);
      const minutes = Math.ceil(remainingTime / 60);

      res.status(429).json({
        error: {
          code: 'ACCOUNT_LOCKED',
          message: `Account is temporarily locked due to too many failed login attempts. Please try again in ${minutes} minute(s)`,
          remainingSeconds: remainingTime,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error checking account lockout:', error);
    next();
  }
};

