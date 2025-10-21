import { AuthService, JWTPayload } from '../../../src/services/AuthService';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Mock dependencies
jest.mock('fs');
jest.mock('ioredis');
jest.mock('jsonwebtoken');
jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let mockRedis: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock fs.readFileSync for RSA keys
    const fs = require('fs');
    fs.readFileSync = jest.fn((path: string) => {
      if (path.includes('private.pem')) {
        return 'mock-private-key';
      }
      return 'mock-public-key';
    });

    // Mock Redis
    const Redis = require('ioredis');
    mockRedis = {
      setex: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      quit: jest.fn().mockResolvedValue('OK'),
      on: jest.fn(),
    };
    Redis.mockImplementation(() => mockRedis);

    authService = new AuthService();
  });

  afterEach(async () => {
    await authService.disconnect();
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const payload = {
        userId: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      };

      const mockToken = 'mock-access-token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const token = authService.generateAccessToken(payload);

      expect(token).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          ...payload,
          type: 'access',
        }),
        'mock-private-key',
        expect.objectContaining({
          algorithm: 'RS256',
          issuer: 'labtech-geolab',
          audience: 'labtech-geolab-api',
        })
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const payload = {
        userId: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      };

      const mockToken = 'mock-refresh-token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const token = authService.generateRefreshToken(payload);

      expect(token).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          ...payload,
          type: 'refresh',
        }),
        'mock-private-key',
        expect.objectContaining({
          algorithm: 'RS256',
        })
      );
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const payload = {
        userId: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      };

      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('mock-access-token')
        .mockReturnValueOnce('mock-refresh-token');

      const tokenPair = authService.generateTokenPair(payload);

      expect(tokenPair).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 900, // 15 minutes in seconds
      });
      expect(jwt.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', async () => {
      const mockPayload: JWTPayload = {
        userId: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        type: 'access',
      };

      mockRedis.get.mockResolvedValue(null); // Not blacklisted
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = await authService.verifyToken('valid-token');

      expect(result).toEqual(mockPayload);
      expect(mockRedis.get).toHaveBeenCalledWith('blacklist:valid-token');
      expect(jwt.verify).toHaveBeenCalledWith(
        'valid-token',
        'mock-public-key',
        expect.objectContaining({
          algorithms: ['RS256'],
        })
      );
    });

    it('should throw error for blacklisted token', async () => {
      mockRedis.get.mockResolvedValue('1'); // Blacklisted

      await expect(authService.verifyToken('blacklisted-token')).rejects.toThrow(
        'Token has been revoked'
      );
    });

    it('should throw error for expired token', async () => {
      mockRedis.get.mockResolvedValue(null);
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });

      await expect(authService.verifyToken('expired-token')).rejects.toThrow(
        'Token has expired'
      );
    });

    it('should throw error for invalid token', async () => {
      mockRedis.get.mockResolvedValue(null);
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      await expect(authService.verifyToken('invalid-token')).rejects.toThrow('Invalid token');
    });
  });

  describe('hashPassword', () => {
    it('should hash password using bcrypt', async () => {
      const password = 'mySecurePassword123';
      const hashedPassword = 'hashed-password';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await authService.hashPassword(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      const password = 'mySecurePassword123';
      const hashedPassword = 'hashed-password';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.comparePassword(password, hashedPassword);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'wrongPassword';
      const hashedPassword = 'hashed-password';

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.comparePassword(password, hashedPassword);

      expect(result).toBe(false);
    });
  });

  describe('blacklistToken', () => {
    it('should add token to blacklist with expiry', async () => {
      const token = 'token-to-blacklist';
      const expirySeconds = 900;

      await authService.blacklistToken(token, expirySeconds);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        `blacklist:${token}`,
        expirySeconds,
        '1'
      );
    });
  });

  describe('isTokenBlacklisted', () => {
    it('should return true for blacklisted token', async () => {
      mockRedis.get.mockResolvedValue('1');

      const result = await authService.isTokenBlacklisted('blacklisted-token');

      expect(result).toBe(true);
    });

    it('should return false for non-blacklisted token', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await authService.isTokenBlacklisted('valid-token');

      expect(result).toBe(false);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const authHeader = 'Bearer my-jwt-token';

      const result = authService.extractTokenFromHeader(authHeader);

      expect(result).toBe('my-jwt-token');
    });

    it('should return null for missing header', () => {
      const result = authService.extractTokenFromHeader(undefined);

      expect(result).toBeNull();
    });

    it('should return null for invalid header format', () => {
      const result = authService.extractTokenFromHeader('InvalidFormat token');

      expect(result).toBeNull();
    });
  });

  describe('getTokenExpiryTime', () => {
    it('should return remaining seconds until expiry', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      (jwt.decode as jest.Mock).mockReturnValue({ exp: futureTime });

      const result = authService.getTokenExpiryTime('valid-token');

      expect(result).toBeGreaterThan(3500);
      expect(result).toBeLessThanOrEqual(3600);
    });

    it('should return 0 for expired token', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      (jwt.decode as jest.Mock).mockReturnValue({ exp: pastTime });

      const result = authService.getTokenExpiryTime('expired-token');

      expect(result).toBe(0);
    });

    it('should return 0 for invalid token', () => {
      (jwt.decode as jest.Mock).mockReturnValue(null);

      const result = authService.getTokenExpiryTime('invalid-token');

      expect(result).toBe(0);
    });
  });
});
