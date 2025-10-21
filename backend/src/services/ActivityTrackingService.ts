import Queue, { Job, Queue as BullQueue } from 'bull';
import { config } from '../config';
import {
  activityLogRepository,
  CreateActivityLogData,
  ActivityLog,
} from '../repositories/ActivityLogRepository';
import { webSocketService, ActivityEvent } from './WebSocketService';
import { userRepository } from '../repositories/UserRepository';
import { cacheService, CacheKeys } from './CacheService';

/**
 * Activity tracking service configuration
 */
interface ActivityTrackingConfig {
  batchSize: number;
  batchInterval: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
  backoffMultiplier: number;
}

/**
 * Job data for activity logging
 */
interface ActivityJobData extends CreateActivityLogData {
  attemptNumber?: number;
}

/**
 * Service for tracking user activities with async queue processing
 */
export class ActivityTrackingService {
  private queue: BullQueue<ActivityJobData>;
  private deadLetterQueue: BullQueue<ActivityJobData>;
  private batchQueue: ActivityJobData[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private serviceConfig: ActivityTrackingConfig;

  constructor() {
    this.serviceConfig = {
      batchSize: 100,
      batchInterval: 5000, // 5 seconds
      maxRetries: 3,
      retryDelay: 1000, // 1 second
      backoffMultiplier: 2,
    };

    // Initialize Bull queue with Redis connection
    const redisConfig = {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      db: config.redis.db || 0,
    };

    this.queue = new Queue<ActivityJobData>('activity-logs', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: this.serviceConfig.maxRetries,
        backoff: {
          type: 'exponential',
          delay: this.serviceConfig.retryDelay,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });

    // Dead letter queue for permanently failed logs
    this.deadLetterQueue = new Queue<ActivityJobData>('activity-logs-dlq', {
      redis: redisConfig,
      defaultJobOptions: {
        removeOnComplete: false,
        removeOnFail: false,
      },
    });

    this.initializeQueueProcessors();
    this.initializeQueueEventHandlers();
  }

  /**
   * Initialize queue processors
   */
  private initializeQueueProcessors(): void {
    // Process individual activity logs
    this.queue.process('single', async (job: Job<ActivityJobData>) => {
      try {
        const activityLog = await activityLogRepository.create(job.data);
        
        // Emit WebSocket event for real-time updates
        await this.emitActivityEvent(activityLog);
        
        return activityLog;
      } catch (error) {
        console.error(`Failed to process activity log job ${job.id}:`, error);
        throw error;
      }
    });

    // Process batch activity logs
    this.queue.process('batch', async (job: Job<any>) => {
      try {
        const activityLogs = await activityLogRepository.batchCreate(job.data as ActivityJobData[]);
        
        // Emit WebSocket events for batch activities
        for (const activityLog of activityLogs) {
          await this.emitActivityEvent(activityLog);
        }
        
        return activityLogs;
      } catch (error) {
        console.error(`Failed to process batch activity log job ${job.id}:`, error);
        throw error;
      }
    });
  }

  /**
   * Initialize queue event handlers
   */
  private initializeQueueEventHandlers(): void {
    // Handle failed jobs
    this.queue.on('failed', async (job: Job<ActivityJobData>, error: Error) => {
      console.error(`Job ${job.id} failed after ${job.attemptsMade} attempts:`, error.message);

      // Move to dead letter queue if max retries exceeded
      if (job.attemptsMade >= this.serviceConfig.maxRetries) {
        await this.moveToDeadLetterQueue(job);
      }
    });

    // Handle completed jobs
    this.queue.on('completed', (job: Job<ActivityJobData>) => {
      console.log(`Job ${job.id} completed successfully`);
    });

    // Handle stalled jobs
    this.queue.on('stalled', (job: Job<ActivityJobData>) => {
      console.warn(`Job ${job.id} has stalled`);
    });

    // Handle errors
    this.queue.on('error', (error: Error) => {
      console.error('Queue error:', error);
    });
  }

  /**
   * Move failed job to dead letter queue
   */
  private async moveToDeadLetterQueue(job: Job<ActivityJobData>): Promise<void> {
    try {
      await this.deadLetterQueue.add(job.data, {
        jobId: `dlq-${job.id}`,
      });
      console.log(`Job ${job.id} moved to dead letter queue`);
    } catch (error) {
      console.error(`Failed to move job ${job.id} to dead letter queue:`, error);
    }
  }

  /**
   * Log a single activity
   * @param userId - User identifier
   * @param action - Action performed (read, write, delete, open, download)
   * @param resourceType - Type of resource (file, folder, page)
   * @param resourcePath - Path to the resource
   * @param metadata - Additional metadata
   * @param ipAddress - Client IP address
   * @param userAgent - Client user agent
   */
  async logActivity(
    userId: string | null,
    action: string,
    resourceType: string,
    resourcePath: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const activityData: ActivityJobData = {
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_path: resourcePath,
      metadata,
      ip_address: ipAddress,
      user_agent: userAgent,
    };

    // Add to batch queue
    this.batchQueue.push(activityData);

    // Process batch if size limit reached
    if (this.batchQueue.length >= this.serviceConfig.batchSize) {
      await this.processBatch();
    } else {
      // Set timer to process batch after interval
      this.scheduleBatchProcessing();
    }
  }

  /**
   * Schedule batch processing
   */
  private scheduleBatchProcessing(): void {
    if (this.batchTimer) {
      return; // Timer already scheduled
    }

    this.batchTimer = setTimeout(async () => {
      await this.processBatch();
    }, this.serviceConfig.batchInterval);
  }

  /**
   * Process batch of activities
   */
  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) {
      return;
    }

