import { UserRepository } from '../repositories/UserRepository';
import { ActivityLogRepository } from '../repositories/ActivityLogRepository';
import { FileMetadataRepository } from '../repositories/FileMetadataRepository';
import { db } from '../config/database';

/**
 * GDPR audit log entry
 */
export interface GDPRAuditLog {
  id: string;
  user_id: string;
  action: 'export' | 'delete' | 'anonymize' | 'consent_given' | 'consent_withdrawn';
  performed_by: string | null;
  metadata: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: Date;
}

/**
 * User data export structure
 */
export interface UserDataExport {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    created_at: Date;
    updated_at: Date;
    last_login: Date | null;
    consent_given: boolean;
    consent_date: Date | null;
  };
  activityLogs: Array<{
    id: string;
    action: string;
    resource_type: string;
    resource_path: string;
    metadata: Record<string, any> | null;
    timestamp: Date;
  }>;
  gdprAuditLogs: GDPRAuditLog[];
  exportDate: Date;
  exportedBy: string;
}

/**
 * GDPR Service for handling data privacy compliance
 */
export class GDPRService {
  private userRepository: UserRepository;
  private activityLogRepository: ActivityLogRepository;
  private fileMetadataRepository: FileMetadataRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.activityLogRepository = new ActivityLogRepository();
    this.fileMetadataRepository = new FileMetadataRepository();
  }

  /**
   * Export all user data in JSON format (GDPR Right to Access)
   */
  async exportUserData(
    userId: string,
    performedBy?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserDataExport> {
    // Get user data
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get activity logs
    const activityLogsResult = await this.activityLogRepository.findByUserId(userId, {
      page: 1,
      limit: 10000,
    });

    // Get GDPR audit logs
    const gdprAuditLogs = await this.getGDPRAuditLogs(userId);

    // Create export data
    const exportData: UserDataExport = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: user.last_login,
        consent_given: user.consent_given || false,
        consent_date: user.consent_date || null,
      },
      activityLogs: activityLogsResult.data.map((log) => ({
        id: log.id,
        action: log.action,
        resource_type: log.resource_type,
        resource_path: log.resource_path,
        metadata: log.metadata,
        timestamp: log.timestamp,
      })),
      gdprAuditLogs,
      exportDate: new Date(),
      exportedBy: performedBy || userId,
    };

    // Log the export action
    await this.logGDPRAction(
      userId,
      'export',
      performedBy || null,
      {
        recordCount: {
          activityLogs: activityLogsResult.data.length,
          gdprAuditLogs: gdprAuditLogs.length,
        },
      },
      ipAddress,
      userAgent
    );

    return exportData;
  }

  /**
   * Delete all user data (GDPR Right to Erasure)
   */
  async deleteUserData(
    userId: string,
    performedBy?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // Get counts before deletion for audit log
      const activityCountResult = await client.query(
        'SELECT COUNT(*) as count FROM activity_logs WHERE user_id = $1',
        [userId]
      );
      const activityCount = parseInt(activityCountResult.rows[0].count, 10);

      // Log the deletion action before deleting
      await this.logGDPRAction(
        userId,
        'delete',
        performedBy || null,
        {
          recordsDeleted: {
            activityLogs: activityCount,
          },
        },
        ipAddress,
        userAgent
      );

      // Delete activity logs (will be anonymized, not deleted, to maintain system integrity)
      await client.query('UPDATE activity_logs SET user_id = NULL WHERE user_id = $1', [userId]);

      // Delete admin sessions
      await client.query('DELETE FROM admin_sessions WHERE user_id = $1', [userId]);

      // Delete user account
      await client.query('DELETE FROM users WHERE id = $1', [userId]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Anonymize user data (alternative to deletion)
   */
  async anonymizeUserData(
    userId: string,
    performedBy?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // Generate anonymous identifiers
      const anonymousUsername = `anonymous_${Date.now()}`;
      const anonymousEmail = `anonymous_${Date.now()}@deleted.local`;

      // Anonymize user account
      await client.query(
        `UPDATE users 
         SET username = $1, 
             email = $2, 
             password_hash = 'ANONYMIZED',
             mfa_secret = NULL,
             mfa_enabled = false,
             consent_given = false
         WHERE id = $3`,
        [anonymousUsername, anonymousEmail, userId]
      );

      // Anonymize activity logs (set user_id to NULL)
      await client.query('UPDATE activity_logs SET user_id = NULL WHERE user_id = $1', [userId]);

      // Log the anonymization action
      await this.logGDPRAction(
        userId,
        'anonymize',
        performedBy || null,
        {
          anonymizedUsername,
          anonymizedEmail,
        },
        ipAddress,
        userAgent
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Record user consent
   */
  async recordConsent(
    userId: string,
    consentGiven: boolean,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // Update user consent
      await client.query(
        `UPDATE users 
         SET consent_given = $1, 
             consent_date = $2,
             data_retention_date = $3
         WHERE id = $4`,
        [
          consentGiven,
          new Date(),
          consentGiven ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null, // 1 year retention
          userId,
        ]
      );

      // Log the consent action
      await this.logGDPRAction(
        userId,
        consentGiven ? 'consent_given' : 'consent_withdrawn',
        null,
        { consentGiven },
        ipAddress,
        userAgent
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get GDPR audit logs for a user
   */
  private async getGDPRAuditLogs(userId: string): Promise<GDPRAuditLog[]> {
    const query = `
      SELECT * FROM gdpr_audit_logs
      WHERE user_id = $1
      ORDER BY timestamp DESC
    `;

    const result = await db.query(query, [userId]);
    return result.rows;
  }

  /**
   * Log a GDPR action to the audit log
   */
  private async logGDPRAction(
    userId: string,
    action: GDPRAuditLog['action'],
    performedBy: string | null,
    metadata: Record<string, any> | null,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const query = `
      INSERT INTO gdpr_audit_logs (
        user_id,
        action,
        performed_by,
        metadata,
        ip_address,
        user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await db.query(query, [
      userId,
      action,
      performedBy,
      metadata ? JSON.stringify(metadata) : null,
      ipAddress || null,
      userAgent || null,
    ]);
  }

  /**
   * Get users whose data retention period has expired
   */
  async getExpiredDataRetentionUsers(): Promise<string[]> {
    const query = `
      SELECT id FROM users
      WHERE data_retention_date IS NOT NULL
        AND data_retention_date < NOW()
        AND consent_given = false
    `;

    const result = await db.query(query);
    return result.rows.map((row) => row.id);
  }

  /**
   * Check if user has given consent
   */
  async hasConsent(userId: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    return user?.consent_given || false;
  }
}

// Export singleton instance
export const gdprService = new GDPRService();
