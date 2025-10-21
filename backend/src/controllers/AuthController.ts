import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';
import { loginAttemptTracker, AuthRequest } from '../middleware/auth.middleware';

/**
 * Authentication controller handling user registration, login, and token management
 */
export class AuthController {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Validation rules for user registration
   */
  public registerValidation = [
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    body('role')
      .optional()
      .isIn(['user', 'admin'])
      .withMessage('Role must be either user or admin'),
  ];

  /**
   * Validation rules for user login
   */
  public loginValidation = [
    body('username').trim().notEmpty().withMessage('Username or email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ];

  /**
   * Validation rules for token refresh
   */
  public refreshValidation = [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  ];

  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const { username, email, password, role = 'user' } = req.body;

      // Check if user already exists
      const existingUser = await this.userRepository.findByUsername(username);
      if (existingUser) {
        res.status(409).json({
          error: {
            code: 'USER_EXISTS',
            message: 'Username already exists',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const existingEmail = await this.userRepository.findByEmail(email);
      if (existingEmail) {
        res.status(409).json({
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Email already exists',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Hash password
      const passwordHash = await authService.hashPassword(password);

      // Create user
      const user = await this.userRepository.create({
        username,
        email,
        password_hash: passwordHash,
        role,
        mfa_enabled: false,
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.created_at,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: {
          code: 'REGISTRATION_FAILED',
          message: 'Failed to register user',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  /**
   * User login
   * POST /api/v1/auth/login
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const { username, password } = req.body;

      // Find user
      const user = await this.userRepository.findByUsername(username);
      if (!user) {
        await loginAttemptTracker.recordFailedAttempt(username);
        res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid username or password',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Verify password
      const isPasswordValid = await authService.comparePassword(password, user.password_hash);
      if (!isPasswordValid) {
        await loginAttemptTracker.recordFailedAttempt(username);
        res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid username or password',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Reset failed login attempts
      await loginAttemptTracker.resetAttempts(username);

      // Check if MFA is enabled
      if (user.mfa_enabled) {
        // Return temporary token indicating MFA is required
        const tempToken = authService.generateAccessToken({
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        });

        res.status(200).json({
          mfaRequired: true,
          tempToken,
          message: 'MFA verification required',
        });
        return;
      }

      // Generate tokens
      const tokens = authService.generateTokenPair({
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      });

      // Update last login
      await this.userRepository.update(user.id, {
        last_login: new Date(),
      });

      res.status(200).json({
        message: 'Login successful',
        ...tokens,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: {
          code: 'LOGIN_FAILED',
          message: 'Failed to login',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  public refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const { refreshToken } = req.body;

      // Verify refresh token
      const decoded = await authService.verifyToken(refreshToken);

      // Check token type
      if (decoded.type !== 'refresh') {
        res.status(401).json({
          error: {
            code: 'INVALID_TOKEN_TYPE',
            message: 'Invalid token type. Refresh token required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Generate new access token
      const accessToken = authService.generateAccessToken({
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
      });

      res.status(200).json({
        message: 'Token refreshed successfully',
        accessToken,
        expiresIn: 15 * 60, // 15 minutes in seconds
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      res.status(401).json({
        error: {
          code: 'REFRESH_FAILED',
          message: errorMessage,
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  /**
   * User logout
   * POST /api/v1/auth/logout
   */
  public logout = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Extract token from header
      const authHeader = req.headers.authorization;
      const token = authService.extractTokenFromHeader(authHeader);

      if (!token) {
        res.status(400).json({
          error: {
            code: 'TOKEN_REQUIRED',
            message: 'Token is required for logout',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Get token expiry time
      const expirySeconds = authService.getTokenExpiryTime(token);

      // Add token to blacklist
      await authService.blacklistToken(token, expirySeconds);

      res.status(200).json({
        message: 'Logout successful',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: {
          code: 'LOGOUT_FAILED',
          message: 'Failed to logout',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  /**
   * Get current authenticated user info
   * GET /api/v1/auth/me
   */
  public me = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
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

      // Fetch full user details from database
      const user = await this.userRepository.findById(req.user.userId);

      if (!user) {
        res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          mfaEnabled: user.mfa_enabled,
          createdAt: user.created_at,
          lastLogin: user.last_login,
        },
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        error: {
          code: 'FETCH_USER_FAILED',
          message: 'Failed to fetch user information',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
}

// Export singleton instance
export const authController = new AuthController();

