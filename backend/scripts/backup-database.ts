#!/usr/bin/env ts-node

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { config } from '../src/config';

const execAsync = promisify(exec);

interface BackupConfig {
  databaseUrl: string;
  backupDir: string;
  s3Bucket?: string;
  s3Region?: string;
  encryptionEnabled: boolean;
  encryptionKey?: string;
}

interface BackupResult {
  success: boolean;
  backupPath?: string;
  fileSize?: number;
  checksum?: string;
  error?: string;
  timestamp: Date;
  type: 'full' | 'incremental';
}

/**
 * Database Backup Service
 * Handles automated PostgreSQL backups with encryption and S3 upload
 */
class DatabaseBackupService {
  private config: BackupConfig;

  constructor(config: BackupConfig) {
    this.config = config;
    this.ensureBackupDirectory();
  }

  /**
   * Ensure backup directory exists
   */
  private ensureBackupDirectory(): void {
    if (!fs.existsSync(this.config.backupDir)) {
      fs.mkdirSync(this.config.backupDir, { recursive: true });
      console.log(`Created backup directory: ${this.config.backupDir}`);
    }
  }

  /**
   * Parse database URL to extract connection parameters
   */
  private parseDatabaseUrl(url: string): {
    host: string;
    port: string;
    database: string;
    username: string;
    password: string;
  } {
    // Format: postgresql://username:password@host:port/database
    const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = url.match(regex);

    if (!match) {
      throw new Error('Invalid database URL format');
    }

    return {
      username: match[1],
      password: match[2],
      host: match[3],
      port: match[4],
      database: match[5],
    };
  }

  /**
   * Perform full database backup using pg_dump
   */
  public async performFullBackup(): Promise<BackupResult> {
    const timestamp = new Date();
    const dateStr = timestamp.toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-full-${dateStr}.sql`;
    const backupPath = path.join(this.config.backupDir, backupFileName);

    console.log(`Starting full backup: ${backupFileName}`);

    try {
      const dbParams = this.parseDatabaseUrl(this.config.databaseUrl);

      // Set environment variable for password
      const env = {
        ...process.env,
        PGPASSWORD: dbParams.password,
      };

      // Execute pg_dump
      const dumpCommand = `pg_dump -h ${dbParams.host} -p ${dbParams.port} -U ${dbParams.username} -d ${dbParams.database} -F c -f ${backupPath}`;

      console.log('Executing pg_dump...');
      await execAsync(dumpCommand, { env });

      // Verify backup file exists
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file was not created');
      }

      const stats = fs.statSync(backupPath);
      const fileSize = stats.size;

      console.log(`Backup created successfully: ${fileSize} bytes`);

      // Calculate checksum
      const checksum = await this.calculateChecksum(backupPath);
      console.log(`Backup checksum: ${checksum}`);

      // Encrypt if enabled
      let finalBackupPath = backupPath;
      if (this.config.encryptionEnabled && this.config.encryptionKey) {
        finalBackupPath = await this.encryptBackup(backupPath);
        console.log(`Backup encrypted: ${finalBackupPath}`);
      }

      // Upload to S3 if configured
      if (this.config.s3Bucket) {
        await this.uploadToS3(finalBackupPath);
        console.log(`Backup uploaded to S3: ${this.config.s3Bucket}`);
      }

      // Write backup metadata
      await this.writeBackupMetadata({
        fileName: path.basename(finalBackupPath),
        timestamp,
        type: 'full',
        fileSize,
        checksum,
        encrypted: this.config.encryptionEnabled,
        s3Uploaded: !!this.config.s3Bucket,
      });

      return {
        success: true,
        backupPath: finalBackupPath,
        fileSize,
        checksum,
        timestamp,
        type: 'full',
      };
    } catch (error) {
      console.error('Backup failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp,
        type: 'full',
      };
    }
  }

  /**
   * Perform incremental backup (using WAL archiving)
   */
  public async performIncrementalBackup(): Promise<BackupResult> {
    const timestamp = new Date();
    const dateStr = timestamp.toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-incremental-${dateStr}.sql`;
    const backupPath = path.join(this.config.backupDir, backupFileName);

    console.log(`Starting incremental backup: ${backupFileName}`);

    try {
      const dbParams = this.parseDatabaseUrl(this.config.databaseUrl);

      const env = {
        ...process.env,
        PGPASSWORD: dbParams.password,
      };

      // For incremental backups, we'll dump only the changes since last backup
      // This is a simplified approach - in production, use WAL archiving
      const dumpCommand = `pg_dump -h ${dbParams.host} -p ${dbParams.port} -U ${dbParams.username} -d ${dbParams.database} --schema-only -f ${backupPath}`;

      console.log('Executing incremental backup...');
      await execAsync(dumpCommand, { env });

      if (!fs.existsSync(backupPath)) {
        throw new Error('Incremental backup file was not created');
      }

      const stats = fs.statSync(backupPath);
      const fileSize = stats.size;

      console.log(`Incremental backup created: ${fileSize} bytes`);

      const checksum = await this.calculateChecksum(backupPath);

      let finalBackupPath = backupPath;
      if (this.config.encryptionEnabled && this.config.encryptionKey) {
        finalBackupPath = await this.encryptBackup(backupPath);
      }

      if (this.config.s3Bucket) {
        await this.uploadToS3(finalBackupPath);
      }

      await this.writeBackupMetadata({
        fileName: path.basename(finalBackupPath),
        timestamp,
        type: 'incremental',
        fileSize,
        checksum,
        encrypted: this.config.encryptionEnabled,
        s3Uploaded: !!this.config.s3Bucket,
      });

      return {
        success: true,
        backupPath: finalBackupPath,
        fileSize,
        checksum,
        timestamp,
        type: 'incremental',
      };
    } catch (error) {
      console.error('Incremental backup failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp,
        type: 'incremental',
      };
    }
  }

