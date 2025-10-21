import { Router } from 'express';
import { gdprController } from '../controllers/GDPRController';
import { authenticateToken } from '../middleware/auth.middleware';
import { body } from 'express-validator';
import { sanitizeInput } from '../middleware/validation.middleware';

const router = Router();

/**
 * All GDPR routes require authentication and input sanitization
 */
router.use(authenticateToken);
router.use(sanitizeInput);

/**
 * @route   POST /api/v1/gdpr/export
 * @desc    Export all user data (GDPR Right to Access)
 * @access  Private (authenticated users)
 */
router.post('/export', (req, res) => gdprController.exportUserData(req, res));

/**
 * @route   DELETE /api/v1/gdpr/delete
 * @desc    Delete all user data (GDPR Right to Erasure)
 * @access  Private (authenticated users)
 */
router.delete('/delete', (req, res) => gdprController.deleteUserData(req, res));

/**
 * @route   POST /api/v1/gdpr/anonymize
 * @desc    Anonymize user data (alternative to deletion)
 * @access  Private (authenticated users)
 */
router.post('/anonymize', (req, res) => gdprController.anonymizeUserData(req, res));

/**
 * @route   POST /api/v1/gdpr/consent
 * @desc    Record user consent for data processing
 * @access  Private (authenticated users)
 */
router.post(
  '/consent',
  [body('consentGiven').isBoolean().withMessage('consentGiven must be a boolean')],
  (req, res) => gdprController.recordConsent(req, res)
);

/**
 * @route   GET /api/v1/gdpr/consent
 * @desc    Get user consent status
 * @access  Private (authenticated users)
 */
router.get('/consent', (req, res) => gdprController.getConsentStatus(req, res));

export default router;
