/**
 * Migration: Create users table
 * 
 * This migration creates the users table with UUID primary keys,
 * authentication fields, role-based access control, and MFA support.
 */

exports.up = (pgm) => {
  // Enable UUID extension
  pgm.createExtension('uuid-ossp', { ifNotExists: true });

  // Create users table
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    username: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    email: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: 'varchar(255)',
      notNull: true,
    },
    role: {
      type: 'varchar(50)',
      notNull: true,
      default: 'user',
    },
    mfa_secret: {
      type: 'varchar(255)',
      notNull: false,
    },
    mfa_enabled: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    last_login: {
      type: 'timestamp',
      notNull: false,
    },
  });

  // Create indexes
  pgm.createIndex('users', 'username');
  pgm.createIndex('users', 'email');
  pgm.createIndex('users', 'role');

  // Add check constraint for role
  pgm.addConstraint('users', 'users_role_check', {
    check: "role IN ('user', 'admin', 'super_admin')",
  });

  // Create trigger to update updated_at timestamp
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  pgm.sql(`
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
};

exports.down = (pgm) => {
  // Drop trigger and function
  pgm.sql('DROP TRIGGER IF EXISTS update_users_updated_at ON users;');
  pgm.sql('DROP FUNCTION IF EXISTS update_updated_at_column();');

  // Drop table
  pgm.dropTable('users');

  // Drop extension (optional, may be used by other tables)
  // pgm.dropExtension('uuid-ossp');
};
