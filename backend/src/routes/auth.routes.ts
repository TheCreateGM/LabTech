import { Router } from 'express';
import { authController } from '../controllers/AuthController';
import { mfaController } from '../controllers/MFAController';
import {
  authenticateToken,
  checkAccountLockout,
} from '../middleware/auth.middleware';
import { authLimiter, mfaLimiter } from '../middleware/rateLimiter.middleware';
import { sanitizeInput } from '../middleware/validation.middleware';

/**
 * Authentication routes
 */
const router = Router();

// Apply input sanitization to all routes
router.use(sanitizeInput);

// Public routes with rate limiting
router.post(
  '/register',
  authLimiter,
  authController.registerValidation,
  authController.register
);

router.post(
  '/login',
  authLimiter,
  checkAccountLockout,
  authController.loginValidation,
  authController.login
);

router.post(
  '/refresh',
  authLimiter,
  authController.refreshValidation,
  authController.refresh
);

// Protected routes (require authentication)
router.post('/logout', authenticateToken, authController.logout);

router.get('/me', authenticateToken, authController.me);

// MFA routes
router.post('/mfa/setup', authenticateToken, mfaController.setupValidation, mfaController.setup);

router.post(
  '/mfa/verify',
  authenticateToken,
  mfaLimiter,
  mfaController.verifyValidation,
  mfaController.verify
);

router.post('/mfa/disable', authenticateToken, mfaController.disable);

export default router;

