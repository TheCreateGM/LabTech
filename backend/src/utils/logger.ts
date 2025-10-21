import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { config } from '../config';

/**
 * Custom log format with request ID support
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Console format for development (human-readable)
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
    const reqId = requestId ? `[${requestId}]` : '';
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} ${level} ${reqId}: ${message} ${metaStr}`;
  })
);

/**
 * Create transports based on environment
 */
const createTransports = (): winston.transport[] => {
  const transports: winston.transport[] = [];

  // Console transport (always enabled)
  transports.push(
    new winston.transports.Console({
      format: config.server.env === 'development' ? consoleFormat : logFormat,
      level: config.server.env === 'development' ? 'debug' : 'info',
    })
  );

  // File transports for production
  if (config.server.env === 'production') {
    const logsDir = path.join(process.cwd(), 'logs');

    // Combined logs (all levels)
    transports.push(
      new DailyRotateFile({
        filename: path.join(logsDir, 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        format: logFormat,
        level: 'info',
      })
    );

    // Error logs (error level only)
    transports.push(
      new DailyRotateFile({
        filename: path.join(logsDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        format: logFormat,
        level: 'error',
      })
    );

    // Debug logs (debug level and above)
    transports.push(
      new DailyRotateFile({
        filename: path.join(logsDir, 'debug-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '7d', // Keep debug logs for 7 days only
        format: logFormat,
        level: 'debug',
      })
    );
  }

  return transports;
};

/**
 * Create Winston logger instance
 */
const logger = winston.createLogger({
  level: config.server.env === 'development' ? 'debug' : 'info',
  format: logFormat,
  transports: createTransports(),
  exitOnError: false,
});

/**
 * Create a child logger with request context
 */
export const createRequestLogger = (requestId: string) => {
  return logger.child({ requestId });
};

/**
 * Log levels:
 * - error: Error messages that need immediate attention
 * - warn: Warning messages for potentially harmful situations
 * - info: Informational messages about application progress
 * - debug: Detailed information for debugging purposes
 */
export { logger };
export default logger;
