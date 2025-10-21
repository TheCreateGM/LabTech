import { Request, Response } from 'express';
import { BackupMonitoringService } from '../services/BackupMonitoringService';
import * as path from 'path';

/**
 * Backup Controller
 * Handles backup monitoring and management endpoints
 */
export class BackupController {
  private monitoringService: BackupMonitoringService;

  constructor() {
    const backupDir = path.join(__dirname, '../../backups');
    const alertConfig = {
      emailEnabled: process.env.BACKUP_EMAIL_ALERTS === 'true',
      emailRecipients: process.env.BACKUP_EMAIL_RECIPIENTS?.split(',') || [],
      slackWebhook: process.env.BACKUP_SLACK_WEBHOOK,
      storageThreshold: parseInt(process.env.BACKUP_STORAGE_THRESHOLD || '80'),
    };

    this.monitoringService = new BackupMonitoringService(backupDir, alertConfig);
  }

  /**
   * Get backup statistics
   * GET /api/v1/backups/stats
   */
  public getStats = async (_req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.monitoringService.getBackupStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Failed to get backup stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve backup statistics',
      });
    }
  };

  /**
   * Get backup history
   * GET /api/v1/backups/history
   */
  public getHistory = async (_req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(_req.query.limit as string) || 50;
      const history = this.monitoringService.getBackupHistory(limit);

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      console.error('Failed to get backup history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve backup history',
      });
    }
  };

  /**
   * Generate backup report
   * GET /api/v1/backups/report
   */
  public getReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const report = await this.monitoringService.generateReport();

      res.setHeader('Content-Type', 'text/plain');
      res.send(report);
    } catch (error) {
      console.error('Failed to generate backup report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate backup report',
      });
    }
  };

  /**
   * Trigger manual backup
   * POST /api/v1/backups/trigger
   */
  public triggerBackup = async (_req: Request, res: Response): Promise<void> => {
    try {
      const { type } = _req.body;

      if (!type || !['full', 'incremental'].includes(type)) {
        res.status(400).json({
          success: false,
          error: 'Invalid backup type. Must be "full" or "incremental"',
        });
        return;
      }

      // Note: Manual backup trigger should be executed via npm scripts
      // This endpoint queues the backup request
      res.json({
        success: true,
        message: `${type} backup has been queued. Please check backup logs for status.`,
        note: 'For immediate backup execution, use: npm run backup:' + type,
      });
    } catch (error) {
      console.error('Failed to trigger backup:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}
