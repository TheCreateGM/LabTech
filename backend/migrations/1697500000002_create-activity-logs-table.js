/**
 * Migration: Create activity_logs table
 * 
 * This migration creates the activity_logs table for tracking user activities
 * with support for JSONB metadata, IP addresses, and comprehensive indexing.
 */

exports.up = (pgm) => {
  // Create activity_logs table
  pgm.createTable('activity_logs', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    user_id: {
      type: 'uuid',
      notNull: false,
      references: 'users',
      onDelete: 'SET NULL',
    },
    action: {
      type: 'varchar(50)',
      notNull: true,
    },
    resource_type: {
      type: 'varchar(50)',
      notNull: true,
    },
    resource_path: {
      type: 'text',
      notNull: true,
    },
    metadata: {
      type: 'jsonb',
      notNull: false,
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

  // Create indexes for efficient querying
  pgm.createIndex('activity_logs', 'user_id');
  pgm.createIndex('activity_logs', 'timestamp', { method: 'btree', order: 'DESC' });
  pgm.createIndex('activity_logs', 'action');
  pgm.createIndex('activity_logs', 'resource_type');
  pgm.createIndex('activity_logs', 'resource_path', { method: 'hash' });
  
  // Create composite index for common query patterns
  pgm.createIndex('activity_logs', ['user_id', 'timestamp'], { method: 'btree' });
  pgm.createIndex('activity_logs', ['action', 'timestamp'], { method: 'btree' });

  // Create GIN index for JSONB metadata queries
  pgm.createIndex('activity_logs', 'metadata', { method: 'gin' });

  // Add check constraint for action types
  pgm.addConstraint('activity_logs', 'activity_logs_action_check', {
    check: "action IN ('read', 'write', 'delete', 'open', 'download', 'create', 'update', 'view', 'export')",
  });

  // Add check constraint for resource types
  pgm.addConstraint('activity_logs', 'activity_logs_resource_type_check', {
    check: "resource_type IN ('file', 'folder', 'page', 'api', 'database', 'system')",
  });

  // Add comment to table
  pgm.sql(`
    COMMENT ON TABLE activity_logs IS 'Stores user activity logs for auditing and monitoring';
  `);

  pgm.sql(`
    COMMENT ON COLUMN activity_logs.metadata IS 'Additional context data stored as JSON';
  `);
};

exports.down = (pgm) => {
  // Drop table (indexes and constraints are dropped automatically)
  pgm.dropTable('activity_logs');
};
