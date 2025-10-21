import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { config } from '../config';
import logger from './logger';

/**
 * Initialize Sentry error tracking
 */
export const initializeSentry = (): void => {
  // Only initialize Sentry if DSN is provided
  if (!config.sentry?.dsn) {
    logger.info('Sentry DSN not configured, error tracking disabled');
    return;
  }

  try {
    Sentry.init({
      dsn: config.sentry.dsn,
      environment: config.server.env,
      release: config.sentry.release || 'labtech-geolab@1.0.0',

      // Performance monitoring
      tracesSampleRate: config.server.env === 'production' ? 0.1 : 1.0,

      // Profiling
      profilesSampleRate: config.server.env === 'production' ? 0.1 : 1.0,

      // Integrations
      integrations: [
        // Profiling integration
        nodeProfilingIntegration(),
      ],

      // Before send hook to add custom context
      beforeSend(event, hint) {
        // Add custom tags
        event.tags = {
          ...event.tags,
          environment: config.server.env,
        };

        // Log error to Winston as well
        if (hint.originalException) {
          logger.error('Sentry captured error', {
            error: hint.originalException,
            eventId: event.event_id,
          });
        }

        return event;
      },

      // Ignore certain errors
      ignoreErrors: [
        // Network errors
        'ECONNREFUSED',
        'ENOTFOUND',
        'ETIMEDOUT',
        // Client errors
        'ValidationError',
        'UnauthorizedError',
      ],
    });

    logger.info('Sentry error tracking initialized', {
      environment: config.server.env,
      dsn: config.sentry.dsn.substring(0, 20) + '...',
    });
  } catch (error) {
    logger.error('Failed to initialize Sentry', { error });
  }
};

/**
 * Capture exception with custom context
 */
export const captureException = (
  error: Error,
  context?: {
    userId?: string;
    requestId?: string;
    extra?: Record<string, any>;
  }
): string => {
  return Sentry.captureException(error, {
    user: context?.userId ? { id: context.userId } : undefined,
    tags: {
      requestId: context?.requestId,
    },
    extra: context?.extra,
  });
};

/**
 * Capture message with custom context
 */
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: {
    userId?: string;
    requestId?: string;
    extra?: Record<string, any>;
  }
): string => {
  return Sentry.captureMessage(message, {
    level,
    user: context?.userId ? { id: context.userId } : undefined,
    tags: {
      requestId: context?.requestId,
    },
    extra: context?.extra,
  });
};

/**
 * Set user context for Sentry
 */
export const setUserContext = (userId: string, email?: string, username?: string): void => {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
};

/**
 * Clear user context
 */
export const clearUserContext = (): void => {
  Sentry.setUser(null);
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
): void => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};

export { Sentry };