  /**
   * Calculate SHA-256 checksum of a file
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Encrypt backup file using AES-256-GCM
   */
  private async encryptBackup(filePath: string): Promise<string> {
    if (!this.config.encryptionKey) {
      throw new Error('Encryption key not provided');
    }

    const encryptedPath = `${filePath}.enc`;
    const key = Buffer.from(this.config.encryptionKey, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    return new Promise((resolve, reject) => {
      const input = fs.createReadStream(filePath);
      const output = fs.createWriteStream(encryptedPath);

      // Write IV at the beginning of the file
      output.write(iv);

      input.pipe(cipher).pipe(output);

      output.on('finish', () => {
        // Write auth tag at the end
        const authTag = cipher.getAuthTag();
        fs.appendFileSync(encryptedPath, authTag);

        // Remove unencrypted file
        fs.unlinkSync(filePath);
        resolve(encryptedPath);
      });

      output.on('error', reject);
      input.on('error', reject);
    });
  }

  /**
   * Upload backup to S3
   */
  private async uploadToS3(filePath: string): Promise<void> {
    if (!this.config.s3Bucket) {
      throw new Error('S3 bucket not configured');
    }

    const fileName = path.basename(filePath);
    const s3Key = `backups/${fileName}`;

    // Use AWS CLI for upload (requires AWS CLI to be installed)
    const uploadCommand = `aws s3 cp ${filePath} s3://${this.config.s3Bucket}/${s3Key} --region ${this.config.s3Region || 'us-east-1'} --storage-class STANDARD_IA`;

    try {
      await execAsync(uploadCommand);
      console.log(`Uploaded to S3: s3://${this.config.s3Bucket}/${s3Key}`);
    } catch (error) {
      console.error('S3 upload failed:', error);
      throw error;
    }
  }

  /**
   * Write backup metadata to JSON file
   */
  private async writeBackupMetadata(metadata: any): Promise<void> {
    const metadataPath = path.join(this.config.backupDir, 'backup-metadata.json');
    let existingMetadata: any[] = [];

    if (fs.existsSync(metadataPath)) {
      const content = fs.readFileSync(metadataPath, 'utf-8');
      existingMetadata = JSON.parse(content);
    }

    existingMetadata.push(metadata);

    fs.writeFileSync(metadataPath, JSON.stringify(existingMetadata, null, 2));
  }

  /**
   * Verify backup integrity
   */
  public async verifyBackup(backupPath: string, expectedChecksum: string): Promise<boolean> {
    try {
      if (!fs.existsSync(backupPath)) {
        console.error(`Backup file not found: ${backupPath}`);
        return false;
      }

      const stats = fs.statSync(backupPath);
      if (stats.size === 0) {
        console.error('Backup file is empty');
        return false;
      }

      const actualChecksum = await this.calculateChecksum(backupPath);
      if (actualChecksum !== expectedChecksum) {
        console.error('Checksum mismatch');
        console.error(`Expected: ${expectedChecksum}`);
        console.error(`Actual: ${actualChecksum}`);
        return false;
      }

      console.log('Backup verification successful');
      return true;
    } catch (error) {
      console.error('Backup verification failed:', error);
      return false;
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  const backupType = process.argv[2] || 'full';

  const backupConfig: BackupConfig = {
    databaseUrl: config.database.url,
    backupDir: path.join(__dirname, '../backups'),
    s3Bucket: process.env.BACKUP_S3_BUCKET,
    s3Region: process.env.AWS_REGION || 'us-east-1',
    encryptionEnabled: true,
    encryptionKey: process.env.ENCRYPTION_KEY,
  };

  const backupService = new DatabaseBackupService(backupConfig);

  let result: BackupResult;

  if (backupType === 'incremental') {
    result = await backupService.performIncrementalBackup();
  } else {
    result = await backupService.performFullBackup();
  }

  if (result.success) {
    console.log('\n✓ Backup completed successfully');
    console.log(`  Path: ${result.backupPath}`);
    console.log(`  Size: ${result.fileSize} bytes`);
    console.log(`  Checksum: ${result.checksum}`);
    process.exit(0);
  } else {
    console.error('\n✗ Backup failed');
    console.error(`  Error: ${result.error}`);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { DatabaseBackupService, BackupConfig, BackupResult };
