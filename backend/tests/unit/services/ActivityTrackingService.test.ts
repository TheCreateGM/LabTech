import { ActivityTrackingService } from '../../../src/services/ActivityTrackingService';
import { activityLogRepository } from '../../../src/repositories/ActivityLogRepository';
import { webSocketService } from '../../../src/services/WebSocketService';
import { userRepository } from '../../../src/repositories/UserRepository';
import { cacheService } from '../../../src/services/CacheService';

// Mock dependencies
jest.mock('../../../src/repositories/ActivityLogRepository');
jest.mock('../../../src/services/WebSocketService');
jest.mock('../../../src/repositories/UserRepository');
jest.mock('../../../src/services/CacheService');
jest.mock('bull');

describe('ActivityTrackingService', () => {
  let activityTrackingService: ActivityTrackingService;
  let mockQueue: any;
  let mockDeadLetterQueue: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Bull Queue
    const Bull = require('bull');
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-123', finished: jest.fn().mockResolvedValue({}) }),
      process: jest.fn(),
      on: jest.fn(),
      getWaitingCount: jest.fn().mockResolvedValue(0),
      getActiveCount: jest.fn().mockResolvedValue(0),
      getCompletedCount: jest.fn().mockResolvedValue(0),
      getFailedCount: jest.fn().mockResolvedValue(0),
      getDelayedCount: jest.fn().mockResolvedValue(0),
      getPausedCount: jest.fn().mockResolvedValue(0),
      getJobs: jest.fn().mockResolvedValue([]),
      close: jest.fn().mockResolvedValue(undefined),
    };

    mockDeadLetterQueue = {
      add: jest.fn().mockResolvedValue({ id: 'dlq-job-123' }),
      getWaitingCount: jest.fn().mockResolvedValue(0),
      getJobs: jest.fn().mockResolvedValue([]),
      close: jest.fn().mockResolvedValue(undefined),
    };

    Bull.mockImplementation(() => mockQueue);
    Bull.mockImplementationOnce(() => mockQueue);
    Bull.mockImplementationOnce(() => mockDeadLetterQueue);

    activityTrackingService = new ActivityTrackingService();
  });

  afterEach(async () => {
    await activityTrackingService.close();
  });

  describe('logActivity', () => {
    it('should add activity to batch queue', async () => {
      await activityTrackingService.logActivity(
        'user-123',
        'read',
        'file',
        '/path/to/file.txt',
        { size: 1024 },
        '192.168.1.1',
        'Mozilla/5.0'
      );

      // Activity should be queued, not immediately processed
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should process batch when size limit reached', async () => {
      // Add 100 activities to trigger batch processing
      for (let i = 0; i < 100; i++) {
        await activityTrackingService.logActivity(
          'user-123',
          'read',
          'file',
          `/path/to/file${i}.txt`
        );
      }

      // Batch should be queued
      expect(mockQueue.add).toHaveBeenCalledWith('batch', expect.any(Array), expect.any(Object));
    });
  });

  describe('logActivityImmediate', () => {
    it('should log activity immediately with high priority', async () => {
      const mockActivityLog = {
        id: 'log-123',
        user_id: 'user-123',
        action: 'delete',
        resource_type: 'file',
        resource_path: '/critical/file.txt',
        metadata: null,
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        timestamp: new Date(),
      };

      const mockJob = {
        id: 'job-123',
        finished: jest.fn().mockResolvedValue(mockActivityLog),
      };

      mockQueue.add.mockResolvedValue(mockJob);

      const result = await activityTrackingService.logActivityImmediate(
        'user-123',
        'delete',
        'file',
        '/critical/file.txt',
        {},
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(mockQueue.add).toHaveBeenCalledWith(
        'single',
        expect.objectContaining({
          user_id: 'user-123',
          action: 'delete',
          resource_type: 'file',
        }),
        expect.objectContaining({ priority: 10 })
      );

      expect(result).toEqual(mockActivityLog);
    });

    it('should throw error if immediate logging fails', async () => {
      mockQueue.add.mockRejectedValue(new Error('Queue error'));

      await expect(
        activityTrackingService.logActivityImmediate(
          'user-123',
          'read',
          'file',
          '/path/to/file.txt'
        )
      ).rejects.toThrow('Queue error');
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      mockQueue.getWaitingCount.mockResolvedValue(5);
      mockQueue.getActiveCount.mockResolvedValue(2);
      mockQueue.getCompletedCount.mockResolvedValue(100);
      mockQueue.getFailedCount.mockResolvedValue(3);
      mockQueue.getDelayedCount.mockResolvedValue(1);
      mockQueue.getPausedCount.mockResolvedValue(0);
      mockDeadLetterQueue.getWaitingCount.mockResolvedValue(2);

      const stats = await activityTrackingService.getQueueStats();

      expect(stats).toEqual({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
        paused: 0,
        deadLetterQueue: 2,
      });
    });
  });

  describe('retryDeadLetterQueue', () => {
    it('should retry failed jobs from dead letter queue', async () => {
      const mockJobs = [
        {
          id: 'dlq-job-1',
          data: { user_id: 'user-123', action: 'read', resource_type: 'file', resource_path: '/file1.txt' },
          remove: jest.fn().mockResolvedValue(undefined),
        },
        {
          id: 'dlq-job-2',
          data: { user_id: 'user-456', action: 'write', resource_type: 'file', resource_path: '/file2.txt' },
          remove: jest.fn().mockResolvedValue(undefined),
        },
      ];

      mockDeadLetterQueue.getJobs.mockResolvedValue(mockJobs);

      const retriedCount = await activityTrackingService.retryDeadLetterQueue(10);

      expect(retriedCount).toBe(2);
      expect(mockQueue.add).toHaveBeenCalledTimes(2);
      expect(mockJobs[0].remove).toHaveBeenCalled();
      expect(mockJobs[1].remove).toHaveBeenCalled();
    });

    it('should handle retry failures gracefully', async () => {
      const mockJobs = [
        {
          id: 'dlq-job-1',
          data: { user_id: 'user-123', action: 'read', resource_type: 'file', resource_path: '/file1.txt' },
          remove: jest.fn().mockResolvedValue(undefined),
        },
      ];

      mockDeadLetterQueue.getJobs.mockResolvedValue(mockJobs);
      mockQueue.add.mockRejectedValue(new Error('Queue error'));

      const retriedCount = await activityTrackingService.retryDeadLetterQueue(10);

      expect(retriedCount).toBe(0);
    });
  });

  describe('flush', () => {
    it('should process pending batch immediately', async () => {
      // Add some activities to batch
      await activityTrackingService.logActivity('user-123', 'read', 'file', '/file1.txt');
      await activityTrackingService.logActivity('user-123', 'read', 'file', '/file2.txt');

      await activityTrackingService.flush();

      // Batch should be queued
      expect(mockQueue.add).toHaveBeenCalledWith('batch', expect.any(Array), expect.any(Object));
    });
  });

  describe('close', () => {
    it('should flush pending batch and close queues', async () => {
      await activityTrackingService.close();

      expect(mockQueue.close).toHaveBeenCalled();
      expect(mockDeadLetterQueue.close).toHaveBeenCalled();
    });
  });
});
