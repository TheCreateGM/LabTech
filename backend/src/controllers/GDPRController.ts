import { Response } from 'express';
import { gdprService } from '../services/GDPRService';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * GDPR Controller for handling data privacy requests
 */
export class GDPRController {
  /**
   * Export user data (GDPR Right to Access)
   * POST /api/v1/gdpr/export
   */
  async exportUserData(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Get client information
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      // Export user data
      const exportData = await gdprService.exportUserData(userId, userId, ipAddress, userAgent);

      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="user-data-export-${userId}-${Date.now()}.json"`
      );

      res.status(200).json(exportData);
    } catch (error) {
      console.error('Error exporting user data:', error);
      res.status(500).json({
        error: {
          code: 'EXPORT_FAILED',
          message: 'Failed to export user data',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Delete user data (GDPR Right to Erasure)
   * DELETE /api/v1/gdpr/delete
   */
  async deleteUserData(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Get client information
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      // Delete user data
      await gdprService.deleteUserData(userId, userId, ipAddress, userAgent);

      res.status(200).json({
        message: 'User data has been successfully deleted',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error deleting user data:', error);
      res.status(500).json({
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete user data',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Anonymize user data (alternative to deletion)
   * POST /api/v1/gdpr/anonymize
   */
  async anonymizeUserData(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Get client information
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      // Anonymize user data
      await gdprService.anonymizeUserData(userId, userId, ipAddress, userAgent);

      res.status(200).json({
        message: 'User data has been successfully anonymized',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error anonymizing user data:', error);
      res.status(500).json({
        error: {
          code: 'ANONYMIZE_FAILED',
          message: 'Failed to anonymize user data',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Record user consent
   * POST /api/v1/gdpr/consent
   */
  async recordConsent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { consentGiven } = req.body;

      if (!userId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      if (typeof consentGiven !== 'boolean') {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'consentGiven must be a boolean value',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Get client information
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      // Record consent
      await gdprService.recordConsent(userId, consentGiven, ipAddress, userAgent);

      res.status(200).json({
        message: `User consent has been ${consentGiven ? 'granted' : 'withdrawn'}`,
        consentGiven,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error recording consent:', error);
      res.status(500).json({
        error: {
          code: 'CONSENT_FAILED',
          message: 'Failed to record consent',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Check user consent status
   * GET /api/v1/gdpr/consent
   */
  async getConsentStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const hasConsent = await gdprService.hasConsent(userId);

      res.status(200).json({
        userId,
        consentGiven: hasConsent,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error checking consent status:', error);
      res.status(500).json({
        error: {
          code: 'CONSENT_CHECK_FAILED',
          message: 'Failed to check consent status',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}

// Export singleton instance
export const gdprController = new GDPRController();
