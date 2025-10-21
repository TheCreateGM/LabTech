import { BaseRepository } from './BaseRepository';

/**
 * File metadata model interface
 */
export interface FileMetadata {
  id: string;
  file_name: string;
  relative_path: string;
  absolute_path: string;
  file_size: number;
  file_type: string | null;
  extension: string | null;
  checksum: string | null;
  is_directory: boolean;
  last_modified: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * File metadata creation data
 */
export interface CreateFileMetadataData {
  file_name: string;
  relative_path: string;
  absolute_path: string;
  file_size: number;
  file_type?: string | null;
  extension?: string | null;
  checksum?: string | null;
  is_directory?: boolean;
  last_modified: Date;
}

/**
 * File metadata update data
 */
export interface UpdateFileMetadataData {
  file_name?: string;
  absolute_path?: string;
  file_size?: number;
  file_type?: string | null;
  extension?: string | null;
  checksum?: string | null;
  is_directory?: boolean;
  last_modified?: Date;
}

/**
 * Repository for file metadata data access
 */
export class FileMetadataRepository extends BaseRepository<FileMetadata> {
  constructor() {
    super('file_metadata');
  }

  /**
   * Create new file metadata entry
   */
  async create(fileData: CreateFileMetadataData): Promise<FileMetadata> {
    const query = `
      INSERT INTO ${this.tableName} (
        file_name,
        relative_path,
        absolute_path,
        file_size,
        file_type,
        extension,
        checksum,
        is_directory,
        last_modified
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const params = [
      fileData.file_name,
      fileData.relative_path,
      fileData.absolute_path,
      fileData.file_size,
      fileData.file_type || null,
      fileData.extension || null,
      fileData.checksum || null,
      fileData.is_directory || false,
      fileData.last_modified,
    ];

    const results = await this.query<FileMetadata>(query, params);
    return results[0];
  }

  /**
   * Update file metadata
   */
  async update(id: string, fileData: UpdateFileMetadataData): Promise<FileMetadata | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Build dynamic update query
    if (fileData.file_name !== undefined) {
      updates.push(`file_name = $${paramIndex++}`);
      params.push(fileData.file_name);
    }

    if (fileData.absolute_path !== undefined) {
      updates.push(`absolute_path = $${paramIndex++}`);
      params.push(fileData.absolute_path);
    }

    if (fileData.file_size !== undefined) {
      updates.push(`file_size = $${paramIndex++}`);
      params.push(fileData.file_size);
    }

    if (fileData.file_type !== undefined) {
      updates.push(`file_type = $${paramIndex++}`);
      params.push(fileData.file_type);
    }

    if (fileData.extension !== undefined) {
      updates.push(`extension = $${paramIndex++}`);
      params.push(fileData.extension);
    }

    if (fileData.checksum !== undefined) {
      updates.push(`checksum = $${paramIndex++}`);
      params.push(fileData.checksum);
    }

    if (fileData.is_directory !== undefined) {
      updates.push(`is_directory = $${paramIndex++}`);
      params.push(fileData.is_directory);
    }

    if (fileData.last_modified !== undefined) {
      updates.push(`last_modified = $${paramIndex++}`);
      params.push(fileData.last_modified);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    // Add ID parameter
    params.push(id);

    const query = `
      UPDATE ${this.tableName}
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const results = await this.query<FileMetadata>(query, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find file metadata by relative path
   */
  async findByPath(relativePath: string): Promise<FileMetadata | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE relative_path = $1`;
    const results = await this.query<FileMetadata>(query, [relativePath]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find all files with optional filters
   */
  async findAllFiles(options?: {
    fileType?: string;
    extension?: string;
    isDirectory?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<FileMetadata[]> {
    const whereClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (options?.fileType) {
      whereClauses.push(`file_type = $${paramIndex++}`);
      params.push(options.fileType);
    }

    if (options?.extension) {
      whereClauses.push(`extension = $${paramIndex++}`);
      params.push(options.extension);
    }

    if (options?.isDirectory !== undefined) {
      whereClauses.push(`is_directory = $${paramIndex++}`);
      params.push(options.isDirectory);
    }

    let query = `SELECT * FROM ${this.tableName}`;

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    query += ` ORDER BY relative_path ASC`;

    if (options?.limit !== undefined) {
      params.push(options.limit);
      query += ` LIMIT $${paramIndex++}`;
    }

    if (options?.offset !== undefined) {
      params.push(options.offset);
      query += ` OFFSET $${paramIndex}`;
    }

    return await this.query<FileMetadata>(query, params);
  }

  /**
   * Find files by directory path
   */
  async findByDirectory(directoryPath: string): Promise<FileMetadata[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE relative_path LIKE $1
      ORDER BY relative_path ASC
    `;
    return await this.query<FileMetadata>(query, [`${directoryPath}%`]);
  }

  /**
   * Find files by file type
   */
  async findByFileType(fileType: string): Promise<FileMetadata[]> {
    return this.findAllFiles({ fileType });
  }

  /**
   * Find files by extension
   */
  async findByExtension(extension: string): Promise<FileMetadata[]> {
    return this.findAllFiles({ extension });
  }

  /**
   * Find directories only
   */
  async findDirectories(): Promise<FileMetadata[]> {
    return this.findAllFiles({ isDirectory: true });
  }

  /**
   * Find files only (not directories)
   */
  async findFiles(): Promise<FileMetadata[]> {
    return this.findAllFiles({ isDirectory: false });
  }

  /**
   * Search files by name pattern
   */
  async searchByName(pattern: string): Promise<FileMetadata[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE file_name ILIKE $1
      ORDER BY file_name ASC
    `;
    return await this.query<FileMetadata>(query, [`%${pattern}%`]);
  }

  /**
   * Get total file size
   */
  async getTotalSize(isDirectory?: boolean): Promise<number> {
    let query = `SELECT COALESCE(SUM(file_size), 0) as total FROM ${this.tableName}`;
    const params: any[] = [];

    if (isDirectory !== undefined) {
      query += ` WHERE is_directory = $1`;
      params.push(isDirectory);
    }

    const results = await this.query<{ total: string }>(query, params);
    return parseInt(results[0].total, 10);
  }

  /**
   * Get file count by type
   */
  async countByType(): Promise<Record<string, number>> {
    const query = `
      SELECT file_type, COUNT(*) as count
      FROM ${this.tableName}
      WHERE file_type IS NOT NULL
      GROUP BY file_type
      ORDER BY count DESC
    `;

    const results = await this.query<{ file_type: string; count: string }>(query);
    return results.reduce(
      (acc, row) => {
        acc[row.file_type] = parseInt(row.count, 10);
        return acc;
      },
      {} as Record<string, number>
    );
  }

  /**
   * Get file count by extension
   */
  async countByExtension(): Promise<Record<string, number>> {
    const query = `
      SELECT extension, COUNT(*) as count
      FROM ${this.tableName}
      WHERE extension IS NOT NULL
      GROUP BY extension
      ORDER BY count DESC
    `;

    const results = await this.query<{ extension: string; count: string }>(query);
    return results.reduce(
      (acc, row) => {
        acc[row.extension] = parseInt(row.count, 10);
        return acc;
      },
      {} as Record<string, number>
    );
  }

  /**
   * Delete file metadata by path
   */
  async deleteByPath(relativePath: string): Promise<boolean> {
    const query = `DELETE FROM ${this.tableName} WHERE relative_path = $1`;
    const result = await this.executeRaw(query, [relativePath]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Upsert file metadata (insert or update if exists)
   */
  async upsert(fileData: CreateFileMetadataData): Promise<FileMetadata> {
    const query = `
      INSERT INTO ${this.tableName} (
        file_name,
        relative_path,
        absolute_path,
        file_size,
        file_type,
        extension,
        checksum,
        is_directory,
        last_modified
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (relative_path)
      DO UPDATE SET
        file_name = EXCLUDED.file_name,
        absolute_path = EXCLUDED.absolute_path,
        file_size = EXCLUDED.file_size,
        file_type = EXCLUDED.file_type,
        extension = EXCLUDED.extension,
        checksum = EXCLUDED.checksum,
        is_directory = EXCLUDED.is_directory,
        last_modified = EXCLUDED.last_modified
      RETURNING *
    `;

    const params = [
      fileData.file_name,
      fileData.relative_path,
      fileData.absolute_path,
      fileData.file_size,
      fileData.file_type || null,
      fileData.extension || null,
      fileData.checksum || null,
      fileData.is_directory || false,
      fileData.last_modified,
    ];

    const results = await this.query<FileMetadata>(query, params);
    return results[0];
  }

  /**
   * Batch upsert file metadata
   */
  async batchUpsert(filesData: CreateFileMetadataData[]): Promise<FileMetadata[]> {
    if (filesData.length === 0) {
      return [];
    }

    const client = await this.getClient();

    try {
      await client.query('BEGIN');

      const results: FileMetadata[] = [];

      for (const fileData of filesData) {
        const query = `
          INSERT INTO ${this.tableName} (
            file_name,
            relative_path,
            absolute_path,
            file_size,
            file_type,
            extension,
            checksum,
            is_directory,
            last_modified
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (relative_path)
          DO UPDATE SET
            file_name = EXCLUDED.file_name,
            absolute_path = EXCLUDED.absolute_path,
            file_size = EXCLUDED.file_size,
            file_type = EXCLUDED.file_type,
            extension = EXCLUDED.extension,
            checksum = EXCLUDED.checksum,
            is_directory = EXCLUDED.is_directory,
            last_modified = EXCLUDED.last_modified
          RETURNING *
        `;

        const params = [
          fileData.file_name,
          fileData.relative_path,
          fileData.absolute_path,
          fileData.file_size,
          fileData.file_type || null,
          fileData.extension || null,
          fileData.checksum || null,
          fileData.is_directory || false,
          fileData.last_modified,
        ];

        const result = await client.query(query, params);
        results.push(result.rows[0]);
      }

      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

// Export singleton instance
export const fileMetadataRepository = new FileMetadataRepository();
