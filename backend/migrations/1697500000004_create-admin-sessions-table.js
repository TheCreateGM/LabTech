/**
 * Migration: Create admin_sessions table
 * 
 * This migration creates the admin_sessions table for managing
 * JWT tokens, refresh tokens, and session tracking.
 */

exports.up = (pgm) => {
  // Create admin_sessions table
  pgm.createTable('admin_sessions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    token_hash: {
      type: 'varchar(255)',
      notNull: true,
      comment: 'Hashed access token for security',
    },
    refresh_token_hash: {
      type: 'varchar(255)',
      notNull: false,
      comment: 'Hashed refresh token',
    },
    expires_at: {
      type: 'timestamp',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    ip_address: {
      type: 'inet',
      notNull: false,
    },
    user_agent: {
      type: 'text',
      notNull: false,
    },
    is_revoked: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    revoked_at: {
      type: 'timestamp',
      notNull: false,
    },
    last_activity: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Create indexes for efficient querying
  pgm.createIndex('admin_sessions', 'token_hash', { unique: true });
  pgm.createIndex('admin_sessions', 'refresh_token_hash');
  pgm.createIndex('admin_sessions', 'user_id');
  pgm.createIndex('admin_sessions', 'expires_at');
  pgm.createIndex('admin_sessions', 'is_revoked');
  
  // Create composite index for active session queries
  pgm.createIndex('admin_sessions', ['user_id', 'is_revoked', 'expires_at']);

  // Add check constraint to ensure revoked_at is set when is_revoked is true
  pgm.addConstraint('admin_sessions', 'admin_sessions_revoked_check', {
    check: '(is_revoked = false AND revoked_at IS NULL) OR (is_revoked = true AND revoked_at IS NOT NULL)',
  });

  // Create function to automatically clean up expired sessions
  pgm.sql(`
    CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
    RETURNS void AS $$
    BEGIN
      DELETE FROM admin_sessions
      WHERE expires_at < CURRENT_TIMESTAMP
        AND is_revoked = false;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Add comments
  pgm.sql(`
    COMMENT ON TABLE admin_sessions IS 'Manages user authentication sessions and JWT tokens';
  `);

  pgm.sql(`
    COMMENT ON COLUMN admin_sessions.token_hash IS 'SHA-256 hash of the access token';
  `);

  pgm.sql(`
    COMMENT ON COLUMN admin_sessions.refresh_token_hash IS 'SHA-256 hash of the refresh token';
  `);

  pgm.sql(`
    COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Removes expired sessions from the database';
  `);
};

exports.down = (pgm) => {
  // Drop function
  pgm.sql('DROP FUNCTION IF EXISTS cleanup_expired_sessions();');

  // Drop table (indexes and constraints are dropped automatically)
  pgm.dropTable('admin_sessions');
};
