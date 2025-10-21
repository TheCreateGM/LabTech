import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

/**
 * Additional security headers middleware
 * Complements helmet middleware with custom headers
 */
export const additionalSecurityHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Prevent caching of sensitive data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Permissions Policy (formerly Feature Policy)
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );

  // Cross-Origin policies
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  next();
};

/**
 * CORS preflight handler
 */
export const handleCORSPreflight = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
};

/**
 * Validate Content-Type for POST/PUT/PATCH requests
 */
export const validateContentType = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const methods = ['POST', 'PUT', 'PATCH'];
  
  if (methods.includes(req.method)) {
    const contentType = req.headers['content-type'];
    
    if (!contentType) {
      res.status(400).json({
        error: {
          code: 'MISSING_CONTENT_TYPE',
          message: 'Content-Type header is required',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Allow application/json and multipart/form-data
    const allowedTypes = ['application/json', 'multipart/form-data', 'application/x-www-form-urlencoded'];
    const isAllowed = allowedTypes.some(type => contentType.includes(type));

    if (!isAllowed) {
      res.status(415).json({
        error: {
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: `Content-Type ${contentType} is not supported`,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }
  }

  next();
};

/**
 * Prevent parameter pollution
 */
export const preventParameterPollution = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Convert array parameters to single values (take first value)
  if (req.query) {
    for (const key in req.query) {
      if (Array.isArray(req.query[key])) {
        req.query[key] = (req.query[key] as string[])[0];
      }
    }
  }

  next();
};

/**
 * Add security context to response
 */
export const addSecurityContext = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Add request ID for tracking
  const requestId = (req as any).requestId || 'unknown';
  res.setHeader('X-Request-ID', requestId);

  // Add server information (minimal for security)
  if (config.server.env === 'development') {
    res.setHeader('X-Powered-By', 'LabTech GeoLab API');
  } else {
    // Remove X-Powered-By in production
    res.removeHeader('X-Powered-By');
  }

  next();
};

/**
 * Validate origin for sensitive operations
 */
export const validateOrigin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  // Skip validation for requests without origin (API clients, mobile apps)
  if (!origin && !referer) {
    next();
    return;
  }

  const allowedOrigins = config.cors.origin;

  // Check if origin is allowed
  if (origin && !allowedOrigins.includes(origin) && !allowedOrigins.includes('*')) {
    res.status(403).json({
      error: {
        code: 'FORBIDDEN_ORIGIN',
        message: 'Request from unauthorized origin',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  next();
};

/**
 * Prevent host header injection
 */
export const validateHostHeader = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const host = req.headers.host;

  if (!host) {
    res.status(400).json({
      error: {
        code: 'MISSING_HOST_HEADER',
        message: 'Host header is required',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Validate host format
  const hostRegex = /^[a-zA-Z0-9.-]+(:[0-9]+)?$/;
  if (!hostRegex.test(host)) {
    res.status(400).json({
      error: {
        code: 'INVALID_HOST_HEADER',
        message: 'Invalid host header format',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  next();
};

/**
 * Detect and block suspicious user agents
 */
export const validateUserAgent = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const userAgent = req.headers['user-agent'];

  // Block requests without user agent (potential bots)
  if (!userAgent && config.server.env === 'production') {
    res.status(403).json({
      error: {
        code: 'MISSING_USER_AGENT',
        message: 'User-Agent header is required',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Block known malicious user agents
  const blockedPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /nessus/i,
    /openvas/i,
    /metasploit/i,
  ];

  if (userAgent && blockedPatterns.some(pattern => pattern.test(userAgent))) {
    res.status(403).json({
      error: {
        code: 'BLOCKED_USER_AGENT',
        message: 'Access denied',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  next();
};
