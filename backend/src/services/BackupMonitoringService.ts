import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface BackupMetadata {
  fileName: string;
  timestamp: Date;
  type: 'full' | 'incremental';
  fileSize: number;
  checksum: string;
  encrypted: boolean;
  s3Uploaded: boolean;
  success?: boolean;
  error?: string;
}

interface BackupStats {
  totalBackups: number;
  successfulBackups: number;
  failedBackups: number;
  totalSize: number;
  lastBackupTime?: Date;
  lastSuccessfulBackup?: BackupMetadata;
  lastFailedBackup?: BackupMetadata;
  storageUsage: {
    used: number;
    total: number;
    percentage: number;
  };
}

interface AlertConfig {
  emailEnabled: boolean;
  emailRecipients: string[];
  slackWebhook?: string;
  storageThreshold: number; // Percentage (e.g., 80)
}

/**
 * Backup Monitoring Service
 * Monitors backup operations, tracks statistics, and sends alerts
 */
export class BackupMonitoringService {
  private backupDir: string;
  private metadataPath: string;
  private alertConfig: AlertConfig;
  private logPath: string;

  constructor(backupDir: string, alertConfig: AlertConfig) {
    this.backupDir = backupDir;
    this.metadataPath = path.join(backupDir, 'backup-metadata.json');
    this.alertConfig = alertConfig;
    this.logPath = path.join(backupDir, 'backup-monitor.log');
  }

