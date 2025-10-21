import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { mfaService } from '../services/MFAService';
import { authService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';
import { AuthRequest } from '../middleware/auth.middleware';
import { config } from '../config';

/**
 * MFA controller handling multi-factor authentication setup and verification
 */
export class MFAController {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Validation rules for MFA setup
   */
  public setupValidation = [];

  /**
   * Validation rules for MFA verification
   */
  public verifyValidation = [
    body('token')
      .trim()
      .notEmpty()
      .withMessage('MFA token is required')
      .matches(/^\d{6}$/)
      .withMessage('Token must be 6 digits'),
  ];

  /**
   * Setup MFA for authenticated user
   * POST /api/v1/auth/mfa/setup
   */
  public setup = async (req: AuthRequest, res: Response): Promise<void> => {
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

      // Get user from database
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

      // Check if MFA is already enabled
      if (user.mfa_enabled) {
        res.status(400).json({
          error: {
            code: 'MFA_ALREADY_ENABLED',
            message: 'MFA is already enabled for this account',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Generate MFA secret
      const mfaData = await mfaService.generateSecret(user.username, user.email);

      // Encrypt secret before storing
      const encryptedSecret = mfaService.encryptSecret(mfaData.secret, config.encryption.key);

      // Store encrypted secret in database (but don't enable MFA yet)
      await this.userRepository.update(user.id, {
        mfa_secret: encryptedSecret,
      });

      // In a real implementation, hash and store backup codes in a separate table
      // For now, we'll just return them to the user
      // const hashedBackupCodes = mfaData.backupCodes.map((code) =>
      //   mfaService.hashBackupCode(code)
      // );

      res.status(200).json({
        message: 'MFA setup initiated. Scan the QR code with your authenticator app',
        qrCode: mfaData.qrCodeUrl,
        secret: mfaData.secret, // Show secret for manual entry
        backupCodes: mfaData.backupCodes,
        instructions: [
          '1. Scan the QR code with Google Authenticator or similar app',
          '2. Enter the 6-digit code from your app to verify setup',
          '3. Save your backup codes in a secure location',
        ],
      });
    } catch (error) {
      console.error('MFA setup error:', error);
      res.status(500).json({
        error: {
          code: 'MFA_SETUP_FAILED',
          message: 'Failed to setup MFA',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  /**
   * Verify MFA token and complete setup or login
   * POST /api/v1/auth/mfa/verify
   */
  public verify = async (req: AuthRequest, res: Response): Promise<void> => {
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

      const { token } = req.body;

      // Get user from database
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

      // Check if user has MFA secret
      if (!user.mfa_secret) {
        res.status(400).json({
          error: {
            code: 'MFA_NOT_SETUP',
            message: 'MFA is not setup for this account',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Decrypt MFA secret
      const decryptedSecret = mfaService.decryptSecret(user.mfa_secret, config.encryption.key);

      // Verify token
      const verificationResult = mfaService.verifyToken(token, decryptedSecret);

      if (!verificationResult.verified) {
        res.status(401).json({
          error: {
            code: 'INVALID_MFA_TOKEN',
            message: verificationResult.message || 'Invalid MFA token',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // If MFA was not enabled yet, enable it now
      if (!user.mfa_enabled) {
        await this.userRepository.update(user.id, {
          mfa_enabled: true,
        });

        res.status(200).json({
          message: 'MFA enabled successfully',
          mfaEnabled: true,
        });
        return;
      }

      // If this is a login verification, generate full tokens
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
        message: 'MFA verification successful',
        ...tokens,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('MFA verification error:', error);
      res.status(500).json({
        error: {
          code: 'MFA_VERIFICATION_FAILED',
          message: 'Failed to verify MFA token',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  /**
   * Disable MFA for authenticated user
   * POST /api/v1/auth/mfa/disable
   */
  public disable = async (req: AuthRequest, res: Response): Promise<void> => {
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

      // Get user from database
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

      // Check if MFA is enabled
      if (!user.mfa_enabled) {
        res.status(400).json({
          error: {
            code: 'MFA_NOT_ENABLED',
            message: 'MFA is not enabled for this account',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Disable MFA and clear secret
      await this.userRepository.update(user.id, {
        mfa_enabled: false,
        mfa_secret: null,
      });

      res.status(200).json({
        message: 'MFA disabled successfully',
        mfaEnabled: false,
      });
    } catch (error) {
      console.error('MFA disable error:', error);
      res.status(500).json({
        error: {
          code: 'MFA_DISABLE_FAILED',
          message: 'Failed to disable MFA',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
}

// Export singleton instance
export const mfaController = new MFAController();

