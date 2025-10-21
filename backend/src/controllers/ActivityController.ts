import { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { activityTrackingService } from '../services/ActivityTrackingService';
import {
  activityLogRepository,
  ActivityLogFilters,
  PaginationOptions,
} from '../repositories/ActivityLogRepository';
import { cacheService, CacheKeys } from '../services/CacheService';

/**
 * Controller for activity tracking endpoints
 */
export class ActivityController {
  /**
   * Validation rules for creating activity
   */
  static createActivityValidation = [
    body('action')
      .isString()
      .trim()
      .notEmpty()
      .isIn(['read', 'write', 'delete', 'open', 'download', 'create', 'update', 'view'])
      .withMessage('Action must be one of: read, write, delete, open, download, create, update, view'),
    body('resourceType')
      .isString()
      .trim()
      .notEmpty()
      .isIn(['file', 'folder', 'page', 'api'])
      .withMessage('Resource type must be one of: file, folder, page, api'),
    body('resourcePath')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Resource path is required'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object'),
  ];

  /**
   * Validation rules for getting activities
   */
  static getActivitiesValidation = [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('userId')
      .optional()
      .isUUID()
      .withMessage('User ID must be a valid UUID'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    query('action')
      .optional()
      .isString()
      .trim()
      .withMessage('Action must be a string'),
    query('resourcePath')
      .optional()
      .isString()
      .trim()
      .withMessage('Resource path must be a string'),
  ];

  /**
   * Validation rules for getting activity by ID
   */
  static getActivityByIdValidation = [
    param('id')
      .isUUID()
      .withMessage('Activity ID must be a valid UUID'),
  ];

  /**
   * Validation rules for export
   */
  static exportActivitiesValidation = [
    query('format')
      .optional()
      .isIn(['csv', 'json'])
      .withMessage('Format must be either csv or json'),
    ...ActivityController.getActivitiesValidation,
  ];

  /**
   * POST /api/v1/activities - Log new activity
   */
  static async createActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: errors.array(),
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const { action, resourceType, resourcePath, metadata } = req.body;

      // Get user ID from authenticated request
      const userId = (req as any).user?.id || null;

      // Get client IP and user agent
      const ipAddress = req.ip || req.socket.remoteAddress || null;
      const userAgent = req.get('user-agent') || null;

      // Log activity asynchronously
      await activityTrackingService.logActivity(
        userId,
        action,
        resourceType,
        resourcePath,
        metadata,
        ipAddress || undefined,
        userAgent || undefined
      );

      res.status(202).json({
        message: 'Activity logged successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/activities - Get paginated activity logs
   */
  static async getActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: errors.array(),
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Parse query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const sortBy = (req.query.sortBy as string) || 'timestamp';
      const sortOrder = (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC';

      // Build filters
      const filters: ActivityLogFilters = {};

      if (req.query.userId) {
        filters.userId = req.query.userId as string;
      }

      if (req.query.action) {
        filters.action = req.query.action as string;
      }

      if (req.query.resourceType) {
        filters.resourceType = req.query.resourceType as string;
      }

      if (req.query.resourcePath) {
        filters.resourcePath = req.query.resourcePath as string;
      }

      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      if (req.query.ipAddress) {
        filters.ipAddress = req.query.ipAddress as string;
      }

      // Build pagination options
      const pagination: PaginationOptions = {
        page,
        limit,
        sortBy,
        sortOrder,
      };

      // Get activities
      const result = await activityLogRepository.findAllWithFilters(filters, pagination);

      res.status(200).json({
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/activities/:id - Get specific activity by ID
   */
  static async getActivityById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: errors.array(),
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const { id } = req.params;

      // Get activity
      const activity = await activityLogRepository.findById(id);

      if (!activity) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Activity not found',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(200).json({
        data: activity,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/activities/export - Export logs as CSV or JSON
   */
  static async exportActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: errors.array(),
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const format = (req.query.format as string) || 'json';

      // Build filters
      const filters: ActivityLogFilters = {};

      if (req.query.userId) {
        filters.userId = req.query.userId as string;
      }

      if (req.query.action) {
        filters.action = req.query.action as string;
      }

      if (req.query.resourceType) {
        filters.resourceType = req.query.resourceType as string;
      }

      if (req.query.resourcePath) {
        filters.resourcePath = req.query.resourcePath as string;
      }

      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      // Export data
      let exportData: string;
      let contentType: string;
      let filename: string;

      if (format === 'csv') {
        exportData = await activityLogRepository.exportToCSV(filters);
        contentType = 'text/csv';
        filename = `activity-logs-${Date.now()}.csv`;
      } else {
        exportData = await activityLogRepository.exportToJSON(filters);
        contentType = 'application/json';
        filename = `activity-logs-${Date.now()}.json`;
      }

      // Set headers for file download
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', Buffer.byteLength(exportData));

      // Stream response
      res.status(200).send(exportData);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/activities/stats - Get activity statistics
   */
  static async getActivityStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Build filters
      const filters: ActivityLogFilters = {};

      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      // Try to get from cache first
      const cacheKey = CacheKeys.activityStats();
      const stats = await cacheService.getOrSet(
        cacheKey,
        CacheKeys.activityStatsTTL,
        async () => {
          return await activityLogRepository.getStatistics(filters);
        }
      );

      res.status(200).json({
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/activities/queue/stats - Get queue statistics (admin only)
   */
  static async getQueueStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await activityTrackingService.getQueueStats();

      res.status(200).json({
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ActivityController;