    // Clear timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Get current batch
    const batch = [...this.batchQueue];
    this.batchQueue = [];

    try {
      // Add batch job to queue (cast to any to handle array type)
      await this.queue.add('batch', batch as any, {
        priority: 1, // Lower priority than single jobs
      });

      console.log(`Batch of ${batch.length} activities queued for processing`);
    } catch (error) {
      console.error('Failed to queue batch:', error);

      // Re-add to batch queue for retry
      this.batchQueue.unshift(...batch);
      this.scheduleBatchProcessing();
    }
  }

  /**
   * Log activity immediately without batching
   * Useful for critical activities that need immediate persistence
   */
  async logActivityImmediate(
    userId: string | null,
    action: string,
    resourceType: string,
    resourcePath: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ActivityLog> {
    const activityData: ActivityJobData = {
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_path: resourcePath,
      metadata,
      ip_address: ipAddress,
      user_agent: userAgent,
    };

    try {
      // Add to queue with high priority
      const job = await this.queue.add('single', activityData, {
        priority: 10, // High priority
      });

      // Wait for job to complete
      const result = await job.finished();
      return result as ActivityLog;
    } catch (error) {
      console.error('Failed to log activity immediately:', error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
    deadLetterQueue: number;
  }> {
    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
      this.queue.getPausedCount(),
    ]);

    const deadLetterQueue = await this.deadLetterQueue.getWaitingCount();

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
      deadLetterQueue,
    };
  }

  /**
   * Retry failed jobs from dead letter queue
   */
  async retryDeadLetterQueue(limit: number = 10): Promise<number> {
    const jobs = await this.deadLetterQueue.getJobs(['waiting', 'failed'], 0, limit - 1);
    let retriedCount = 0;

    for (const job of jobs) {
      try {
        // Re-add to main queue
        await this.queue.add('single', job.data, {
          priority: 5,
        });

        // Remove from dead letter queue
        await job.remove();
        retriedCount++;
      } catch (error) {
        console.error(`Failed to retry job ${job.id}:`, error);
      }
    }

    return retriedCount;
  }

  /**
   * Emit WebSocket event for activity log
   * Includes error handling to prevent WebSocket failures from affecting activity logging
   */
  private async emitActivityEvent(activityLog: ActivityLog): Promise<void> {
    try {
      // Get username if user_id exists
      let username: string | undefined;
      if (activityLog.user_id) {
        try {
          const user = await userRepository.findById(activityLog.user_id);
          username = user?.username;
        } catch (error) {
          console.warn(`Failed to fetch username for user ${activityLog.user_id}:`, error);
        }
      }

      // Create activity event
      const activityEvent: ActivityEvent = {
        id: activityLog.id,
        userId: activityLog.user_id,
        username,
        action: activityLog.action,
        resourceType: activityLog.resource_type,
        resourcePath: activityLog.resource_path,
        metadata: activityLog.metadata || undefined,
        timestamp: activityLog.timestamp.toISOString(),
        ipAddress: activityLog.ip_address || undefined,
        userAgent: activityLog.user_agent || undefined,
      };

      // Emit to WebSocket with throttling
      webSocketService.emitNewActivity(activityEvent);

      // Invalidate activity statistics cache
      await this.invalidateStatsCache();
    } catch (error) {
      // Log error but don't throw - WebSocket failures shouldn't affect activity logging
      console.error('Error emitting WebSocket event for activity:', error);
    }
  }

  /**
   * Invalidate activity statistics cache
   */
  private async invalidateStatsCache(): Promise<void> {
    try {
      await cacheService.delete(CacheKeys.activityStats());
      await cacheService.deletePattern(CacheKeys.activityStatsByUser('*'));
    } catch (error) {
      console.error('Error invalidating stats cache:', error);
    }
  }

  /**
   * Flush pending batch immediately
   */
  async flush(): Promise<void> {
    await this.processBatch();
  }

  /**
   * Clean up resources
   */
  async close(): Promise<void> {
    // Flush pending batch
    await this.flush();

    // Close queues
    await this.queue.close();
    await this.deadLetterQueue.close();

    console.log('Activity tracking service closed');
  }
}

// Export singleton instance
export const activityTrackingService = new ActivityTrackingService();

