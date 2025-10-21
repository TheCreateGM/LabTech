import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createRequestLogger } from '../utils/logger';

/**
 * Extended Express Request with requestId and logger
 */
export interface RequestWithLogger extends Request {
  requestId: string;
  logger: ReturnType<typeof createRequestLogger>;
}

/**
 * Middleware to add request ID and logger to each request
 */
export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate unique request ID
  const requestId = uuidv4();

  // Add request ID to request object
  (req as RequestWithLogger).requestId = requestId;

  // Create request-specific logger
  (req as RequestWithLogger).logger = createRequestLogger(requestId);

  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);

  // Log incoming request
  (req as RequestWithLogger).logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capture response time
  const startTime = Date.now();

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    (req as RequestWithLogger).logger.log(logLevel, 'Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
};
