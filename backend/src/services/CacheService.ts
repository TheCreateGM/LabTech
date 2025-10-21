import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * Cache service for managing Redis caching operations
 */
class CacheService {
  private client: Redis | null = null;
  private isConnected = false;

  /**
   * Initialize Redis connection
   */
  public async connect(): Promise<void> {
    if (this.client) {
      logger.info('Redis client already initialized');
      return;
    }

    try {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password || undefined,
        db: config.redis.db,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('error', (error: Error) => {
        logger.error('Redis client error:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      // Test connection
      await this.client.ping();
      logger.info('Redis connection established successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Get value from cache
   */
  public async get<T = any>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      logger.warn('Redis client not available, skipping cache get');
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  public async set(key: string, value: any, ttlSeconds: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      logger.warn('Redis client not available, skipping cache set');
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttlSeconds, serialized);
      return true;
    } catch (error) {
      logger.error(`Error setting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  public async delete(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      logger.warn('Redis client not available, skipping cache delete');
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Error deleting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  public async deletePattern(pattern: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      logger.warn('Redis client not available, skipping cache delete pattern');
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      await this.client.del(...keys);
      return keys.length;
    } catch (error) {
      logger.error(`Error deleting cache pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists in cache
   */
  public async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Error checking cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set pattern - retrieve from cache or compute and cache
   */
  public async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    computeFn: () => Promise<T>
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Compute value
    const value = await computeFn();

    // Cache the computed value
    await this.set(key, value, ttlSeconds);

    return value;
  }

  /**
   * Increment a counter in cache
   */
  public async increment(key: string, ttlSeconds?: number): Promise<number> {
    if (!this.client || !this.isConnected) {
      logger.warn('Redis client not available, skipping cache increment');
      return 0;
    }

    try {
      const value = await this.client.incr(key);
      
      // Set TTL if provided and this is the first increment
      if (ttlSeconds && value === 1) {
        await this.client.expire(key, ttlSeconds);
      }

      return value;
    } catch (error) {
      logger.error(`Error incrementing cache key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  public async getStats(): Promise<{
    connected: boolean;
    keys: number;
    memory: string;
  }> {
    if (!this.client || !this.isConnected) {
      return {
        connected: false,
        keys: 0,
        memory: '0',
      };
    }

    try {
      const dbSize = await this.client.dbsize();
      const info = await this.client.info('memory');
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memory = memoryMatch ? memoryMatch[1].trim() : '0';

      return {
        connected: true,
        keys: dbSize,
        memory,
      };
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return {
        connected: false,
        keys: 0,
        memory: '0',
      };
    }
  }

  /**
   * Flush all cache data (use with caution)
   */
  public async flush(): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      logger.warn('Redis client not available, skipping cache flush');
      return false;
    }

    try {
      await this.client.flushdb();
      logger.info('Cache flushed successfully');
      return true;
    } catch (error) {
      logger.error('Error flushing cache:', error);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      logger.info('Redis connection closed');
    }
  }

  /**
   * Health check for Redis connection
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    message: string;
    details?: any;
  }> {
    try {
      if (!this.client || !this.isConnected) {
        return {
          status: 'unhealthy',
          message: 'Redis client not connected',
        };
      }

      const pong = await this.client.ping();
      const stats = await this.getStats();

      return {
        status: 'healthy',
        message: 'Redis connection is healthy',
        details: {
          ping: pong,
          ...stats,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Cache key builders for consistent naming
export const CacheKeys = {
  // User session cache (TTL: 15 minutes = 900 seconds)
  userSession: (userId: string) => `session:user:${userId}`,
  userSessionTTL: 900,

  // Activity statistics cache (TTL: 5 minutes = 300 seconds)
  activityStats: () => `stats:activity:global`,
  activityStatsByUser: (userId: string) => `stats:activity:user:${userId}`,
  activityStatsTTL: 300,

  // File metadata cache (TTL: 1 hour = 3600 seconds)
  fileMetadata: (path: string) => `file:metadata:${path}`,
  fileMetadataList: () => `file:metadata:list`,
  fileMetadataTTL: 3600,

  // User data cache
  user: (userId: string) => `user:${userId}`,
  userByUsername: (username: string) => `user:username:${username}`,
  userByEmail: (email: string) => `user:email:${email}`,
  userTTL: 900,

  // Rate limiting
  rateLimit: (ip: string, endpoint: string) => `ratelimit:${ip}:${endpoint}`,
};
