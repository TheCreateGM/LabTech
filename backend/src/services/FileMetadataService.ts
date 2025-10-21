import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import chokidar, { FSWatcher } from 'chokidar';
import mime from 'mime-types';
import { config } from '../config';
import {
  fileMetadataRepository,
  FileMetadata,
} from '../repositories/FileMetadataRepository';
import { cacheService, CacheKeys } from './CacheService';

/**
 * File metadata scanning service configuration
 */
interface FileMetadataServiceConfig {
  scanPath: string;
  watchEnabled: boolean;
  updateDelay: number; // milliseconds
  excludePatterns: string[];
  maxFileSize: number; // bytes
}

/**
 * Service for scanning and tracking file system metadata
 */
export class FileMetadataService {
  private watcher: FSWatcher | null = null;
  private updateQueue: Map<string, NodeJS.Timeout> = new Map();
  private serviceConfig: FileMetadataServiceConfig;
  private isScanning: boolean = false;

  constructor() {
    this.serviceConfig = {
      scanPath: config.fileSystem.scanPath,
      watchEnabled: config.fileSystem.watchEnabled,
      updateDelay: 5000, // 5 seconds
      excludePatterns: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/.angular/**',
        '**/coverage/**',
        '**/*.log',
      ],
      maxFileSize: 100 * 1024 * 1024, // 100 MB
    };
  }

  /**
   * Scan a directory recursively and extract file metadata
   * @param dirPath - Directory path to scan
   * @returns Array of file metadata
   */
  async scanDirectory(dirPath: string): Promise<FileMetadata[]> {
    this.isScanning = true;
    const results: FileMetadata[] = [];

    try {
      const absolutePath = path.resolve(dirPath);
      await this.scanDirectoryRecursive(absolutePath, absolutePath, results);
      console.log(`Scanned ${results.length} files in ${dirPath}`);
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error);
      throw error;
    } finally {
      this.isScanning = false;
    }

    return results;
  }

  /**
   * Recursively scan directory
   */
  private async scanDirectoryRecursive(
    currentPath: string,
    basePath: string,
    results: FileMetadata[]
  ): Promise<void> {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relativePath = path.relative(basePath, fullPath);

        // Check if path matches exclude patterns
        if (this.shouldExclude(relativePath)) {
          continue;
        }

        if (entry.isDirectory()) {
          // Store directory metadata
          const dirMetadata = await this.extractDirectoryMetadata(fullPath, relativePath);
          results.push(dirMetadata);

          // Recursively scan subdirectory
          await this.scanDirectoryRecursive(fullPath, basePath, results);
        } else if (entry.isFile()) {
          // Store file metadata
          const fileMetadata = await this.extractFileMetadata(fullPath, relativePath);
          if (fileMetadata) {
            results.push(fileMetadata);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning ${currentPath}:`, error);
      // Continue scanning other directories
    }
  }

  /**
   * Check if path should be excluded
   */
  private shouldExclude(relativePath: string): boolean {
    return this.serviceConfig.excludePatterns.some((pattern) => {
      // Simple glob pattern matching
      const regexPattern = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '.');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(relativePath);
    });
  }

  /**
   * Extract metadata for a directory
   */
  private async extractDirectoryMetadata(
    absolutePath: string,
    relativePath: string
  ): Promise<FileMetadata> {
    const stats = await fs.stat(absolutePath);
    const fileName = path.basename(absolutePath);

    return {
      id: '', // Will be set by database
      file_name: fileName,
      relative_path: relativePath,
      absolute_path: absolutePath,
      file_size: 0,
      file_type: 'directory',
      extension: '',
      checksum: '',
      is_directory: true,
      last_modified: stats.mtime,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  /**
   * Extract metadata for a file
   */
  private async extractFileMetadata(
    absolutePath: string,
    relativePath: string
  ): Promise<FileMetadata | null> {
    try {
      const stats = await fs.stat(absolutePath);

      // Skip files larger than max size
      if (stats.size > this.serviceConfig.maxFileSize) {
        console.warn(`Skipping large file: ${relativePath} (${stats.size} bytes)`);
        return null;
      }

      const fileName = path.basename(absolutePath);
      const extension = path.extname(absolutePath);
      const mimeType = mime.lookup(absolutePath) || 'application/octet-stream';

      // Calculate checksum
      const checksum = await this.calculateChecksum(absolutePath);

      return {
        id: '', // Will be set by database
        file_name: fileName,
        relative_path: relativePath,
        absolute_path: absolutePath,
        file_size: stats.size,
        file_type: mimeType,
        extension,
        checksum,
        is_directory: false,
        last_modified: stats.mtime,
        created_at: new Date(),
        updated_at: new Date(),
      };
    } catch (error) {
      console.error(`Error extracting metadata for ${absolutePath}:`, error);
      return null;
    }
  }

  /**
   * Calculate SHA-256 checksum for a file
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const hash = crypto.createHash('sha256');
      hash.update(fileBuffer);
      return hash.digest('hex');
    } catch (error) {
      console.error(`Error calculating checksum for ${filePath}:`, error);
      return '';
    }
  }

  /**
   * Get metadata for a specific file
   * @param filePath - File path (relative or absolute)
   * @returns File metadata
   */
  async getFileMetadata(filePath: string): Promise<FileMetadata | null> {
    try {
      const absolutePath = path.resolve(filePath);
      const relativePath = path.relative(process.cwd(), absolutePath);

      // Check if path should be excluded
      if (this.shouldExclude(relativePath)) {
        return null;
      }

      const stats = await fs.stat(absolutePath);

      if (stats.isDirectory()) {
        return this.extractDirectoryMetadata(absolutePath, relativePath);
      } else {
        return this.extractFileMetadata(absolutePath, relativePath);
      }
    } catch (error) {
      console.error(`Error getting metadata for ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Start watching file system for changes
   */
  watchFileSystem(): void {
    if (this.watcher) {
      console.warn('File system watcher already running');
      return;
    }

    if (!this.serviceConfig.watchEnabled) {
      console.log('File system watching is disabled');
      return;
    }

    const watchPath = path.resolve(this.serviceConfig.scanPath);

    this.watcher = chokidar.watch(watchPath, {
      ignored: this.serviceConfig.excludePatterns,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100,
      },
    });

    // Handle file/directory added
    this.watcher.on('add', (filePath: string) => {
      this.scheduleUpdate(filePath, 'add');
    });

    // Handle file/directory changed
    this.watcher.on('change', (filePath: string) => {
      this.scheduleUpdate(filePath, 'change');
    });

    // Handle file/directory deleted
    this.watcher.on('unlink', (filePath: string) => {
      this.scheduleUpdate(filePath, 'delete');
    });

    // Handle directory added
    this.watcher.on('addDir', (dirPath: string) => {
      this.scheduleUpdate(dirPath, 'add');
    });

    // Handle directory deleted
    this.watcher.on('unlinkDir', (dirPath: string) => {
      this.scheduleUpdate(dirPath, 'delete');
    });

    // Handle errors
    this.watcher.on('error', (error: unknown) => {
      console.error('File system watcher error:', error);
    });

    // Handle ready
    this.watcher.on('ready', () => {
      console.log(`File system watcher initialized for: ${watchPath}`);
    });
  }

  /**
   * Schedule metadata update with delay
   */
  private scheduleUpdate(filePath: string, eventType: 'add' | 'change' | 'delete'): void {
    // Clear existing timer for this file
    const existingTimer = this.updateQueue.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Schedule new update
    const timer = setTimeout(async () => {
      await this.handleFileSystemChange(filePath, eventType);
      this.updateQueue.delete(filePath);
    }, this.serviceConfig.updateDelay);

    this.updateQueue.set(filePath, timer);
  }

  /**
   * Handle file system change event
   */
  private async handleFileSystemChange(
    filePath: string,
    eventType: 'add' | 'change' | 'delete'
  ): Promise<void> {
    try {
      const relativePath = path.relative(process.cwd(), filePath);

      if (eventType === 'delete') {
        // Delete from database
        await fileMetadataRepository.deleteByPath(relativePath);
        console.log(`Deleted metadata for: ${relativePath}`);
      } else {
        // Get metadata
        const metadata = await this.getFileMetadata(filePath);
        if (!metadata) {
          return;
        }

        // Check if exists in database
        const existing = await fileMetadataRepository.findByPath(relativePath);

        if (existing) {
          // Update existing
          await fileMetadataRepository.update(existing.id, {
            file_size: metadata.file_size,
            file_type: metadata.file_type,
            checksum: metadata.checksum,
            last_modified: metadata.last_modified,
          });
          console.log(`Updated metadata for: ${relativePath}`);
          
          // Invalidate cache
          await cacheService.delete(CacheKeys.fileMetadata(relativePath));
          await cacheService.delete(CacheKeys.fileMetadataList());
        } else {
          // Create new
          await fileMetadataRepository.create({
            file_name: metadata.file_name,
            relative_path: metadata.relative_path,
            absolute_path: metadata.absolute_path,
            file_size: metadata.file_size,
            file_type: metadata.file_type,
            extension: metadata.extension,
            checksum: metadata.checksum,
            is_directory: metadata.is_directory,
            last_modified: metadata.last_modified,
          });
          console.log(`Created metadata for: ${relativePath}`);
          
          // Invalidate cache
          await cacheService.delete(CacheKeys.fileMetadataList());
        }
      }
    } catch (error) {
      console.error(`Error handling file system change for ${filePath}:`, error);
    }
  }

  /**
   * Perform initial scan and store in database
   */
  async performInitialScan(): Promise<number> {
    console.log('Starting initial file system scan...');

    const scanPath = path.resolve(this.serviceConfig.scanPath);
    const metadata = await this.scanDirectory(scanPath);

    let storedCount = 0;

    for (const item of metadata) {
      try {
        // Check if already exists
        const existing = await fileMetadataRepository.findByPath(item.relative_path);

        if (existing) {
          // Update if checksum changed
          if (existing.checksum !== item.checksum) {
            await fileMetadataRepository.update(existing.id, {
              file_size: item.file_size,
              file_type: item.file_type,
              checksum: item.checksum,
              last_modified: item.last_modified,
            });
            storedCount++;
          }
        } else {
          // Create new
          await fileMetadataRepository.create({
            file_name: item.file_name,
            relative_path: item.relative_path,
            absolute_path: item.absolute_path,
            file_size: item.file_size,
            file_type: item.file_type,
            extension: item.extension,
            checksum: item.checksum,
            is_directory: item.is_directory,
            last_modified: item.last_modified,
          });
          storedCount++;
        }
      } catch (error) {
        console.error(`Error storing metadata for ${item.relative_path}:`, error);
      }
    }

    console.log(`Initial scan complete. Stored/updated ${storedCount} items.`);
    return storedCount;
  }

  /**
   * Stop watching file system
   */
  async stopWatching(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      console.log('File system watcher stopped');
    }

    // Clear pending updates
    for (const timer of this.updateQueue.values()) {
      clearTimeout(timer);
    }
    this.updateQueue.clear();
  }

  /**
   * Get service status
   */
  getStatus(): {
    isScanning: boolean;
    isWatching: boolean;
    pendingUpdates: number;
  } {
    return {
      isScanning: this.isScanning,
      isWatching: this.watcher !== null,
      pendingUpdates: this.updateQueue.size,
    };
  }
}

// Export singleton instance
export const fileMetadataService = new FileMetadataService();

