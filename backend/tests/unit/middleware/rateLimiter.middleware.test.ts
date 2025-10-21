import { Request, Response, NextFunction } from 'express';
import { checkIPBlacklist, ipBlacklistManager } from '../../../src/middleware/rateLimiter.middleware';

// Mock dependencies
jest.mock('ioredis');
jest.mock('../../../src/utils/logger');

describe('Rate Limiter Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      ip: '192.168.1.1',
      socket: {
        remoteAddress: '192.168.1.1',
      } as any,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('checkIPBlacklist', () => {
    it('should allow requests from non-blacklisted IPs', async () => {
      (ipBlacklistManager.isBlacklisted as jest.Mock) = jest.fn().mockResolvedValue(false);

      await checkIPBlacklist(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block requests from blacklisted IPs', async () => {
      (ipBlacklistManager.isBlacklisted as jest.Mock) = jest.fn().mockResolvedValue(true);
      (ipBlacklistManager.getBlacklistTTL as jest.Mock) = jest.fn().mockResolvedValue(3600);

      await checkIPBlacklist(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'IP_BLACKLISTED',
            message: expect.stringContaining('temporarily blocked'),
          }),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should continue on error', async () => {
      (ipBlacklistManager.isBlacklisted as jest.Mock) = jest.fn().mockRejectedValue(new Error('Redis error'));

      await checkIPBlacklist(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('IPBlacklistManager', () => {
    let manager: typeof ipBlacklistManager;
    let mockRedis: any;

    beforeEach(() => {
      const Redis = require('ioredis');
      mockRedis = {
        get: jest.fn(),
        setex: jest.fn(),
        del: jest.fn(),
        incr: jest.fn(),
        expire: jest.fn(),
        ttl: jest.fn(),
      };
      Redis.mockImplementation(() => mockRedis);

      // Create new instance for testing
      manager = new (ipBlacklistManager.constructor as any)();
    });

    describe('isBlacklisted', () => {
      it('should return true for blacklisted IP', async () => {
        mockRedis.get.mockResolvedValue('Rate limit violations');

        const result = await manager.isBlacklisted('192.168.1.1');

        expect(result).toBe(true);
        expect(mockRedis.get).toHaveBeenCalledWith('ip_blacklist:192.168.1.1');
      });

      it('should return false for non-blacklisted IP', async () => {
        mockRedis.get.mockResolvedValue(null);

        const result = await manager.isBlacklisted('192.168.1.1');

        expect(result).toBe(false);
      });
    });

    describe('blacklistIP', () => {
      it('should add IP to blacklist', async () => {
        mockRedis.setex.mockResolvedValue('OK');

        await manager.blacklistIP('192.168.1.1', 'Test reason');

        expect(mockRedis.setex).toHaveBeenCalledWith(
          'ip_blacklist:192.168.1.1',
          86400,
          'Test reason'
        );
      });
    });

    describe('removeFromBlacklist', () => {
      it('should remove IP from blacklist', async () => {
        mockRedis.del.mockResolvedValue(1);

        await manager.removeFromBlacklist('192.168.1.1');

        expect(mockRedis.del).toHaveBeenCalledWith('ip_blacklist:192.168.1.1');
      });
    });

    describe('recordViolation', () => {
      it('should record violation and set expiry on first violation', async () => {
        mockRedis.incr.mockResolvedValue(1);
        mockRedis.expire.mockResolvedValue(1);

        await manager.recordViolation('192.168.1.1');

        expect(mockRedis.incr).toHaveBeenCalledWith('ip_violations:192.168.1.1');
        expect(mockRedis.expire).toHaveBeenCalledWith('ip_violations:192.168.1.1', 3600);
      });

      it('should blacklist IP after max violations', async () => {
        mockRedis.incr.mockResolvedValue(10);
        mockRedis.setex.mockResolvedValue('OK');
        mockRedis.del.mockResolvedValue(1);

        await manager.recordViolation('192.168.1.1');

        expect(mockRedis.setex).toHaveBeenCalledWith(
          'ip_blacklist:192.168.1.1',
          86400,
          expect.stringContaining('Exceeded')
        );
        expect(mockRedis.del).toHaveBeenCalledWith('ip_violations:192.168.1.1');
      });
    });

    describe('getViolationCount', () => {
      it('should return violation count', async () => {
        mockRedis.get.mockResolvedValue('5');

        const result = await manager.getViolationCount('192.168.1.1');

        expect(result).toBe(5);
      });

      it('should return 0 if no violations', async () => {
        mockRedis.get.mockResolvedValue(null);

        const result = await manager.getViolationCount('192.168.1.1');

        expect(result).toBe(0);
      });
    });

    describe('getBlacklistTTL', () => {
      it('should return remaining TTL', async () => {
        mockRedis.ttl.mockResolvedValue(3600);

        const result = await manager.getBlacklistTTL('192.168.1.1');

        expect(result).toBe(3600);
      });

      it('should return 0 for negative TTL', async () => {
        mockRedis.ttl.mockResolvedValue(-1);

        const result = await manager.getBlacklistTTL('192.168.1.1');

        expect(result).toBe(0);
      });
    });
  });
});
