import { Router, Request, Response } from 'express';
import { register } from '../utils/metrics';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /metrics
 * Expose Prometheus metrics
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (error) {
    logger.error('Error generating metrics', { error });
    res.status(500).json({
      error: {
        code: 'METRICS_ERROR',
        message: 'Failed to generate metrics',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
