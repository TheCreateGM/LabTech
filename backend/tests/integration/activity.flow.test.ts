import request from 'supertest';
import express, { Express } from 'express';
import { activityLogRepository } from '../../src/repositories/ActivityLogRepository';
import { activityTrackingService } from '../../src/services/ActivityTrackingService';

// Mock dependencies
jest.mock('../../src/repositories/ActivityLogRepository');
jest.mock('../../src/services/ActivityTrackingService');

describe('Activity Logging Flow Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    // Create minimal Express app for testing
    app = express();
    app.use(express.json());

    // Mock routes for testing
    app.post('/api/v1/activities', async (req, res) => {
      try {
        const { userId, action, resourceType, resourcePath, metadata, ipAddress, userAgent } = req.body;

        await activityTrackingService.logActivity(
          userId,
          action,
          resourceType,
          resourcePath,
          metadata,
          ipAddress,
          userAgent
        );

        res.status(201).json({ message: 'Activity logged successfully' });
      } catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to log activity' } });
      }
    });

    app.get('/api/v1/activities', async (req, res) => {
      try {
        const { page = 1, limit = 50, userId, startDate, endDate, action, resourcePath } = req.query;

        const filters: any = {};
        if (userId) filters.userId = userId as string;
        if (action) filters.action = action as string;
        if (resourcePath) filters.resourcePath = resourcePath as string;
        if (startDate) filters.startDate = new Date(startDate as string);
        if (endDate) filters.endDate = new Date(endDate as string);

        const result = await activityLogRepository.findAllWithFilters(filters, {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
        });

        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve activities' } });
      }
    });

    app.get('/api/v1/activities/export', async (req, res) => {
      try {
        const { format = 'json', userId, startDate, endDate, action } = req.query;

        const filters: any = {};
        if (userId) filters.userId = userId as string;
        if (action) filters.action = action as string;
        if (startDate) filters.startDate = new Date(startDate as string);
        if (endDate) filters.endDate = new Date(endDate as string);

        if (format === 'csv') {
          const csv = await activityLogRepository.exportToCSV(filters);
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', 'attachment; filename=activities.csv');
          res.status(200).send(csv);
        } else {
          const json = await activityLogRepository.exportToJSON(filters);
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', 'attachment; filename=activities.json');
          res.status(200).send(json);
        }
      } catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to export activities' } });
      }
    });

    app.get('/api/v1/activities/stats', async (req, res) => {
      try {
        const { startDate, endDate } = req.query;

        const filters: any = {};
        if (startDate) filters.startDate = new Date(startDate as string);
        if (endDate) filters.endDate = new Date(endDate as string);

        const stats = await activityLogRepository.getStatistics(filters);

        res.status(200).json(stats);
      } catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get statistics' } });
      }
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Activity', () => {
    it('should log activity successfully', async () => {
      (activityTrackingService.logActivity as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/v1/activities')
        .send({
          userId: 'user-123',
          action: 'read',
          resourceType: 'file',
          resourcePath: '/path/to/file.txt',
          metadata: { size: 1024 },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Activity logged successfully');
      expect(activityTrackingService.logActivity).toHaveBeenCalledWith(
        'user-123',
        'read',
        'file',
        '/path/to/file.txt',
        { size: 1024 },
        '192.168.1.1',
        'Mozilla/5.0'
      );
    });

    it('should handle logging errors', async () => {
      (activityTrackingService.logActivity as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/v1/activities')
        .send({
          userId: 'user-123',
          action: 'read',
          resourceType: 'file',
          resourcePath: '/path/to/file.txt',
        });

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Retrieve Activities', () => {
    it('should retrieve paginated activities', async () => {
      const mockActivities = {
        data: [
          {
            id: 'log-1',
            user_id: 'user-123',
            action: 'read',
            resource_type: 'file',
            resource_path: '/file1.txt',
            metadata: null,
            ip_address: '192.168.1.1',
            user_agent: 'Mozilla/5.0',
            timestamp: new Date(),
          },
          {
            id: 'log-2',
            user_id: 'user-123',
            action: 'write',
            resource_type: 'file',
            resource_path: '/file2.txt',
            metadata: null,
            ip_address: '192.168.1.1',
            user_agent: 'Mozilla/5.0',
            timestamp: new Date(),
          },
        ],
        total: 2,
        page: 1,
        limit: 50,
        totalPages: 1,
      };

      (activityLogRepository.findAllWithFilters as jest.Mock).mockResolvedValue(mockActivities);

      const response = await request(app).get('/api/v1/activities').query({ page: 1, limit: 50 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockActivities);
    });

    it('should filter activities by user', async () => {
      const mockActivities = {
        data: [
          {
            id: 'log-1',
            user_id: 'user-123',
            action: 'read',
            resource_type: 'file',
            resource_path: '/file1.txt',
            metadata: null,
            ip_address: '192.168.1.1',
            user_agent: 'Mozilla/5.0',
            timestamp: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      };

      (activityLogRepository.findAllWithFilters as jest.Mock).mockResolvedValue(mockActivities);

      const response = await request(app).get('/api/v1/activities').query({ userId: 'user-123' });

      expect(response.status).toBe(200);
      expect(activityLogRepository.findAllWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-123' }),
        expect.any(Object)
      );
    });

    it('should filter activities by date range', async () => {
      const mockActivities = {
        data: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
      };

      (activityLogRepository.findAllWithFilters as jest.Mock).mockResolvedValue(mockActivities);

      const response = await request(app)
        .get('/api/v1/activities')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        });

      expect(response.status).toBe(200);
      expect(activityLogRepository.findAllWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        }),
        expect.any(Object)
      );
    });
  });

  describe('Export Activities', () => {
    it('should export activities as CSV', async () => {
      const mockCSV = 'ID,User ID,Action,Resource Type,Resource Path,IP Address,User Agent,Timestamp\nlog-1,user-123,read,file,/file1.txt,192.168.1.1,Mozilla/5.0,2024-01-01T00:00:00.000Z';

      (activityLogRepository.exportToCSV as jest.Mock).mockResolvedValue(mockCSV);

      const response = await request(app).get('/api/v1/activities/export').query({ format: 'csv' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('activities.csv');
      expect(response.text).toBe(mockCSV);
    });

    it('should export activities as JSON', async () => {
      const mockJSON = JSON.stringify([
        {
          id: 'log-1',
          user_id: 'user-123',
          action: 'read',
          resource_type: 'file',
          resource_path: '/file1.txt',
          metadata: null,
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      ]);

      (activityLogRepository.exportToJSON as jest.Mock).mockResolvedValue(mockJSON);

      const response = await request(app).get('/api/v1/activities/export').query({ format: 'json' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('activities.json');
      expect(response.text).toBe(mockJSON);
    });

    it('should export with filters', async () => {
      const mockJSON = JSON.stringify([]);

      (activityLogRepository.exportToJSON as jest.Mock).mockResolvedValue(mockJSON);

      const response = await request(app)
        .get('/api/v1/activities/export')
        .query({
          format: 'json',
          userId: 'user-123',
          action: 'read',
        });

      expect(response.status).toBe(200);
      expect(activityLogRepository.exportToJSON).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          action: 'read',
        })
      );
    });
  });

  describe('Activity Statistics', () => {
    it('should retrieve activity statistics', async () => {
      const mockStats = {
        totalActivities: 100,
        actionBreakdown: {
          read: 60,
          write: 30,
          delete: 10,
        },
        resourceTypeBreakdown: {
          file: 80,
          folder: 20,
        },
        topUsers: [
          { user_id: 'user-123', count: 50 },
          { user_id: 'user-456', count: 30 },
        ],
        topResources: [
          { resource_path: '/file1.txt', count: 25 },
          { resource_path: '/file2.txt', count: 20 },
        ],
      };

      (activityLogRepository.getStatistics as jest.Mock).mockResolvedValue(mockStats);

      const response = await request(app).get('/api/v1/activities/stats');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStats);
    });

    it('should retrieve statistics with date filter', async () => {
      const mockStats = {
        totalActivities: 50,
        actionBreakdown: { read: 30, write: 20 },
        resourceTypeBreakdown: { file: 50 },
        topUsers: [],
        topResources: [],
      };

      (activityLogRepository.getStatistics as jest.Mock).mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/v1/activities/stats')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        });

      expect(response.status).toBe(200);
      expect(activityLogRepository.getStatistics).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        })
      );
    });
  });

  describe('Complete Activity Flow', () => {
    it('should complete full flow: create -> retrieve -> filter -> export', async () => {
      // Step 1: Create activity
      (activityTrackingService.logActivity as jest.Mock).mockResolvedValue(undefined);

      const createResponse = await request(app)
        .post('/api/v1/activities')
        .send({
          userId: 'user-123',
          action: 'read',
          resourceType: 'file',
          resourcePath: '/test-file.txt',
        });

      expect(createResponse.status).toBe(201);

      // Step 2: Retrieve activities
      const mockActivities = {
        data: [
          {
            id: 'log-1',
            user_id: 'user-123',
            action: 'read',
            resource_type: 'file',
            resource_path: '/test-file.txt',
            metadata: null,
            ip_address: null,
            user_agent: null,
            timestamp: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      };

      (activityLogRepository.findAllWithFilters as jest.Mock).mockResolvedValue(mockActivities);

      const retrieveResponse = await request(app).get('/api/v1/activities');

      expect(retrieveResponse.status).toBe(200);
      expect(retrieveResponse.body.data).toHaveLength(1);

      // Step 3: Filter by user
      const filterResponse = await request(app).get('/api/v1/activities').query({ userId: 'user-123' });

      expect(filterResponse.status).toBe(200);

      // Step 4: Export as CSV
      const mockCSV = 'ID,User ID,Action\nlog-1,user-123,read';
      (activityLogRepository.exportToCSV as jest.Mock).mockResolvedValue(mockCSV);

      const exportResponse = await request(app).get('/api/v1/activities/export').query({ format: 'csv' });

      expect(exportResponse.status).toBe(200);
      expect(exportResponse.headers['content-type']).toContain('text/csv');
    });
  });
});
