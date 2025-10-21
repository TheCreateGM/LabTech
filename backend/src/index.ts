import express, { Application, Request, Response, NextFunction } from 'express';
import { createServer as createHTTPServer, Server as HTTPServer } from 'http';
import { createServer as createHTTPSServer, Server as HTTPSServer } from 'https';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config, validateConfig } from './config';
import { db } from './config/database';
import { webSocketService } from './services/WebSocketService';
import logger from './utils/logger';
import { requestLoggerMiddleware } from './middleware/requestLogger.middleware';
import { metricsMiddleware } from './utils/metrics';
import { initializeSentry } from './utils/sentry';
import {
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  sentryUserContextMiddleware,
} from './middleware/sentry.middleware';
import {
  additionalSecurityHeaders,
  handleCORSPreflight,
  validateContentType,
  preventParameterPollution,
  addSecurityContext,
  validateHostHeader,
} from './middleware/security.middleware';
import { checkIPBlacklist, requestSizeLimiter, apiLimiter } from './middleware/rateLimiter.middleware';

/**
 * Main application class for LabTech GeoLab backend
 */
class App {
  public app: Application;
  private server: HTTPServer | HTTPSServer;
  private port: number;

  constructor() {
    this.app = express();
    this.server = this.createServer();
    this.port = config.server.port;

    this.validateEnvironment();
    this.initializeSentry();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeWebSocket();
  }

  /**
   * Initialize Sentry error tracking
   */
  private initializeSentry(): void {
    initializeSentry();
  }

  /**
   * Create HTTP or HTTPS server based on configuration
   */
  private createServer(): HTTPServer | HTTPSServer {
    if (config.server.httpsEnabled) {
      try {
        const httpsOptions = {
          key: fs.readFileSync(path.resolve(config.server.sslKeyPath)),
          cert: fs.readFileSync(path.resolve(config.server.sslCertPath)),
          // Optional CA certificate for certificate chain
          ...(config.server.sslCaPath && {
            ca: fs.readFileSync(path.resolve(config.server.sslCaPath)),
          }),
          // TLS 1.3 configuration
          minVersion: 'TLSv1.3' as const,
          maxVersion: 'TLSv1.3' as const,
          // Cipher suites for TLS 1.3
          ciphers: [
            'TLS_AES_256_GCM_SHA384',
            'TLS_CHACHA20_POLY1305_SHA256',
            'TLS_AES_128_GCM_SHA256',
          ].join(':'),
        };

        logger.info('Creating HTTPS server with TLS 1.3');
        return createHTTPSServer(httpsOptions, this.app);
      } catch (error) {
        logger.error('Failed to load SSL certificates:', error);
        logger.info('Falling back to HTTP server');
        return createHTTPServer(this.app);
      }
    }

    return createHTTPServer(this.app);
  }

  /**
   * Validate environment configuration
   */
  private validateEnvironment(): void {
    try {
      validateConfig();
      logger.info(`Environment: ${config.server.env}`);
    } catch (error) {
      logger.error('Configuration validation failed:', error);
      process.exit(1);
    }
  }

