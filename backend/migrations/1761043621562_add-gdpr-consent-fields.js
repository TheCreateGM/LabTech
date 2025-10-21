/**
 * Migration: Add GDPR consent tracking fields to users table
 */

exports.up = (pgm) => {
  // Add consent tracking fields
  pgm.addColumns('users', {
    consent_given: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    consent_date: {
      type: 'timestamp',
      notNull: false,
    },
    data_retention_date: {
      type: 'timestamp',
      notNull: false,
      comment: 'Date when user data should be deleted if not renewed',
    },
  });

  // Create GDPR audit log table
  pgm.createTable('gdpr_audit_logs', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    action: {
      type: 'varchar(50)',
      notNull: true,
      comment: 'GDPR action: export, delete, anonymize, consent_given, consent_withdrawn',
    },
    performed_by: {
      type: 'uuid',
      notNull: false,
      references: 'users',
      onDelete: 'SET NULL',
      comment: 'Admin user who performed the action (null if self-service)',
    },
    metadata: {
      type: 'jsonb',
      notNull: false,
      comment: 'Additional information about the action',
    },
    ip_address: {
      type: 'inet',
      notNull: false,
    },
    user_agent: {
      type: 'text',
      notNull: false,
    },
    timestamp: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Create indexes for GDPR audit logs
  pgm.createIndex('gdpr_audit_logs', 'user_id');
  pgm.createIndex('gdpr_audit_logs', 'action');
  pgm.createIndex('gdpr_audit_logs', ['timestamp'], { method: 'btree', order: 'DESC' });
};

exports.down = (pgm) => {
  // Drop GDPR audit log table
  pgm.dropTable('gdpr_audit_logs');

  // Remove consent tracking fields
  pgm.dropColumns('users', ['consent_given', 'consent_date', 'data_retention_date']);
};
