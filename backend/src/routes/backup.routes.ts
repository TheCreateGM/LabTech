import { Router } from 'express';
import { BackupController } from '../controllers/BackupController';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { sanitizeInput } from '../middleware/validation.middleware';

const router = Router();
const backupController = new BackupController();

/**
 * Backup Management Routes
 * All routes require admin authentication and input sanitization
 */

// Apply input sanitization to all routes
router.use(sanitizeInput);

// Get backup statistics
router.get('/stats', authenticateToken, requireAdmin, backupController.getStats);

// Get backup history
router.get('/history', authenticateToken, requireAdmin, backupController.getHistory);

// Generate backup report
router.get('/report', authenticateToken, requireAdmin, backupController.getReport);

// Trigger manual backup
router.post('/trigger', authenticateToken, requireAdmin, backupController.triggerBackup);

export default router;
