/**
 * Migration: Add performance indexes for frequently queried columns
 * 
 * This migration adds composite indexes and optimizes existing indexes
 * to improve query performance for activity logs and file metadata.
 */

exports.up = async (pgm) => {
  // Activity logs performance indexes
  
  // Composite index for filtering by user and date range
  pgm.createIndex('activity_logs', ['user_id', 'timestamp'], {
    name: 'idx_activity_logs_user_timestamp',
    method: 'btree',
  });

  // Composite index for filtering by action and date range
  pgm.createIndex('activity_logs', ['action', 'timestamp'], {
    name: 'idx_activity_logs_action_timestamp',
    method: 'btree',
  });

  // Composite index for filtering by resource type and path
  pgm.createIndex('activity_logs', ['resource_type', 'resource_path'], {
    name: 'idx_activity_logs_resource_type_path',
    method: 'btree',
  });

  // Index for IP address filtering (security analysis)
  pgm.createIndex('activity_logs', 'ip_address', {
    name: 'idx_activity_logs_ip_address',
    method: 'btree',
  });

  // Partial index for recent activities (last 30 days)
  pgm.sql(`
    CREATE INDEX idx_activity_logs_recent 
    ON activity_logs (timestamp DESC) 
    WHERE timestamp > NOW() - INTERVAL '30 days'
  `);

  // File metadata performance indexes
  
  // Index for file type filtering
  pgm.createIndex('file_metadata', 'file_type', {
    name: 'idx_file_metadata_file_type',
    method: 'btree',
  });

  // Index for extension filtering
  pgm.createIndex('file_metadata', 'extension', {
    name: 'idx_file_metadata_extension',
    method: 'btree',
  });

  // Index for directory filtering
  pgm.createIndex('file_metadata', 'is_directory', {
    name: 'idx_file_metadata_is_directory',
    method: 'btree',
  });

  // Composite index for file size and type (analytics)
  pgm.createIndex('file_metadata', ['file_type', 'file_size'], {
    name: 'idx_file_metadata_type_size',
    method: 'btree',
  });

  // Index for last modified date (sorting)
  pgm.createIndex('file_metadata', 'last_modified', {
    name: 'idx_file_metadata_last_modified',
    method: 'btree',
  });

  // Users performance indexes
  
  // Index for role-based queries
  pgm.createIndex('users', 'role', {
    name: 'idx_users_role',
    method: 'btree',
  });

  // Index for MFA enabled users
  pgm.createIndex('users', 'mfa_enabled', {
    name: 'idx_users_mfa_enabled',
    method: 'btree',
  });

  // Index for last login (user activity analysis)
  pgm.createIndex('users', 'last_login', {
    name: 'idx_users_last_login',
    method: 'btree',
  });

  // Admin sessions performance indexes
  
  // Index for token expiry (cleanup queries)
  pgm.createIndex('admin_sessions', 'expires_at', {
    name: 'idx_admin_sessions_expires_at',
    method: 'btree',
  });

  // Composite index for user and expiry
  pgm.createIndex('admin_sessions', ['user_id', 'expires_at'], {
    name: 'idx_admin_sessions_user_expires',
    method: 'btree',
  });

  console.log('Performance indexes created successfully');
};

exports.down = async (pgm) => {
  // Drop activity logs indexes
  pgm.dropIndex('activity_logs', ['user_id', 'timestamp'], {
    name: 'idx_activity_logs_user_timestamp',
  });
  pgm.dropIndex('activity_logs', ['action', 'timestamp'], {
    name: 'idx_activity_logs_action_timestamp',
  });
  pgm.dropIndex('activity_logs', ['resource_type', 'resource_path'], {
    name: 'idx_activity_logs_resource_type_path',
  });
  pgm.dropIndex('activity_logs', 'ip_address', {
    name: 'idx_activity_logs_ip_address',
  });
  pgm.sql('DROP INDEX IF EXISTS idx_activity_logs_recent');

  // Drop file metadata indexes
  pgm.dropIndex('file_metadata', 'file_type', {
    name: 'idx_file_metadata_file_type',
  });
  pgm.dropIndex('file_metadata', 'extension', {
    name: 'idx_file_metadata_extension',
  });
  pgm.dropIndex('file_metadata', 'is_directory', {
    name: 'idx_file_metadata_is_directory',
  });
  pgm.dropIndex('file_metadata', ['file_type', 'file_size'], {
    name: 'idx_file_metadata_type_size',
  });
  pgm.dropIndex('file_metadata', 'last_modified', {
    name: 'idx_file_metadata_last_modified',
  });

  // Drop users indexes
  pgm.dropIndex('users', 'role', {
    name: 'idx_users_role',
  });
  pgm.dropIndex('users', 'mfa_enabled', {
    name: 'idx_users_mfa_enabled',
  });
  pgm.dropIndex('users', 'last_login', {
    name: 'idx_users_last_login',
  });

  // Drop admin sessions indexes
  pgm.dropIndex('admin_sessions', 'expires_at', {
    name: 'idx_admin_sessions_expires_at',
  });
  pgm.dropIndex('admin_sessions', ['user_id', 'expires_at'], {
    name: 'idx_admin_sessions_user_expires',
  });

  console.log('Performance indexes dropped successfully');
};
