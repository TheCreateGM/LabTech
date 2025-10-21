import { BaseRepository } from './BaseRepository';
import encryptionService from '../services/EncryptionService';

/**
 * Activity log model interface
 */
export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_path: string;
  metadata: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: Date;
}

/**
 * Activity log creation data
 */
export interface CreateActivityLogData {
  user_id?: string | null;
  action: string;
  resource_type: string;
  resource_path: string;
  metadata?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

/**
 * Activity log query filters
 */
export interface ActivityLogFilters {
  userId?: string;
  action?: string;
  resourceType?: string;
  resourcePath?: string;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Repository for activity log data access
 */
export class ActivityLogRepository extends BaseRepository<ActivityLog> {
  constructor() {
    super('activity_logs');
  }

  /**
   * Create a new activity log entry
   * Encrypts sensitive fields (user_id, resource_path) before storage
   */
  async create(logData: CreateActivityLogData): Promise<ActivityLog> {
    const query = `
      INSERT INTO ${this.tableName} (
        user_id,
        action,
        resource_type,
        resource_path,
        metadata,
        ip_address,
        user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    // Encrypt sensitive fields before storage
    const encryptedUserId = logData.user_id ? encryptionService.encrypt(logData.user_id) : null;
    const encryptedResourcePath = encryptionService.encrypt(logData.resource_path);

    const params = [
      encryptedUserId,
      logData.action,
      logData.resource_type,
      encryptedResourcePath,
      logData.metadata ? JSON.stringify(logData.metadata) : null,
      logData.ip_address || null,
      logData.user_agent || null,
    ];

    const results = await this.query<ActivityLog>(query, params);
    
    // Decrypt sensitive fields before returning
    if (results[0]) {
      return this.decryptActivityLog(results[0]);
    }
    
    return results[0];
  }

  /**
   * Decrypt sensitive fields in an activity log
   */
  private decryptActivityLog(log: ActivityLog): ActivityLog {
    return {
      ...log,
      user_id: log.user_id ? encryptionService.decrypt(log.user_id) : null,
      resource_path: encryptionService.decrypt(log.resource_path),
    };
  }

  /**
   * Decrypt sensitive fields in multiple activity logs
   */
  private decryptActivityLogs(logs: ActivityLog[]): ActivityLog[] {
    return logs.map(log => this.decryptActivityLog(log));
  }

  /**
   * Find all activity logs with pagination and filters
   */
  async findAllWithFilters(
    filters: ActivityLogFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 50 }
  ): Promise<PaginatedResult<ActivityLog>> {
    const { page, limit, sortBy = 'timestamp', sortOrder = 'DESC' } = pagination;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const whereClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.userId) {
      whereClauses.push(`user_id = $${paramIndex++}`);
      params.push(filters.userId);
    }

    if (filters.action) {
      whereClauses.push(`action = $${paramIndex++}`);
      params.push(filters.action);
    }

    if (filters.resourceType) {
      whereClauses.push(`resource_type = $${paramIndex++}`);
      params.push(filters.resourceType);
    }

    if (filters.resourcePath) {
      whereClauses.push(`resource_path ILIKE $${paramIndex++}`);
      params.push(`%${filters.resourcePath}%`);
    }

    if (filters.startDate) {
      whereClauses.push(`timestamp >= $${paramIndex++}`);
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      whereClauses.push(`timestamp <= $${paramIndex++}`);
      params.push(filters.endDate);
    }

    if (filters.ipAddress) {
      whereClauses.push(`ip_address = $${paramIndex++}`);
      params.push(filters.ipAddress);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`;
    const countResult = await this.query<{ count: string }>(countQuery, params);
    const total = parseInt(countResult[0].count, 10);

    // Get paginated data
    const dataQuery = `
      SELECT * FROM ${this.tableName}
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;
    const dataParams = [...params, limit, offset];
    const data = await this.query<ActivityLog>(dataQuery, dataParams);

    // Decrypt sensitive fields before returning
    const decryptedData = this.decryptActivityLogs(data);

    return {
      data: decryptedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find activity logs by user ID
   */
  async findByUserId(
    userId: string,
    pagination: PaginationOptions = { page: 1, limit: 50 }
  ): Promise<PaginatedResult<ActivityLog>> {
    return this.findAllWithFilters({ userId }, pagination);
  }

  /**
   * Find activity logs by date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    pagination: PaginationOptions = { page: 1, limit: 50 }
  ): Promise<PaginatedResult<ActivityLog>> {
    return this.findAllWithFilters({ startDate, endDate }, pagination);
  }

  /**
   * Find activity logs by action
   */
  async findByAction(
    action: string,
    pagination: PaginationOptions = { page: 1, limit: 50 }
  ): Promise<PaginatedResult<ActivityLog>> {
    return this.findAllWithFilters({ action }, pagination);
  }

  /**
   * Export activity logs to CSV format
   */
  async exportToCSV(filters: ActivityLogFilters = {}): Promise<string> {
    const result = await this.findAllWithFilters(filters, { page: 1, limit: 10000 });
    const logs = result.data;

    // CSV header
    const headers = [
      'ID',
      'User ID',
      'Action',
      'Resource Type',
      'Resource Path',
      'IP Address',
      'User Agent',
      'Timestamp',
    ];

    // CSV rows
    const rows = logs.map((log) => [
      log.id,
      log.user_id || '',
      log.action,
      log.resource_type,
      `"${log.resource_path.replace(/"/g, '""')}"`, // Escape quotes
      log.ip_address || '',
      log.user_agent ? `"${log.user_agent.replace(/"/g, '""')}"` : '',
      log.timestamp.toISOString(),
    ]);

    // Combine headers and rows
    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    return csv;
  }

  /**
   * Export activity logs to JSON format
   */
  async exportToJSON(filters: ActivityLogFilters = {}): Promise<string> {
    const result = await this.findAllWithFilters(filters, { page: 1, limit: 10000 });
    return JSON.stringify(result.data, null, 2);
  }

  /**
   * Get activity statistics
   */
  async getStatistics(filters: ActivityLogFilters = {}): Promise<{
    totalActivities: number;
    actionBreakdown: Record<string, number>;
    resourceTypeBreakdown: Record<string, number>;
    topUsers: Array<{ user_id: string; count: number }>;
    topResources: Array<{ resource_path: string; count: number }>;
  }> {
    // Build WHERE clause for filters
    const whereClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.startDate) {
      whereClauses.push(`timestamp >= $${paramIndex++}`);
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      whereClauses.push(`timestamp <= $${paramIndex++}`);
      params.push(filters.endDate);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Total activities
    const totalQuery = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`;
    const totalResult = await this.query<{ count: string }>(totalQuery, params);
    const totalActivities = parseInt(totalResult[0].count, 10);

    // Action breakdown
    const actionQuery = `
      SELECT action, COUNT(*) as count
      FROM ${this.tableName}
      ${whereClause}
      GROUP BY action
      ORDER BY count DESC
    `;
    const actionResult = await this.query<{ action: string; count: string }>(actionQuery, params);
    const actionBreakdown = actionResult.reduce(
      (acc, row) => {
        acc[row.action] = parseInt(row.count, 10);
        return acc;
      },
      {} as Record<string, number>
    );

    // Resource type breakdown
    const resourceTypeQuery = `
      SELECT resource_type, COUNT(*) as count
      FROM ${this.tableName}
      ${whereClause}
      GROUP BY resource_type
      ORDER BY count DESC
    `;
    const resourceTypeResult = await this.query<{ resource_type: string; count: string }>(
      resourceTypeQuery,
      params
    );
    const resourceTypeBreakdown = resourceTypeResult.reduce(
      (acc, row) => {
        acc[row.resource_type] = parseInt(row.count, 10);
        return acc;
      },
      {} as Record<string, number>
    );

    // Top users
    const topUsersQuery = `
      SELECT user_id, COUNT(*) as count
      FROM ${this.tableName}
      ${whereClause}
      ${whereClauses.length > 0 ? 'AND' : 'WHERE'} user_id IS NOT NULL
      GROUP BY user_id
      ORDER BY count DESC
      LIMIT 10
    `;
    const topUsersResult = await this.query<{ user_id: string; count: string }>(
      topUsersQuery,
      params
    );
    const topUsers = topUsersResult.map((row) => ({
      user_id: row.user_id,
      count: parseInt(row.count, 10),
    }));

    // Top resources
    const topResourcesQuery = `
      SELECT resource_path, COUNT(*) as count
      FROM ${this.tableName}
      ${whereClause}
      GROUP BY resource_path
      ORDER BY count DESC
      LIMIT 10
    `;
    const topResourcesResult = await this.query<{ resource_path: string; count: string }>(
      topResourcesQuery,
      params
    );
    const topResources = topResourcesResult.map((row) => ({
      resource_path: row.resource_path,
      count: parseInt(row.count, 10),
    }));

    return {
      totalActivities,
      actionBreakdown,
      resourceTypeBreakdown,
      topUsers,
      topResources,
    };
  }

  /**
   * Batch create activity logs
   */
  async batchCreate(logsData: CreateActivityLogData[]): Promise<ActivityLog[]> {
    if (logsData.length === 0) {
      return [];
    }

    const client = await this.getClient();

    try {
      await client.query('BEGIN');

      const results: ActivityLog[] = [];

      for (const logData of logsData) {
        const query = `
          INSERT INTO ${this.tableName} (
            user_id,
            action,
            resource_type,
            resource_path,
            metadata,
            ip_address,
            user_agent
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;

        // Encrypt sensitive fields before storage
        const encryptedUserId = logData.user_id ? encryptionService.encrypt(logData.user_id) : null;
        const encryptedResourcePath = encryptionService.encrypt(logData.resource_path);

        const params = [
          encryptedUserId,
          logData.action,
          logData.resource_type,
          encryptedResourcePath,
          logData.metadata ? JSON.stringify(logData.metadata) : null,
          logData.ip_address || null,
          logData.user_agent || null,
        ];

        const result = await client.query(query, params);
        results.push(result.rows[0]);
      }

      await client.query('COMMIT');
      
      // Decrypt sensitive fields before returning
      return this.decryptActivityLogs(results);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find activities with cursor-based pagination
   * More efficient for large datasets than offset-based pagination
   */
  async findWithCursor(
    filters: ActivityLogFilters,
    limit: number = 50,
    cursor?: string
  ): Promise<{
    data: ActivityLog[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Add cursor condition (timestamp-based)
    if (cursor) {
      try {
        const cursorDate = new Date(Buffer.from(cursor, 'base64').toString('utf-8'));
        conditions.push(`timestamp < $${paramIndex}`);
        params.push(cursorDate);
        paramIndex++;
      } catch (error) {
        console.error('Invalid cursor:', error);
      }
    }

    // Build filter conditions
    if (filters.userId) {
      const encryptedUserId = encryptionService.encrypt(filters.userId);
      conditions.push(`user_id = $${paramIndex}`);
      params.push(encryptedUserId);
      paramIndex++;
    }

    if (filters.action) {
      conditions.push(`action = $${paramIndex}`);
      params.push(filters.action);
      paramIndex++;
    }

    if (filters.resourceType) {
      conditions.push(`resource_type = $${paramIndex}`);
      params.push(filters.resourceType);
      paramIndex++;
    }

    if (filters.resourcePath) {
      const encryptedPath = encryptionService.encrypt(filters.resourcePath);
      conditions.push(`resource_path = $${paramIndex}`);
      params.push(encryptedPath);
      paramIndex++;
    }

    if (filters.startDate) {
      conditions.push(`timestamp >= $${paramIndex}`);
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      conditions.push(`timestamp <= $${paramIndex}`);
      params.push(filters.endDate);
      paramIndex++;
    }

    if (filters.ipAddress) {
      conditions.push(`ip_address = $${paramIndex}`);
      params.push(filters.ipAddress);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Fetch one extra record to determine if there are more results
    const query = `
      SELECT * FROM ${this.tableName}
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex}
    `;
    params.push(limit + 1);

    const result = await this.query(query, params);
    const hasMore = result.length > limit;
    const data = hasMore ? result.slice(0, limit) : result;

    // Generate next cursor from the last item's timestamp
    let nextCursor: string | null = null;
    if (hasMore && data.length > 0) {
      const lastItem = data[data.length - 1];
      nextCursor = Buffer.from(lastItem.timestamp.toISOString()).toString('base64');
    }

    // Decrypt sensitive fields
    const decryptedData = this.decryptActivityLogs(data);

    return {
      data: decryptedData,
      nextCursor,
      hasMore,
    };
  }
}

// Export singleton instance
export const activityLogRepository = new ActivityLogRepository();
