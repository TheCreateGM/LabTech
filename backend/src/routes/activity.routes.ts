import { Router } from 'express';
import ActivityController from '../controllers/ActivityController';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { sanitizeInput, validatePagination, validateDateRange } from '../middleware/validation.middleware';

const router = Router();

/**
 * Activity tracking routes
 * Base path: /api/v1/activities
 */

// Apply input sanitization to all routes
router.use(sanitizeInput);

// POST /api/v1/activities - Log new activity (authenticated users)
router.post(
  '/',
  authenticateToken,
  ActivityController.createActivityValidation,
  ActivityController.createActivity
);

// GET /api/v1/activities/stats - Get activity statistics (authenticated users)
router.get(
  '/stats',
  authenticateToken,
  ActivityController.getActivityStats
);

// GET /api/v1/activities/export - Export logs (admin only)
router.get(
  '/export',
  authenticateToken,
  requireAdmin,
  ActivityController.exportActivitiesValidation,
  ActivityController.exportActivities
);

// GET /api/v1/activities/queue/stats - Get queue statistics (admin only)
router.get(
  '/queue/stats',
  authenticateToken,
  requireAdmin,
  ActivityController.getQueueStats
);

// GET /api/v1/activities/:id - Get specific activity by ID (authenticated users)
router.get(
  '/:id',
  authenticateToken,
  ActivityController.getActivityByIdValidation,
  ActivityController.getActivityById
);

// GET /api/v1/activities - Get paginated activity logs (authenticated users)
router.get(
  '/',
  authenticateToken,
  validatePagination,
  validateDateRange,
  ActivityController.getActivitiesValidation,
  ActivityController.getActivities
);

export default router;