  /**
   * Initialize Express middleware
   */
  private initializeMiddleware(): void {
    // Sentry request handler (must be first)
    this.app.use(sentryRequestHandler);

    // Sentry tracing handler
    this.app.use(sentryTracingHandler);

    // Security middleware with enhanced configuration
    this.app.use(
      helmet({
        // HTTP Strict Transport Security (HSTS) - 1 year as required
        hsts: {
          maxAge: 31536000, // 1 year in seconds (365 days)
          includeSubDomains: true,
          preload: true,
        },
        // Content Security Policy
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: [],
          },
        },
        // X-Frame-Options - prevent clickjacking
        frameguard: {
          action: 'deny',
        },
        // X-Content-Type-Options - prevent MIME sniffing
        noSniff: true,
        // X-XSS-Protection - enable XSS filter
        xssFilter: true,
        // Referrer-Policy - control referrer information
        referrerPolicy: {
          policy: 'strict-origin-when-cross-origin',
        },
        // X-DNS-Prefetch-Control - control DNS prefetching
        dnsPrefetchControl: {
          allow: false,
        },
        // X-Download-Options - prevent IE from executing downloads
        ieNoOpen: true,
        // X-Permitted-Cross-Domain-Policies - restrict Adobe Flash and PDF
        permittedCrossDomainPolicies: {
          permittedPolicies: 'none',
        },
      })
    );

    // CORS configuration with strict origin validation
    this.app.use(
      cors({
        origin: (origin, callback) => {
          // Allow requests with no origin (mobile apps, Postman, etc.)
          if (!origin) {
            return callback(null, true);
          }

          // Check if origin is in allowed list
          const allowedOrigins = config.cors.origin;
          if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
          } else {
            logger.warn(`CORS blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
          }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-MFA-Verified'],
        exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
        maxAge: 86400, // 24 hours
      })
    );

    // IP blacklist check (must be early in middleware chain)
    this.app.use(checkIPBlacklist);

    // Additional security headers
    this.app.use(additionalSecurityHeaders);
    this.app.use(validateHostHeader);
    this.app.use(handleCORSPreflight);
    this.app.use(preventParameterPollution);
    this.app.use(addSecurityContext);

    // Request size limiter
    this.app.use(requestSizeLimiter);

    // Body parsing middleware with size limits
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Validate Content-Type for POST/PUT/PATCH requests
    this.app.use(validateContentType);

    // Request logger middleware (adds request ID and logger to each request)
    this.app.use(requestLoggerMiddleware);

    // Metrics middleware (track HTTP metrics)
    this.app.use(metricsMiddleware);

    // Sentry user context middleware
    this.app.use(sentryUserContextMiddleware);

    // Apply general rate limiting to all API routes
    this.app.use('/api', apiLimiter);

    // HTTP request logging with Morgan (stream to Winston)
    const morganFormat = config.server.env === 'development' ? 'dev' : 'combined';
    this.app.use(
      morgan(morganFormat, {
        stream: {
          write: (message: string) => {
            logger.info(message.trim());
          },
        },
      })
    );

    // Trust proxy for secure cookies behind reverse proxy
    if (config.server.env === 'production') {
      this.app.set('trust proxy', 1);
    }
  }

  /**
   * Initialize application routes
   */
  private initializeRoutes(): void {
    // Metrics endpoint (Prometheus)
    import('./routes/metrics.routes').then((metricsRoutes) => {
      this.app.use('/metrics', metricsRoutes.default);
    });

    // Health check endpoint
    this.app.get('/health', async (_req: Request, res: Response) => {
      const dbHealth = await db.healthCheck();
      
      // Check cache health
      let cacheHealth;
      try {
        const { cacheService } = await import('./services/CacheService');
        cacheHealth = await cacheService.healthCheck();
      } catch (error) {
        cacheHealth = {
          status: 'unhealthy',
          message: 'Cache service not available',
        };
      }

      const isHealthy = dbHealth.status === 'healthy';

      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        environment: config.server.env,
        database: dbHealth,
        cache: cacheHealth,
      });
    });

    // API version endpoint
    this.app.get('/api/v1', (_req: Request, res: Response) => {
      res.status(200).json({
        message: 'LabTech GeoLab API v1',
        version: '1.0.0',
        documentation: '/api/v1/docs',
      });
    });

    // Import and mount authentication routes
    import('./routes/auth.routes').then((authRoutes) => {
      this.app.use('/api/v1/auth', authRoutes.default);
    });

    // Import and mount activity tracking routes
    import('./routes/activity.routes').then((activityRoutes) => {
      this.app.use('/api/v1/activities', activityRoutes.default);
    });

    // Import and mount GDPR routes
    import('./routes/gdpr.routes').then((gdprRoutes) => {
      this.app.use('/api/v1/gdpr', gdprRoutes.default);
    });

    // Import and mount backup routes
    import('./routes/backup.routes').then((backupRoutes) => {
      this.app.use('/api/v1/backups', backupRoutes.default);
    });

    // 404 handler for undefined routes
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'The requested resource was not found',
          timestamp: new Date().toISOString(),
        },
      });
    });
  }

  /**
   * Initialize error handling middleware
   */
  private initializeErrorHandling(): void {
    // Sentry error handler (must be before other error handlers)
    this.app.use(sentryErrorHandler);

    // Custom error handler
    this.app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
      // Log error with request context
      const requestId = (req as any).requestId || 'unknown';
      logger.error('Unhandled error', {
        requestId,
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
      });

      const statusCode = 500;
      const errorResponse = {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message:
            config.server.env === 'production' ? 'An unexpected error occurred' : err.message,
          timestamp: new Date().toISOString(),
          requestId,
        },
      };

      res.status(statusCode).json(errorResponse);
    });
  }

  /**
   * Initialize WebSocket server
   */
  private initializeWebSocket(): void {
    webSocketService.initialize(this.server);
  }

  /**
   * Start the Express server
   */
  public async listen(): Promise<void> {
    // Initialize database connection
    try {
      await db.connect();
      logger.info('Database connection established');
    } catch (error) {
      logger.error('Failed to initialize database connection:', error);
      process.exit(1);
    }

    // Initialize cache service
    try {
      const { cacheService } = await import('./services/CacheService');
      await cacheService.connect();
      logger.info('Cache service connected');
    } catch (error) {
      logger.warn('Failed to connect to cache service (Redis):', error);
      logger.warn('Application will continue without caching');
    }

    const protocol = config.server.httpsEnabled ? 'https' : 'http';
    const wsProtocol = config.server.httpsEnabled ? 'wss' : 'ws';

    this.server.listen(this.port, config.server.host, () => {
      logger.info('LabTech GeoLab Backend API started', {
        serverUrl: `${protocol}://${config.server.host}:${this.port}`,
        websocketUrl: `${wsProtocol}://${config.server.host}:${this.port}`,
        environment: config.server.env,
        https: config.server.httpsEnabled,
      });

      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   LabTech GeoLab Backend API                             ║
║                                                           ║
║   Server running on: ${protocol}://${config.server.host}:${this.port}        ║
║   WebSocket server: ${wsProtocol}://${config.server.host}:${this.port}         ║
║   Environment: ${config.server.env.padEnd(43)}║
║   HTTPS: ${(config.server.httpsEnabled ? 'Enabled' : 'Disabled').padEnd(48)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM signal received: closing servers');
      await webSocketService.close();
      await db.disconnect();
      logger.info('Servers closed gracefully');
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT signal received: closing servers');
      await webSocketService.close();
      await db.disconnect();
      logger.info('Servers closed gracefully');
      process.exit(0);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled promise rejection', {
        reason: reason?.message || reason,
        stack: reason?.stack,
      });
      process.exit(1);
    });
  }
}

// Create and start the application
const app = new App();
app.listen();

export default app;
