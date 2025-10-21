import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { config } from '../config';
import logger from '../utils/logger';

/**
 * Redis client for IP blacklist management
 */
const redis = new Redis(config.redis.url, {
  password: config.redis.password || undefined,
});

/**
 * IP Blacklist Manager
 */
class IPBlacklistManager {
  private readonly BLACKLIST_PREFIX = 'ip_blacklist:';
  private readonly VIOLATION_PREFIX = 'ip_violations:';
  private readonly MAX_VIOLATIONS = 10;
  private readonly VIOLATION_WINDOW = 3600; // 1 hour in seconds
  private readonly BLACKLIST_DURATION = 86400; // 24 hours in seconds

  /**
   * Check if IP is blacklisted
   */
  async isBlacklisted(ip: string): Promise<boolean> {
    const key = `${this.BLACKLIST_PREFIX}${ip}`;
    const result = await redis.get(key);
    return result !== null;
  }

  /**
   * Add IP to blacklist
   */
  async blacklistIP(ip: string, reason: string = 'Rate limit violations'): Promise<void> {
    const key = `${this.BLACKLIST_PREFIX}${ip}`;
    await redis.setex(key, this.BLACKLIST_DURATION, reason);
    logger.warn(`IP blacklisted: ${ip} - Reason: ${reason}`);
  }

  /**
   * Remove IP from blacklist
   */
  async removeFromBlacklist(ip: string): Promise<void> {
    const key = `${this.BLACKLIST_PREFIX}${ip}`;
    await redis.del(key);
    logger.info(`IP removed from blacklist: ${ip}`);
  }

  /**
   * Record rate limit violation
   */
  async recordViolation(ip: string): Promise<void> {
    const key = `${this.VIOLATION_PREFIX}${ip}`;
    const violations = await redis.incr(key);

    // Set expiry on first violation
    if (violations === 1) {
      await redis.expire(key, this.VIOLATION_WINDOW);
    }

    // Blacklist if max violations reached
    if (violations >= this.MAX_VIOLATIONS) {
      await this.blacklistIP(ip, `Exceeded ${this.MAX_VIOLATIONS} rate limit violations`);
      await redis.del(key); // Clear violation count
    }
  }

  /**
   * Get violation count for IP
   */
  async getViolationCount(ip: string): Promise<number> {
    const key = `${this.VIOLATION_PREFIX}${ip}`;
    const count = await redis.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  /**
   * Get remaining time until IP is unblacklisted
   */
  async getBlacklistTTL(ip: string): Promise<number> {
    const key = `${this.BLACKLIST_PREFIX}${ip}`;
    const ttl = await redis.ttl(key);
    return Math.max(0, ttl);
  }
}

export const ipBlacklistManager = new IPBlacklistManager();

/**
 * Middleware to check IP blacklist
 */
export const checkIPBlacklist = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    const isBlacklisted = await ipBlacklistManager.isBlacklisted(ip);

    if (isBlacklisted) {
      const ttl = await ipBlacklistManager.getBlacklistTTL(ip);
      const hours = Math.ceil(ttl / 3600);

      logger.warn(`Blocked request from blacklisted IP: ${ip}`);

      res.status(403).json({
        error: {
          code: 'IP_BLACKLISTED',
          message: `Your IP address has been temporarily blocked due to suspicious activity. Please try again in ${hours} hour(s)`,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Error checking IP blacklist:', error);
    next(); // Continue on error to avoid blocking legitimate requests
  }
};

/**
 * General API rate limiter
 * Limits: 100 requests per minute per IP
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later',
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    await ipBlacklistManager.recordViolation(ip);

    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later',
        timestamp: new Date().toISOString(),
      },
    });
  },
  skip: async (req) => {
    // Skip rate limiting for whitelisted IPs (if configured)
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const whitelistedIPs = process.env.WHITELISTED_IPS?.split(',') || [];
    return whitelistedIPs.includes(ip);
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * Limits: 10 requests per minute per IP
 */
export const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMaxRequests,
  message: {
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests, even successful ones
  handler: async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    await ipBlacklistManager.recordViolation(ip);

    res.status(429).json({
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts from this IP, please try again later',
        timestamp: new Date().toISOString(),
      },
    });
  },
});

/**
 * Very strict rate limiter for MFA endpoints
 * Limits: 5 requests per minute per IP
 */
export const mfaLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 5,
  message: {
    error: {
      code: 'MFA_RATE_LIMIT_EXCEEDED',
      message: 'Too many MFA verification attempts, please try again later',
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    await ipBlacklistManager.recordViolation(ip);

    res.status(429).json({
      error: {
        code: 'MFA_RATE_LIMIT_EXCEEDED',
        message: 'Too many MFA verification attempts from this IP, please try again later',
        timestamp: new Date().toISOString(),
      },
    });
  },
});

/**
 * Request size limiter middleware
 * Prevents large payload attacks
 */
export const requestSizeLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);

  if (contentLength > maxSize) {
    res.status(413).json({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: `Request payload exceeds maximum size of ${maxSize / (1024 * 1024)}MB`,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  next();
};

/**
 * Slow down middleware for repeated requests
 * Gradually increases delay for repeated requests from same IP
 */
export const slowDown = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

