import { BaseRepository } from './BaseRepository';

/**
 * User model interface
 */
export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: 'user' | 'admin' | 'super_admin';
  mfa_secret: string | null;
  mfa_enabled: boolean;
  created_at: Date;
  updated_at: Date;
  last_login: Date | null;
  consent_given?: boolean;
  consent_date?: Date | null;
  data_retention_date?: Date | null;
}

/**
 * User creation data (without generated fields)
 */
export interface CreateUserData {
  username: string;
  email: string;
  password_hash: string;
  role?: 'user' | 'admin' | 'super_admin';
  mfa_secret?: string | null;
  mfa_enabled?: boolean;
}

/**
 * User update data (partial)
 */
export interface UpdateUserData {
  username?: string;
  email?: string;
  password_hash?: string;
  role?: 'user' | 'admin' | 'super_admin';
  mfa_secret?: string | null;
  mfa_enabled?: boolean;
  last_login?: Date;
}

/**
 * Repository for user data access
 */
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE username = $1`;
    const results = await this.query<User>(query, [username]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE email = $1`;
    const results = await this.query<User>(query, [email]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Create a new user
   */
  async create(userData: CreateUserData): Promise<User> {
    const query = `
      INSERT INTO ${this.tableName} (
        username, 
        email, 
        password_hash, 
        role, 
        mfa_secret, 
        mfa_enabled
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const params = [
      userData.username,
      userData.email,
      userData.password_hash,
      userData.role || 'user',
      userData.mfa_secret || null,
      userData.mfa_enabled || false,
    ];

    const results = await this.query<User>(query, params);
    return results[0];
  }

  /**
   * Update user data
   */
  async update(id: string, userData: UpdateUserData): Promise<User | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Build dynamic update query
    if (userData.username !== undefined) {
      updates.push(`username = $${paramIndex++}`);
      params.push(userData.username);
    }

    if (userData.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      params.push(userData.email);
    }

    if (userData.password_hash !== undefined) {
      updates.push(`password_hash = $${paramIndex++}`);
      params.push(userData.password_hash);
    }

    if (userData.role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      params.push(userData.role);
    }

    if (userData.mfa_secret !== undefined) {
      updates.push(`mfa_secret = $${paramIndex++}`);
      params.push(userData.mfa_secret);
    }

    if (userData.mfa_enabled !== undefined) {
      updates.push(`mfa_enabled = $${paramIndex++}`);
      params.push(userData.mfa_enabled);
    }

    if (userData.last_login !== undefined) {
      updates.push(`last_login = $${paramIndex++}`);
      params.push(userData.last_login);
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

    const results = await this.query<User>(query, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find users by role
   */
  async findByRole(role: 'user' | 'admin' | 'super_admin'): Promise<User[]> {
    const query = `SELECT * FROM ${this.tableName} WHERE role = $1`;
    return await this.query<User>(query, [role]);
  }

  /**
   * Check if username exists
   */
  async usernameExists(username: string): Promise<boolean> {
    const query = `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE username = $1) as exists`;
    const results = await this.query<{ exists: boolean }>(query, [username]);
    return results[0].exists;
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const query = `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE email = $1) as exists`;
    const results = await this.query<{ exists: boolean }>(query, [email]);
    return results[0].exists;
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    const query = `UPDATE ${this.tableName} SET last_login = CURRENT_TIMESTAMP WHERE id = $1`;
    await this.query(query, [id]);
  }

  /**
   * Get user count by role
   */
  async countByRole(role: 'user' | 'admin' | 'super_admin'): Promise<number> {
    return await this.count('role = $1', [role]);
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