  /**
   * Log backup event
   */
  public async logBackupEvent(
    type: 'full' | 'incremental',
    success: boolean,
    details: any
  ): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      success,
      details,
    };

    const logLine = JSON.stringify(logEntry) + '\n';

    try {
      fs.appendFileSync(this.logPath, logLine);
      console.log(`Backup event logged: ${type} - ${success ? 'SUCCESS' : 'FAILURE'}`);

      // Send alert if backup failed
      if (!success) {
        await this.sendBackupFailureAlert(type, details);
      }

      // Check storage usage
      await this.checkStorageUsage();
    } catch (error) {
      console.error('Failed to log backup event:', error);
    }
  }

  /**
   * Get backup statistics
   */
  public async getBackupStats(): Promise<BackupStats> {
    const metadata = this.readMetadata();

    const successfulBackups = metadata.filter((b) => b.success !== false);
    const failedBackups = metadata.filter((b) => b.success === false);

    const totalSize = successfulBackups.reduce((sum, b) => sum + (b.fileSize || 0), 0);

    const lastBackup = metadata.length > 0 ? metadata[metadata.length - 1] : undefined;
    const lastSuccessful = successfulBackups.length > 0 
      ? successfulBackups[successfulBackups.length - 1] 
      : undefined;
    const lastFailed = failedBackups.length > 0 
      ? failedBackups[failedBackups.length - 1] 
      : undefined;

    const storageUsage = await this.getStorageUsage();

    return {
      totalBackups: metadata.length,
      successfulBackups: successfulBackups.length,
      failedBackups: failedBackups.length,
      totalSize,
      lastBackupTime: lastBackup?.timestamp,
      lastSuccessfulBackup: lastSuccessful,
      lastFailedBackup: lastFailed,
      storageUsage,
    };
  }

  /**
   * Read backup metadata
   */
  private readMetadata(): BackupMetadata[] {
    try {
      if (!fs.existsSync(this.metadataPath)) {
        return [];
      }

      const content = fs.readFileSync(this.metadataPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to read backup metadata:', error);
      return [];
    }
  }

  /**
   * Get storage usage for backup directory
   */
  private async getStorageUsage(): Promise<{
    used: number;
    total: number;
    percentage: number;
  }> {
    try {
      // Get disk usage using df command
      const { stdout } = await execAsync(`df -k ${this.backupDir} | tail -1`);
      const parts = stdout.trim().split(/\s+/);

      const total = parseInt(parts[1]) * 1024; // Convert KB to bytes
      const used = parseInt(parts[2]) * 1024;
      const percentage = parseFloat(parts[4].replace('%', ''));

      return { used, total, percentage };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return { used: 0, total: 0, percentage: 0 };
    }
  }

  /**
   * Check storage usage and send alert if threshold exceeded
   */
  private async checkStorageUsage(): Promise<void> {
    const usage = await this.getStorageUsage();

    if (usage.percentage >= this.alertConfig.storageThreshold) {
      await this.sendStorageAlert(usage);
    }
  }

  /**
   * Send backup failure alert
   */
  private async sendBackupFailureAlert(
    type: 'full' | 'incremental',
    details: any
  ): Promise<void> {
    const subject = `[ALERT] Database Backup Failed - ${type}`;
    const message = `
Database backup failed at ${new Date().toISOString()}

Backup Type: ${type}
Error: ${details.error || 'Unknown error'}

Please investigate immediately.

Details:
${JSON.stringify(details, null, 2)}
    `.trim();

    await this.sendAlert(subject, message);
  }

  /**
   * Send storage alert
   */
  private async sendStorageAlert(usage: {
    used: number;
    total: number;
    percentage: number;
  }): Promise<void> {
    const subject = `[WARNING] Backup Storage Usage High - ${usage.percentage.toFixed(1)}%`;
    const message = `
Backup storage usage has exceeded the threshold of ${this.alertConfig.storageThreshold}%

Current Usage: ${usage.percentage.toFixed(1)}%
Used: ${(usage.used / 1024 / 1024 / 1024).toFixed(2)} GB
Total: ${(usage.total / 1024 / 1024 / 1024).toFixed(2)} GB

Please clean up old backups or increase storage capacity.

Backup Directory: ${this.backupDir}
    `.trim();

    await this.sendAlert(subject, message);
  }

  /**
   * Send alert via configured channels
   */
  private async sendAlert(subject: string, message: string): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('ALERT:', subject);
    console.log('='.repeat(60));
    console.log(message);
    console.log('='.repeat(60) + '\n');

    // Send email if configured
    if (this.alertConfig.emailEnabled && this.alertConfig.emailRecipients.length > 0) {
      await this.sendEmailAlert(subject, message);
    }

    // Send Slack notification if configured
    if (this.alertConfig.slackWebhook) {
      await this.sendSlackAlert(subject, message);
    }
  }

  /**
   * Send email alert using sendmail or mail command
   */
  private async sendEmailAlert(subject: string, message: string): Promise<void> {
    try {
      const recipients = this.alertConfig.emailRecipients.join(',');
      
      // Try using sendmail
      const emailContent = `Subject: ${subject}\n\n${message}`;
      const command = `echo "${emailContent}" | sendmail ${recipients}`;

      await execAsync(command);
      console.log(`Email alert sent to: ${recipients}`);
    } catch (error) {
      console.error('Failed to send email alert:', error);
      console.log('Note: Ensure sendmail or mail command is configured on the system');
    }
  }

  /**
   * Send Slack alert via webhook
   */
  private async sendSlackAlert(subject: string, message: string): Promise<void> {
    if (!this.alertConfig.slackWebhook) {
      return;
    }

    try {
      const payload = {
        text: subject,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: subject,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '```\n' + message + '\n```',
            },
          },
        ],
      };

      const command = `curl -X POST -H 'Content-type: application/json' --data '${JSON.stringify(payload)}' ${this.alertConfig.slackWebhook}`;
      await execAsync(command);
      console.log('Slack alert sent');
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  /**
   * Get backup history for dashboard
   */
  public getBackupHistory(limit: number = 50): BackupMetadata[] {
    const metadata = this.readMetadata();
    return metadata.slice(-limit).reverse();
  }

  /**
   * Generate backup report
   */
  public async generateReport(): Promise<string> {
    const stats = await this.getBackupStats();
    const history = this.getBackupHistory(10);

    const report = `
BACKUP MONITORING REPORT
Generated: ${new Date().toISOString()}
${'='.repeat(60)}

STATISTICS
----------
Total Backups: ${stats.totalBackups}
Successful: ${stats.successfulBackups}
Failed: ${stats.failedBackups}
Total Size: ${(stats.totalSize / 1024 / 1024 / 1024).toFixed(2)} GB
Last Backup: ${stats.lastBackupTime?.toISOString() || 'N/A'}

STORAGE USAGE
-------------
Used: ${(stats.storageUsage.used / 1024 / 1024 / 1024).toFixed(2)} GB
Total: ${(stats.storageUsage.total / 1024 / 1024 / 1024).toFixed(2)} GB
Percentage: ${stats.storageUsage.percentage.toFixed(1)}%
Status: ${stats.storageUsage.percentage >= this.alertConfig.storageThreshold ? 'WARNING' : 'OK'}

RECENT BACKUPS (Last 10)
------------------------
${history.map((b, i) => `${i + 1}. ${b.timestamp} - ${b.type} - ${b.success !== false ? 'SUCCESS' : 'FAILED'} - ${(b.fileSize / 1024 / 1024).toFixed(2)} MB`).join('\n')}

${'='.repeat(60)}
    `.trim();

    return report;
  }
}
