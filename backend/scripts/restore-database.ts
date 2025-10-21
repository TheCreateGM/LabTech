#!/usr/bin/env ts-node

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as readline from 'readline';
import { config } from '../src/config';

const execAsync = promisify(exec);

interface RestoreOptions {
  backupFile: string;
  databaseUrl: string;
  encrypted: boolean;
  encryptionKey?: string;
  pointInTime?: Date;
  verify: boolean;
}

interface RestoreResult {
  success: boolean;
  restoredFrom: string;
  duration: number;
  error?: string;
  timestamp: Date;
}

/**
 * Database Restore Service
 * Handles database restoration from backups
 */
class DatabaseRestoreService {
  private backupDir: string;

  constructor(backupDir: string) {
    this.backupDir = backupDir;
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
   * List available backups
   */
  public listBackups(): string[] {
    if (!fs.existsSync(this.backupDir)) {
      return [];
    }

    const files = fs.readdirSync(this.backupDir);
    return files
      .filter((f) => f.startsWith('backup-') && (f.endsWith('.sql') || f.endsWith('.enc')))
      .sort()
      .reverse();
  }

  /**
   * Get backup metadata
   */
  private getBackupMetadata(): any[] {
    const metadataPath = path.join(this.backupDir, 'backup-metadata.json');
    
    if (!fs.existsSync(metadataPath)) {
      return [];
    }

    const content = fs.readFileSync(metadataPath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Find backup by timestamp (for point-in-time recovery)
   */
  public findBackupByTime(targetTime: Date): string | null {
    const metadata = this.getBackupMetadata();
    
    // Find the most recent full backup before the target time
    const fullBackups = metadata
      .filter((m) => m.type === 'full' && new Date(m.timestamp) <= targetTime)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (fullBackups.length === 0) {
      return null;
    }

    return fullBackups[0].fileName;
  }

  /**
   * Decrypt backup file
   */
  private async decryptBackup(encryptedPath: string, encryptionKey: string): Promise<string> {
    const decryptedPath = encryptedPath.replace('.enc', '');
    const key = Buffer.from(encryptionKey, 'hex');

    return new Promise((resolve, reject) => {
      try {
        const encryptedData = fs.readFileSync(encryptedPath);

        // Extract IV (first 16 bytes)
        const iv = encryptedData.slice(0, 16);

        // Extract auth tag (last 16 bytes)
        const authTag = encryptedData.slice(-16);

        // Extract encrypted content
        const encrypted = encryptedData.slice(16, -16);

        // Create decipher
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);

        // Decrypt
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

        // Write decrypted file
        fs.writeFileSync(decryptedPath, decrypted);

        console.log(`Backup decrypted: ${decryptedPath}`);
        resolve(decryptedPath);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Verify backup integrity before restore
   */
  private async verifyBackup(backupPath: string, expectedChecksum?: string): Promise<boolean> {
    try {
      if (!fs.existsSync(backupPath)) {
        console.error('Backup file not found');
        return false;
      }

      const stats = fs.statSync(backupPath);
      if (stats.size === 0) {
        console.error('Backup file is empty');
        return false;
      }

      if (expectedChecksum) {
        const actualChecksum = await this.calculateChecksum(backupPath);
        if (actualChecksum !== expectedChecksum) {
          console.error('Checksum mismatch');
          return false;
        }
      }

      console.log('Backup verification passed');
      return true;
    } catch (error) {
      console.error('Backup verification failed:', error);
      return false;
    }
  }

  /**
   * Calculate file checksum
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
   * Perform database restore
   */
  public async restore(options: RestoreOptions): Promise<RestoreResult> {
    const startTime = Date.now();
    const timestamp = new Date();

    console.log('\n' + '='.repeat(60));
    console.log('DATABASE RESTORE');
    console.log('='.repeat(60));
    console.log(`Backup file: ${options.backupFile}`);
    console.log(`Started at: ${timestamp.toISOString()}`);
    console.log('='.repeat(60) + '\n');

    try {
      let backupPath = path.join(this.backupDir, options.backupFile);

      // Decrypt if necessary
      if (options.encrypted) {
        if (!options.encryptionKey) {
          throw new Error('Encryption key required for encrypted backup');
        }
        console.log('Decrypting backup...');
        backupPath = await this.decryptBackup(backupPath, options.encryptionKey);
      }

      // Verify backup
      if (options.verify) {
        console.log('Verifying backup integrity...');
        const isValid = await this.verifyBackup(backupPath);
        if (!isValid) {
          throw new Error('Backup verification failed');
        }
      }

      // Parse database URL
      const dbParams = this.parseDatabaseUrl(options.databaseUrl);

      // Set environment variable for password
      const env = {
        ...process.env,
        PGPASSWORD: dbParams.password,
      };

      // Drop existing connections
      console.log('Terminating existing database connections...');
      const terminateCommand = `psql -h ${dbParams.host} -p ${dbParams.port} -U ${dbParams.username} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbParams.database}' AND pid <> pg_backend_pid();"`;
      
      try {
        await execAsync(terminateCommand, { env });
      } catch (error) {
        console.warn('Warning: Could not terminate all connections');
      }

      // Drop and recreate database
      console.log('Recreating database...');
      const dropCommand = `psql -h ${dbParams.host} -p ${dbParams.port} -U ${dbParams.username} -d postgres -c "DROP DATABASE IF EXISTS ${dbParams.database};"`;
      await execAsync(dropCommand, { env });

      const createCommand = `psql -h ${dbParams.host} -p ${dbParams.port} -U ${dbParams.username} -d postgres -c "CREATE DATABASE ${dbParams.database};"`;
      await execAsync(createCommand, { env });

      // Restore from backup
      console.log('Restoring database from backup...');
      const restoreCommand = `pg_restore -h ${dbParams.host} -p ${dbParams.port} -U ${dbParams.username} -d ${dbParams.database} -v ${backupPath}`;
      
      await execAsync(restoreCommand, { env });

      // Clean up decrypted file if it was encrypted
      if (options.encrypted && backupPath.endsWith('.sql')) {
        fs.unlinkSync(backupPath);
        console.log('Cleaned up decrypted backup file');
      }

      const duration = Date.now() - startTime;

      console.log('\n' + '='.repeat(60));
      console.log('✓ RESTORE COMPLETED SUCCESSFULLY');
      console.log('='.repeat(60));
      console.log(`Duration: ${(duration / 1000).toFixed(2)} seconds`);
      console.log('='.repeat(60) + '\n');

      return {
        success: true,
        restoredFrom: options.backupFile,
        duration,
        timestamp,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      console.error('\n' + '='.repeat(60));
      console.error('✗ RESTORE FAILED');
      console.error('='.repeat(60));
      console.error('Error:', error);
      console.error('='.repeat(60) + '\n');

      return {
        success: false,
        restoredFrom: options.backupFile,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp,
      };
    }
  }

  /**
   * Perform point-in-time recovery
   */
  public async pointInTimeRestore(targetTime: Date, databaseUrl: string): Promise<RestoreResult> {
    console.log(`Performing point-in-time recovery to: ${targetTime.toISOString()}`);

    // Find appropriate backup
    const backupFile = this.findBackupByTime(targetTime);

    if (!backupFile) {
      throw new Error(`No backup found before ${targetTime.toISOString()}`);
    }

    console.log(`Using backup: ${backupFile}`);

    // Restore from the backup
    const result = await this.restore({
      backupFile,
      databaseUrl,
      encrypted: backupFile.endsWith('.enc'),
      encryptionKey: process.env.ENCRYPTION_KEY,
      verify: true,
    });

    // Note: Full point-in-time recovery would require WAL replay
    // This is a simplified implementation
    console.log('\nNote: For complete point-in-time recovery, WAL archiving must be configured');

    return result;
  }
}

/**
 * Interactive CLI for restore
 */
async function interactiveRestore() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };

  const backupDir = path.join(__dirname, '../backups');
  const restoreService = new DatabaseRestoreService(backupDir);

  console.log('\n' + '='.repeat(60));
  console.log('DATABASE RESTORE UTILITY');
  console.log('='.repeat(60) + '\n');

  // List available backups
  const backups = restoreService.listBackups();

  if (backups.length === 0) {
    console.log('No backups found in:', backupDir);
    rl.close();
    return;
  }

  console.log('Available backups:\n');
  backups.forEach((backup, index) => {
    console.log(`  ${index + 1}. ${backup}`);
  });

  console.log('');

  const choice = await question('Select backup number (or "q" to quit): ');

  if (choice.toLowerCase() === 'q') {
    console.log('Restore cancelled');
    rl.close();
    return;
  }

  const backupIndex = parseInt(choice) - 1;

  if (backupIndex < 0 || backupIndex >= backups.length) {
    console.log('Invalid selection');
    rl.close();
    return;
  }

  const selectedBackup = backups[backupIndex];

  console.log(`\nSelected: ${selectedBackup}`);
  console.log('\nWARNING: This will DROP and RECREATE the database!');
  console.log('All current data will be lost!\n');

  const confirm = await question('Type "RESTORE" to confirm: ');

  if (confirm !== 'RESTORE') {
    console.log('Restore cancelled');
    rl.close();
    return;
  }

  rl.close();

  // Perform restore
  const result = await restoreService.restore({
    backupFile: selectedBackup,
    databaseUrl: config.database.url,
    encrypted: selectedBackup.endsWith('.enc'),
    encryptionKey: process.env.ENCRYPTION_KEY,
    verify: true,
  });

  process.exit(result.success ? 0 : 1);
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Interactive mode
    await interactiveRestore();
  } else if (args[0] === '--file' && args[1]) {
    // Direct restore from file
    const backupDir = path.join(__dirname, '../backups');
    const restoreService = new DatabaseRestoreService(backupDir);

    const result = await restoreService.restore({
      backupFile: args[1],
      databaseUrl: config.database.url,
      encrypted: args[1].endsWith('.enc'),
      encryptionKey: process.env.ENCRYPTION_KEY,
      verify: true,
    });

    process.exit(result.success ? 0 : 1);
  } else if (args[0] === '--point-in-time' && args[1]) {
    // Point-in-time recovery
    const targetTime = new Date(args[1]);
    const backupDir = path.join(__dirname, '../backups');
    const restoreService = new DatabaseRestoreService(backupDir);

    const result = await restoreService.pointInTimeRestore(targetTime, config.database.url);

    process.exit(result.success ? 0 : 1);
  } else {
    console.log('Usage:');
    console.log('  npm run backup:restore                    # Interactive mode');
    console.log('  npm run backup:restore -- --file <file>   # Restore from specific file');
    console.log('  npm run backup:restore -- --point-in-time <ISO-date>  # Point-in-time recovery');
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

export { DatabaseRestoreService, RestoreOptions, RestoreResult };
