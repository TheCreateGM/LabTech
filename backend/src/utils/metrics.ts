import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { Request, Response, NextFunction } from 'express';
import logger from './logger';

/**
 * Prometheus metrics registry
 */
export const register = new Registry();

/**
 * Collect default metrics (CPU, memory, etc.)
 */
collectDefaultMetrics({
  register,
  prefix: 'labtech_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

/**
 * HTTP request counter
 */
export const httpRequestCounter = new Counter({
  name: 'labtech_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

/**
 * HTTP request duration histogram
 */
export const httpRequestDuration = new Histogram({
  name: 'labtech_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

/**
 * HTTP error counter
 */
export const httpErrorCounter = new Counter({
  name: 'labtech_http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'status_code', 'error_type'],
  registers: [register],
});

/**
 * Active connections gauge
 */
export const activeConnections = new Gauge({
  name: 'labtech_active_connections',
  help: 'Number of active HTTP connections',
  registers: [register],
});

/**
 * WebSocket connections gauge
 */
export const websocketConnections = new Gauge({
  name: 'labtech_websocket_connections',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

/**
 * Database query counter
 */
export const databaseQueryCounter = new Counter({
  name: 'labtech_database_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table'],
  registers: [register],
});

/**
 * Database query duration histogram
 */
export const databaseQueryDuration = new Histogram({
  name: 'labtech_database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

/**
 * Database connection pool gauge
 */
export const databaseConnectionPool = new Gauge({
  name: 'labtech_database_connection_pool',
  help: 'Database connection pool status',
  labelNames: ['status'],
  registers: [register],
});

/**
 * Activity logs counter
 */
export const activityLogsCounter = new Counter({
  name: 'labtech_activity_logs_total',
  help: 'Total number of activity logs created',
  labelNames: ['action', 'resource_type'],
  registers: [register],
});

/**
 * Authentication attempts counter
 */
export const authAttemptsCounter = new Counter({
  name: 'labtech_auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['result', 'method'],
  registers: [register],
});

/**
 * Middleware to track HTTP metrics
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Increment active connections
  activeConnections.inc();

  // Track request start time
  const startTime = Date.now();

  // Track response
  res.on('finish', () => {
    // Decrement active connections
    activeConnections.dec();

    // Calculate duration
    const duration = (Date.now() - startTime) / 1000;

    // Get route pattern (remove IDs and dynamic segments)
    const route = req.route?.path || req.path.replace(/\/[0-9a-f-]{36}/gi, '/:id');

    // Record metrics
    httpRequestCounter.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode,
      },
      duration
    );

    // Track errors
    if (res.statusCode >= 400) {
      const errorType = res.statusCode >= 500 ? 'server_error' : 'client_error';
      httpErrorCounter.inc({
        method: req.method,
        route,
        status_code: res.statusCode,
        error_type: errorType,
      });
    }

    // Log slow requests
    if (duration > 1) {
      logger.warn('Slow request detected', {
        method: req.method,
        route,
        duration: `${duration.toFixed(3)}s`,
        statusCode: res.statusCode,
      });
    }
  });

  next();
};

/**
 * Track database query metrics
 */
export const trackDatabaseQuery = async <T>(
  operation: string,
  table: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now();

  try {
    databaseQueryCounter.inc({ operation, table });
    const result = await queryFn();
    const duration = (Date.now() - startTime) / 1000;

    databaseQueryDuration.observe({ operation, table }, duration);

    // Log slow queries
    if (duration > 0.1) {
      logger.warn('Slow database query detected', {
        operation,
        table,
        duration: `${duration.toFixed(3)}s`,
      });
    }

    return result;
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    databaseQueryDuration.observe({ operation, table }, duration);
    throw error;
  }
};

/**
 * Update database connection pool metrics
 */
export const updateDatabasePoolMetrics = (total: number, idle: number, waiting: number): void => {
  databaseConnectionPool.set({ status: 'total' }, total);
  databaseConnectionPool.set({ status: 'idle' }, idle);
  databaseConnectionPool.set({ status: 'waiting' }, waiting);
  databaseConnectionPool.set({ status: 'active' }, total - idle);
};
