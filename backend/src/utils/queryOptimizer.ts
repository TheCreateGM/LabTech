import { db } from '../config/database';
import { logger } from './logger';

/**
 * Query performance monitoring and optimization utilities
 */

/**
 * Query execution statistics
 */
export interface QueryStats {
  query: string;
  executionTime: number;
  rowCount: number;
  timestamp: Date;
}

/**
 * Slow query threshold in milliseconds
 */
const SLOW_QUERY_THRESHOLD = 1000; // 1 second

/**
 * Execute a query with performance monitoring
 */
export async function executeWithMonitoring<T = any>(
  query: string,
  params?: any[]
): Promise<T[]> {
  const startTime = Date.now();

  try {
    const result = await db.query<T>(query, params);
    const executionTime = Date.now() - startTime;

    // Log slow queries
    if (executionTime > SLOW_QUERY_THRESHOLD) {
      logger.warn('Slow query detected', {
        query: query.substring(0, 200), // Truncate for logging
        executionTime,
        rowCount: result.length,
        params: params ? params.length : 0,
      });
    }

    return result;
  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Query execution failed', {
      query: query.substring(0, 200),
      executionTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Analyze query execution plan
 */
export async function analyzeQuery(query: string, params?: any[]): Promise<any> {
  try {
    const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
    const result = await db.query(explainQuery, params);
    return result[0];
  } catch (error) {
    logger.error('Query analysis failed:', error);
    throw error;
  }
}

/**
 * Get table statistics for query optimization
 */
export async function getTableStats(tableName: string): Promise<{
  rowCount: number;
  tableSize: string;
  indexSize: string;
  totalSize: string;
}> {
  try {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM ${tableName}) as row_count,
        pg_size_pretty(pg_table_size('${tableName}')) as table_size,
        pg_size_pretty(pg_indexes_size('${tableName}')) as index_size,
        pg_size_pretty(pg_total_relation_size('${tableName}')) as total_size
    `;

    const result = await db.query(query);
    return {
      rowCount: parseInt(result[0].row_count, 10),
      tableSize: result[0].table_size,
      indexSize: result[0].index_size,
      totalSize: result[0].total_size,
    };
  } catch (error) {
    logger.error(`Failed to get stats for table ${tableName}:`, error);
    throw error;
  }
}

/**
 * Get index usage statistics
 */
export async function getIndexStats(tableName: string): Promise<
  Array<{
    indexName: string;
    indexScans: number;
    indexSize: string;
  }>
> {
  try {
    const query = `
      SELECT 
        indexrelname as index_name,
        idx_scan as index_scans,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public' AND relname = $1
      ORDER BY idx_scan DESC
    `;

    const result = await db.query(query, [tableName]);
    return result.map((row) => ({
      indexName: row.index_name,
      indexScans: parseInt(row.index_scans, 10),
      indexSize: row.index_size,
    }));
  } catch (error) {
    logger.error(`Failed to get index stats for table ${tableName}:`, error);
    throw error;
  }
}

/**
 * Vacuum and analyze table for optimization
 */
export async function optimizeTable(tableName: string): Promise<void> {
  try {
    logger.info(`Optimizing table ${tableName}...`);
    
    // VACUUM ANALYZE updates statistics and reclaims space
    await db.query(`VACUUM ANALYZE ${tableName}`);
    
    logger.info(`Table ${tableName} optimized successfully`);
  } catch (error) {
    logger.error(`Failed to optimize table ${tableName}:`, error);
    throw error;
  }
}

/**
 * Get slow queries from pg_stat_statements (if extension is enabled)
 */
export async function getSlowQueries(limit: number = 10): Promise<
  Array<{
    query: string;
    calls: number;
    totalTime: number;
    meanTime: number;
    maxTime: number;
  }>
> {
  try {
    const query = `
      SELECT 
        query,
        calls,
        total_exec_time as total_time,
        mean_exec_time as mean_time,
        max_exec_time as max_time
      FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_stat_statements%'
      ORDER BY mean_exec_time DESC
      LIMIT $1
    `;

    const result = await db.query(query, [limit]);
    return result.map((row) => ({
      query: row.query,
      calls: parseInt(row.calls, 10),
      totalTime: parseFloat(row.total_time),
      meanTime: parseFloat(row.mean_time),
      maxTime: parseFloat(row.max_time),
    }));
  } catch (error) {
    // pg_stat_statements extension might not be enabled
    logger.warn('pg_stat_statements extension not available');
    return [];
  }
}

/**
 * Build optimized WHERE clause with proper indexing
 */
export function buildOptimizedWhereClause(
  filters: Record<string, any>,
  startParamIndex: number = 1
): {
  whereClause: string;
  params: any[];
  nextParamIndex: number;
} {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = startParamIndex;

  // Sort filters to ensure consistent query plans
  const sortedFilters = Object.keys(filters).sort();

  for (const key of sortedFilters) {
    const value = filters[key];
    
    if (value !== undefined && value !== null) {
      // Use indexed columns first for better query performance
      conditions.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return {
    whereClause,
    params,
    nextParamIndex: paramIndex,
  };
}

/**
 * Batch query execution for better performance
 */
export async function executeBatch<T = any>(
  queries: Array<{ query: string; params?: any[] }>
): Promise<T[][]> {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const results: T[][] = [];
    for (const { query, params } of queries) {
      const result = await client.query(query, params);
      results.push(result.rows);
    }

    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
