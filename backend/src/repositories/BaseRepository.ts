import { PoolClient } from 'pg';
import { db } from '../config/database';

/**
 * Base repository class with common CRUD operations
 * All repositories should extend this class
 */
export abstract class BaseRepository<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Execute a query with prepared statement
   */
  protected async query<R = any>(text: string, params?: any[]): Promise<R[]> {
    try {
      return await db.query<R>(text, params);
    } catch (error) {
      console.error(`Query error in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Get a database client for transaction management
   */
  protected async getClient(): Promise<PoolClient> {
    return await db.getClient();
  }

  /**
   * Find a record by ID
   */
  async findById(id: string): Promise<T | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const results = await this.query<T>(query, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find all records with optional limit and offset
   */
  async findAll(limit?: number, offset?: number): Promise<T[]> {
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];

    if (limit !== undefined) {
      params.push(limit);
      query += ` LIMIT $${params.length}`;
    }

    if (offset !== undefined) {
      params.push(offset);
      query += ` OFFSET $${params.length}`;
    }

    return await this.query<T>(query, params);
  }

  /**
   * Count total records
   */
  async count(whereClause?: string, params?: any[]): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    
    if (whereClause) {
      query += ` WHERE ${whereClause}`;
    }

    const results = await this.query<{ count: string }>(query, params);
    return parseInt(results[0].count, 10);
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
    const result = await db.getPool().query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Check if a record exists by ID
   */
  async exists(id: string): Promise<boolean> {
    const query = `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE id = $1) as exists`;
    const results = await this.query<{ exists: boolean }>(query, [id]);
    return results[0].exists;
  }

  /**
   * Execute a raw query (use with caution)
   */
  protected async executeRaw(query: string, params?: any[]): Promise<any> {
    return await db.getPool().query(query, params);
  }
}
