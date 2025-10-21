import { Request, Response, NextFunction } from 'express';
import {
  authenticateToken,
  requireAdmin,
  requireMFA,
  checkAccountLockout,
  loginAttemptTracker,
  AuthRequest,
} from '../../../src/middleware/auth.middleware';
import { authService } from '../../../src/services/AuthService';

// Mock dependencies
jest.mock('../../../src/services/AuthService');
jest.mock('ioredis');

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      headers: {},
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token and attach user to request', async () => {
      const mockUser = {
        userId: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        type: 'access' as const,
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (authService.extractTokenFromHeader as jest.Mock).mockReturnValue('valid-token');
      (authService.verifyToken as jest.Mock).mockResolvedValue(mockUser);

      await authenticateToken(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      (authService.extractTokenFromHeader as jest.Mock).mockReturnValue(null);

      await authenticateToken(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'UNAUTHORIZED',
            message: 'Authentication token is required',
          }),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      (authService.extractTokenFromHeader as jest.Mock).mockReturnValue('invalid-token');
      (authService.verifyToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      await authenticateToken(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_TOKEN',
            message: 'Invalid token',
          }),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject refresh token when access token required', async () => {
      const mockUser = {
        userId: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        type: 'refresh' as const,
      };

      mockRequest.headers = {
        authorization: 'Bearer refresh-token',
      };

      (authService.extractTokenFromHeader as jest.Mock).mockReturnValue('refresh-token');
      (authService.verifyToken as jest.Mock).mockResolvedValue(mockUser);

      await authenticateToken(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_TOKEN_TYPE',
            message: 'Invalid token type. Access token required',
          }),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should allow admin users', () => {
      mockRequest.user = {
        userId: 'admin-123',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        type: 'access',
      };

      requireAdmin(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow super admin users', () => {
      mockRequest.user = {
        userId: 'superadmin-123',
        username: 'superadmin',
        email: 'superadmin@example.com',
        role: 'super_admin',
        type: 'access',
      };

      requireAdmin(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject regular users', () => {
      mockRequest.user = {
        userId: 'user-123',
        username: 'user',
        email: 'user@example.com',
        role: 'user',
        type: 'access',
      };

      requireAdmin(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'FORBIDDEN',
            message: 'Admin access required',
          }),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated requests', () => {
      requireAdmin(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          }),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireMFA', () => {
    it('should allow requests with MFA verification', async () => {
      mockRequest.user = {
        userId: 'user-123',
        username: 'user',
        email: 'user@example.com',
        role: 'user',
        type: 'access',
      };

      mockRequest.headers = {
        'x-mfa-verified': 'true',
      };

      await requireMFA(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject requests without MFA verification', async () => {
      mockRequest.user = {
        userId: 'user-123',
        username: 'user',
        email: 'user@example.com',
        role: 'user',
        type: 'access',
      };

      await requireMFA(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'MFA_REQUIRED',
            message: 'Multi-factor authentication required for this operation',
          }),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated requests', async () => {
      await requireMFA(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('checkAccountLockout', () => {
    it('should allow requests when account is not locked', async () => {
      mockRequest.body = {
        username: 'testuser',
      };

      (loginAttemptTracker.isAccountLocked as jest.Mock) = jest.fn().mockResolvedValue(false);

      await checkAccountLockout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject requests when account is locked', async () => {
      mockRequest.body = {
        username: 'lockeduser',
      };

      (loginAttemptTracker.isAccountLocked as jest.Mock) = jest.fn().mockResolvedValue(true);
      (loginAttemptTracker.getRemainingLockoutTime as jest.Mock) = jest.fn().mockResolvedValue(600);

      await checkAccountLockout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'ACCOUNT_LOCKED',
            message: expect.stringContaining('temporarily locked'),
            remainingSeconds: 600,
          }),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should continue on error', async () => {
      mockRequest.body = {
        username: 'testuser',
      };

      (loginAttemptTracker.isAccountLocked as jest.Mock) = jest.fn().mockRejectedValue(new Error('Redis error'));

      await checkAccountLockout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
