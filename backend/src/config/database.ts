import { Pool, PoolClient, PoolConfig } from 'pg';
import { config } from './index';

/**
 * Database connection pool manager
 */
class DatabaseConnection {
  private pool: Pool | null = null;
  private retryAttempts = 0;
  private maxRetries = 5;
  private retryDelay = 5000; // 5 seconds

  /**
   * Initialize the database connection pool
   */
  public async connect(): Promise<void> {
    if (this.pool) {
      console.log('Database pool already initialized');
      return;
    }

    const poolConfig: PoolConfig = {
      connectionString: config.database.url,
      min: config.database.poolMin,
      max: config.database.poolMax,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      // Enable statement timeout to prevent long-running queries
      statement_timeout: 30000, // 30 seconds
      // Enable query timeout
      query_timeout: 30000,
      // Allow exit on idle to free up resources
      allowExitOnIdle: false,
    };

    this.pool = new Pool(poolConfig);

    // Handle pool errors
    this.pool.on('error', (err: Error) => {
      console.error('Unexpected database pool error:', err);
    });

    // Handle pool connection events
    this.pool.on('connect', () => {
      console.log('New database client connected to pool');
    });

    // Handle pool removal events
    this.pool.on('remove', () => {
      console.log('Database client removed from pool');
    });

    try {
      await this.testConnection();
      console.log('Database connection pool initialized successfully');
      console.log(`Pool configuration: min=${poolConfig.min}, max=${poolConfig.max}`);
      this.retryAttempts = 0;
    } catch (error) {
      console.error('Failed to connect to database:', error);
      await this.handleConnectionError();
    }
  }

  /**
   * Handle connection errors with retry logic
   */
  private async handleConnectionError(): Promise<void> {
    if (this.retryAttempts < this.maxRetries) {
      this.retryAttempts++;
      console.log(
        `Retrying database connection (${this.retryAttempts}/${this.maxRetries}) in ${this.retryDelay / 1000}s...`
      );

      await new Promise((resolve) => setTimeout(resolve, this.retryDelay));

      // Exponential backoff
      this.retryDelay *= 2;

      await this.connect();
    } else {
      console.error('Max retry attempts reached. Database connection failed.');
      throw new Error('Unable to connect to database after multiple attempts');
    }
  }

  /**
   * Test database connection
   */
  private async testConnection(): Promise<void> {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT NOW()');
      console.log('Database connection test successful:', result.rows[0].now);
    } finally {
      client.release();
    }
  }

  /**
   * Get the database pool instance
   */
  public getPool(): Pool {
    if (!this.pool) {
      throw new Error('Database pool not initialized. Call connect() first.');
    }
    return this.pool;
  }

  /**
   * Execute a query with automatic client management
   */
  public async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    try {
      const result = await this.pool.query(text, params);
      return result.rows;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * Get a client from the pool for transaction management
   */
  public async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    return await this.pool.connect();
  }

  /**
   * Check database health
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    message: string;
    details?: any;
  }> {
    try {
      if (!this.pool) {
        return {
          status: 'unhealthy',
          message: 'Database pool not initialized',
        };
      }

      const client = await this.pool.connect();
      try {
        const result = await client.query('SELECT NOW(), version()');
        const poolStats = {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount,
        };

        return {
          status: 'healthy',
          message: 'Database connection is healthy',
          details: {
            timestamp: result.rows[0].now,
            version: result.rows[0].version,
            pool: poolStats,
          },
        };
      } finally {
        client.release();
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Close all database connections
   */
  public async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('Database connection pool closed');
    }
  }
}

// Export singleton instance
export const db = new DatabaseConnection();

