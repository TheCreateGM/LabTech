import request from 'supertest';
import express, { Express } from 'express';
import { authService } from '../../src/services/AuthService';
import { mfaService } from '../../src/services/MFAService';
import { userRepository } from '../../src/repositories/UserRepository';

// Mock dependencies
jest.mock('../../src/repositories/UserRepository');
jest.mock('../../src/services/MFAService');

describe('Authentication Flow Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    // Create minimal Express app for testing
    app = express();
    app.use(express.json());

    // Mock routes for testing
    app.post('/api/v1/auth/register', async (req, res) => {
      try {
        const { username, email, password } = req.body;

        // Check if user exists
        const existingUser = await userRepository.findByUsername(username);
        if (existingUser) {
          return res.status(409).json({
            error: { code: 'USER_EXISTS', message: 'Username already exists' },
          });
        }

        // Hash password
        const passwordHash = await authService.hashPassword(password);

        // Create user
        const user = await userRepository.create({
          username,
          email,
          password_hash: passwordHash,
        });

        res.status(201).json({
          id: user.id,
          username: user.username,
          email: user.email,
        });
      } catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Registration failed' } });
      }
    });

    app.post('/api/v1/auth/login', async (req, res) => {
      try {
        const { username, password } = req.body;

        // Find user
        const user = await userRepository.findByUsername(username);
        if (!user) {
          return res.status(401).json({
            error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' },
          });
        }

        // Verify password
        const isValid = await authService.comparePassword(password, user.password_hash);
        if (!isValid) {
          return res.status(401).json({
            error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' },
          });
        }

        // Check if MFA is enabled
        if (user.mfa_enabled) {
          return res.status(200).json({
            requiresMFA: true,
            userId: user.id,
          });
        }

        // Generate tokens
        const tokens = authService.generateTokenPair({
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        });

        res.status(200).json(tokens);
      } catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Login failed' } });
      }
    });

    app.post('/api/v1/auth/mfa/verify', async (req, res) => {
      try {
        const { userId, token } = req.body;

        // Find user
        const user = await userRepository.findById(userId);
        if (!user || !user.mfa_secret) {
          return res.status(401).json({
            error: { code: 'INVALID_MFA', message: 'MFA verification failed' },
          });
        }

        // Verify MFA token
        const result = mfaService.verifyToken(token, user.mfa_secret);
        if (!result.verified) {
          return res.status(401).json({
            error: { code: 'INVALID_MFA', message: result.message },
          });
        }

        // Generate tokens
        const tokens = authService.generateTokenPair({
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        });

        res.status(200).json(tokens);
      } catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'MFA verification failed' } });
      }
    });

    app.post('/api/v1/auth/logout', async (req, res) => {
      try {
        const authHeader = req.headers.authorization;
        const token = authService.extractTokenFromHeader(authHeader);

        if (token) {
          const expiryTime = authService.getTokenExpiryTime(token);
          await authService.blacklistToken(token, expiryTime);
        }

        res.status(200).json({ message: 'Logged out successfully' });
      } catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Logout failed' } });
      }
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'newuser',
        email: 'new@example.com',
        password_hash: 'hashed-password',
        role: 'user' as const,
        mfa_secret: null,
        mfa_enabled: false,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: null,
      };

      (userRepository.findByUsername as jest.Mock).mockResolvedValue(null);
      (userRepository.create as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'SecurePassword123!',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: 'user-123',
        username: 'newuser',
        email: 'new@example.com',
      });
    });

    it('should reject registration with existing username', async () => {
      const existingUser = {
        id: 'user-existing',
        username: 'existinguser',
        email: 'existing@example.com',
        password_hash: 'hashed-password',
        role: 'user' as const,
        mfa_secret: null,
        mfa_enabled: false,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: null,
      };

      (userRepository.findByUsername as jest.Mock).mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'existinguser',
          email: 'new@example.com',
          password: 'SecurePassword123!',
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('USER_EXISTS');
    });
  });

  describe('User Login', () => {
    it('should login successfully without MFA', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        role: 'user' as const,
        mfa_secret: null,
        mfa_enabled: false,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: null,
      };

      (userRepository.findByUsername as jest.Mock).mockResolvedValue(mockUser);
      (authService.comparePassword as jest.Mock) = jest.fn().mockResolvedValue(true);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'SecurePassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresIn');
    });

    it('should require MFA when enabled', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        role: 'user' as const,
        mfa_secret: 'mfa-secret',
        mfa_enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: null,
      };

      (userRepository.findByUsername as jest.Mock).mockResolvedValue(mockUser);
      (authService.comparePassword as jest.Mock) = jest.fn().mockResolvedValue(true);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'SecurePassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        requiresMFA: true,
        userId: 'user-123',
      });
    });

    it('should reject invalid credentials', async () => {
      (userRepository.findByUsername as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'nonexistent',
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject wrong password', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        role: 'user' as const,
        mfa_secret: null,
        mfa_enabled: false,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: null,
      };

      (userRepository.findByUsername as jest.Mock).mockResolvedValue(mockUser);
      (authService.comparePassword as jest.Mock) = jest.fn().mockResolvedValue(false);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('MFA Verification', () => {
    it('should verify MFA token and return tokens', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        role: 'user' as const,
        mfa_secret: 'mfa-secret',
        mfa_enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: null,
      };

      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (mfaService.verifyToken as jest.Mock).mockReturnValue({
        verified: true,
        message: 'Token verified successfully',
      });

      const response = await request(app)
        .post('/api/v1/auth/mfa/verify')
        .send({
          userId: 'user-123',
          token: '123456',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should reject invalid MFA token', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        role: 'user' as const,
        mfa_secret: 'mfa-secret',
        mfa_enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: null,
      };

      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (mfaService.verifyToken as jest.Mock).mockReturnValue({
        verified: false,
        message: 'Invalid token',
      });

      const response = await request(app)
        .post('/api/v1/auth/mfa/verify')
        .send({
          userId: 'user-123',
          token: '999999',
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_MFA');
    });
  });

  describe('User Logout', () => {
    it('should logout successfully and blacklist token', async () => {
      (authService.extractTokenFromHeader as jest.Mock) = jest.fn().mockReturnValue('valid-token');
      (authService.getTokenExpiryTime as jest.Mock) = jest.fn().mockReturnValue(900);
      (authService.blacklistToken as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');
      expect(authService.blacklistToken).toHaveBeenCalledWith('valid-token', 900);
    });

    it('should handle logout without token', async () => {
      (authService.extractTokenFromHeader as jest.Mock) = jest.fn().mockReturnValue(null);

      const response = await request(app).post('/api/v1/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });

  describe('Complete Authentication Flow', () => {
    it('should complete full flow: register -> login -> logout', async () => {
      // Step 1: Register
      const mockUser = {
        id: 'user-new',
        username: 'flowuser',
        email: 'flow@example.com',
        password_hash: 'hashed-password',
        role: 'user' as const,
        mfa_secret: null,
        mfa_enabled: false,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: null,
      };

      (userRepository.findByUsername as jest.Mock).mockResolvedValue(null);
      (userRepository.create as jest.Mock).mockResolvedValue(mockUser);

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'flowuser',
          email: 'flow@example.com',
          password: 'SecurePassword123!',
        });

      expect(registerResponse.status).toBe(201);

      // Step 2: Login
      (userRepository.findByUsername as jest.Mock).mockResolvedValue(mockUser);
      (authService.comparePassword as jest.Mock) = jest.fn().mockResolvedValue(true);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'flowuser',
          password: 'SecurePassword123!',
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('accessToken');

      // Step 3: Logout
      (authService.extractTokenFromHeader as jest.Mock) = jest.fn().mockReturnValue(loginResponse.body.accessToken);
      (authService.getTokenExpiryTime as jest.Mock) = jest.fn().mockReturnValue(900);
      (authService.blacklistToken as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`);

      expect(logoutResponse.status).toBe(200);
    });
  });
});
