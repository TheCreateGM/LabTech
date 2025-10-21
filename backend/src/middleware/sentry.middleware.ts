import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import * as Sentry from '@sentry/node';
import { RequestWithLogger } from './requestLogger.middleware';
import { AuthRequest } from './auth.middleware';

/**
 * Sentry request handler middleware
 * Must be the first middleware
 */
export const sentryRequestHandler = (req: Request, _res: Response, next: NextFunction): void => {
  // Add request context to Sentry scope
  Sentry.getCurrentScope().setContext('request', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    ip: req.ip,
  });

  next();
};

/**
 * Sentry tracing middleware
 * Should be after request handler
 */
export const sentryTracingHandler = (req: Request, _res: Response, next: NextFunction): void => {
  // Set transaction name based on route
  Sentry.getCurrentScope().setTransactionName(`${req.method} ${req.route?.path || req.path}`);

  next();
};

/**
 * Sentry error handler middleware
 * Must be before other error handlers
 */
export const sentryErrorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Capture exception with Sentry
  Sentry.captureException(err, {
    contexts: {
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
      },
    },
  });

  next(err);
};

/**
 * Custom middleware to add user context to Sentry
 */
export const sentryUserContextMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthRequest;

  // Add user context if authenticated
  if (authReq.user) {
    Sentry.setUser({
      id: String(authReq.user.userId || (authReq.user as any).id || ''),
      username: authReq.user.username,
      email: authReq.user.email,
    });
  }

  // Add request ID as tag
  const reqWithLogger = req as RequestWithLogger;
  if (reqWithLogger.requestId) {
    Sentry.setTag('requestId', reqWithLogger.requestId);
  }

  // Add breadcrumb for request
  Sentry.addBreadcrumb({
    category: 'http',
    message: `${req.method} ${req.url}`,
    level: 'info',
    data: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  next();
};
