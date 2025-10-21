#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface RetentionPolicy {
  dailyRetentionDays: number; // Keep daily backups for X days
  weeklyRetentionDays: number; // Keep weekly backups for X days
  monthlyRetentionDays: number; // Keep monthly backups for X days
}

interface BackupFile {
  fileName: string;
  filePath: string;
  timestamp: Date;
  type: 'full' | 'incremental';
  fileSize: number;
  age: number; // days
}

interface CleanupResult {
  deletedFiles: string[];
  freedSpace: number;
  keptFiles: number;
  errors: string[];
}

/**
 * Backup Cleanup Service
 * Manages backup retention and automated cleanup
 */
class BackupCleanupService {
  private backupDir: string;
  private retentionPolicy: RetentionPolicy;
  private dryRun: boolean;
  private logPath: string;

  constructor(
    backupDir: string,
    retentionPolicy: RetentionPolicy,
    dryRun: boolean = false
  ) {
    this.backupDir = backupDir;
    this.retentionPolicy = retentionPolicy;
    this.dryRun = dryRun;
    this.logPath = path.join(backupDir, 'cleanup.log');
  }

  /**
   * Get all backup files with metadata
   */
  private getBackupFiles(): BackupFile[] {
    if (!fs.existsSync(this.backupDir)) {
      return [];
    }

    const files = fs.readdirSync(this.backupDir);
    const backupFiles: BackupFile[] = [];

    for (const fileName of files) {
      if (!fileName.startsWith('backup-')) {
        continue;
      }

      const filePath = path.join(this.backupDir, fileName);
      const stats = fs.statSync(filePath);

      if (!stats.isFile()) {
        continue;
      }

      // Extract timestamp from filename
      // Format: backup-full-2024-01-15T10-30-00-000Z.sql
      const timestampMatch = fileName.match(/backup-(full|incremental)-(.+)\.(sql|enc)/);
      
      if (!timestampMatch) {
        continue;
      }

      const type = timestampMatch[1] as 'full' | 'incremental';
      const timestampStr = timestampMatch[2].replace(/-/g, ':').replace(/T/g, 'T');
      const timestamp = new Date(timestampStr);

      const age = Math.floor((Date.now() - timestamp.getTime()) / (1000 * 60 * 60 * 24));

      backupFiles.push({
        fileName,
        filePath,
        timestamp,
        type,
        fileSize: stats.size,
        age,
      });
    }

    return backupFiles.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Determine if a backup should be kept based on retention policy
   */
  private shouldKeepBackup(backup: BackupFile, allBackups: BackupFile[]): boolean {
    const { age, timestamp, type } = backup;

    // Always keep backups less than daily retention period
    if (age < this.retentionPolicy.dailyRetentionDays) {
      return true;
    }

    // For backups older than daily retention but within weekly retention
    if (age < this.retentionPolicy.weeklyRetentionDays) {
      // Keep one backup per week (Sunday)
      const dayOfWeek = timestamp.getDay();
      if (dayOfWeek === 0 && type === 'full') {
        return true;
      }
    }

    // For backups older than weekly retention but within monthly retention
    if (age < this.retentionPolicy.monthlyRetentionDays) {
      // Keep one backup per month (first day of month)
      const dayOfMonth = timestamp.getDate();
      if (dayOfMonth === 1 && type === 'full') {
        return true;
      }
    }

    // Delete backups older than monthly retention
    return false;
  }

  /**
   * Perform cleanup based on retention policy
   */
  public async cleanup(): Promise<CleanupResult> {
    console.log('\n' + '='.repeat(60));
    console.log('BACKUP CLEANUP');
    console.log('='.repeat(60));
    console.log(`Backup directory: ${this.backupDir}`);
    console.log(`Dry run: ${this.dryRun ? 'YES' : 'NO'}`);
    console.log('\nRetention Policy:');
    console.log(`  Daily: ${this.retentionPolicy.dailyRetentionDays} days`);
    console.log(`  Weekly: ${this.retentionPolicy.weeklyRetentionDays} days`);
    console.log(`  Monthly: ${this.retentionPolicy.monthlyRetentionDays} days`);
    console.log('='.repeat(60) + '\n');

    const allBackups = this.getBackupFiles();
    const deletedFiles: string[] = [];
    const errors: string[] = [];
    let freedSpace = 0;
    let keptFiles = 0;

    console.log(`Found ${allBackups.length} backup files\n`);

    for (const backup of allBackups) {
      const shouldKeep = this.shouldKeepBackup(backup, allBackups);

      if (shouldKeep) {
        console.log(`✓ KEEP: ${backup.fileName} (${backup.age} days old)`);
        keptFiles++;
      } else {
        console.log(`✗ DELETE: ${backup.fileName} (${backup.age} days old)`);

        if (!this.dryRun) {
          try {
            // Delete file
            fs.unlinkSync(backup.filePath);
            deletedFiles.push(backup.fileName);
            freedSpace += backup.fileSize;

            // Delete from S3 if configured
            if (process.env.BACKUP_S3_BUCKET) {
              await this.deleteFromS3(backup.fileName);
            }

            // Log deletion
            this.logDeletion(backup);
          } catch (error) {
            const errorMsg = `Failed to delete ${backup.fileName}: ${error}`;
            console.error(`  Error: ${errorMsg}`);
            errors.push(errorMsg);
          }
        } else {
          deletedFiles.push(backup.fileName);
          freedSpace += backup.fileSize;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('CLEANUP SUMMARY');
    console.log('='.repeat(60));
    console.log(`Files kept: ${keptFiles}`);
    console.log(`Files deleted: ${deletedFiles.length}`);
    console.log(`Space freed: ${(freedSpace / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`Errors: ${errors.length}`);
    console.log('='.repeat(60) + '\n');

    return {
      deletedFiles,
      freedSpace,
      keptFiles,
      errors,
    };
  }

  /**
   * Delete backup from S3
   */
  private async deleteFromS3(fileName: string): Promise<void> {
    const s3Bucket = process.env.BACKUP_S3_BUCKET;
    const s3Region = process.env.AWS_REGION || 'us-east-1';

    if (!s3Bucket) {
      return;
    }

    try {
      const s3Key = `backups/${fileName}`;
      const deleteCommand = `aws s3 rm s3://${s3Bucket}/${s3Key} --region ${s3Region}`;
      
      await execAsync(deleteCommand);
      console.log(`  Deleted from S3: ${s3Key}`);
    } catch (error) {
      console.error(`  Failed to delete from S3: ${error}`);
    }
  }

  /**
   * Log deletion for audit trail
   */
  private logDeletion(backup: BackupFile): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: 'DELETE',
      fileName: backup.fileName,
      fileSize: backup.fileSize,
      backupTimestamp: backup.timestamp.toISOString(),
      age: backup.age,
      reason: 'retention_policy',
    };

    const logLine = JSON.stringify(logEntry) + '\n';

    try {
      fs.appendFileSync(this.logPath, logLine);
    } catch (error) {
      console.error('Failed to write to cleanup log:', error);
    }
  }

  /**
   * Get cleanup statistics
   */
  public getCleanupStats(): {
    totalBackups: number;
    totalSize: number;
    oldestBackup?: Date;
    newestBackup?: Date;
  } {
    const backups = this.getBackupFiles();

    if (backups.length === 0) {
      return {
        totalBackups: 0,
        totalSize: 0,
      };
    }

    const totalSize = backups.reduce((sum, b) => sum + b.fileSize, 0);
    const oldestBackup = backups[0].timestamp;
    const newestBackup = backups[backups.length - 1].timestamp;

    return {
      totalBackups: backups.length,
      totalSize,
      oldestBackup,
      newestBackup,
    };
  }

  /**
   * Clean up orphaned metadata entries
   */
  public cleanupMetadata(): void {
    const metadataPath = path.join(this.backupDir, 'backup-metadata.json');

    if (!fs.existsSync(metadataPath)) {
      return;
    }

    try {
      const content = fs.readFileSync(metadataPath, 'utf-8');
      const metadata = JSON.parse(content);

      const backupFiles = this.getBackupFiles();
      const existingFileNames = new Set(backupFiles.map((b) => b.fileName));

      // Filter out metadata for deleted backups
      const cleanedMetadata = metadata.filter((m: any) =>
        existingFileNames.has(m.fileName)
      );

      if (cleanedMetadata.length < metadata.length) {
        fs.writeFileSync(metadataPath, JSON.stringify(cleanedMetadata, null, 2));
        console.log(
          `Cleaned up ${metadata.length - cleanedMetadata.length} orphaned metadata entries`
        );
      }
    } catch (error) {
      console.error('Failed to cleanup metadata:', error);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  const backupDir = path.join(__dirname, '../backups');

  const retentionPolicy: RetentionPolicy = {
    dailyRetentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
    weeklyRetentionDays: 90, // Keep weekly backups for 90 days
    monthlyRetentionDays: 365, // Keep monthly backups for 1 year
  };

  const cleanupService = new BackupCleanupService(backupDir, retentionPolicy, dryRun);

  // Show current stats
  const stats = cleanupService.getCleanupStats();
  console.log('Current backup statistics:');
  console.log(`  Total backups: ${stats.totalBackups}`);
  console.log(`  Total size: ${(stats.totalSize / 1024 / 1024 / 1024).toFixed(2)} GB`);
  if (stats.oldestBackup) {
    console.log(`  Oldest backup: ${stats.oldestBackup.toISOString()}`);
  }
  if (stats.newestBackup) {
    console.log(`  Newest backup: ${stats.newestBackup.toISOString()}`);
  }
  console.log('');

  // Perform cleanup
  const result = await cleanupService.cleanup();

  // Cleanup orphaned metadata
  cleanupService.cleanupMetadata();

  if (result.errors.length > 0) {
    console.error('\nErrors occurred during cleanup:');
    result.errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  if (dryRun) {
    console.log('\nThis was a dry run. No files were actually deleted.');
    console.log('Run without --dry-run to perform actual cleanup.');
  }

  process.exit(0);
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { BackupCleanupService, RetentionPolicy, CleanupResult };
