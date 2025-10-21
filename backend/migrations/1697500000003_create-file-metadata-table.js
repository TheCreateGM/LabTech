/**
 * Migration: Create file_metadata table
 * 
 * This migration creates the file_metadata table for storing information
 * about files and folders in the application.
 */

exports.up = (pgm) => {
  // Create file_metadata table
  pgm.createTable('file_metadata', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    file_name: {
      type: 'varchar(255)',
      notNull: true,
    },
    relative_path: {
      type: 'text',
      notNull: true,
      unique: true,
    },
    absolute_path: {
      type: 'text',
      notNull: true,
    },
    file_size: {
      type: 'bigint',
      notNull: true,
      default: 0,
    },
    file_type: {
      type: 'varchar(100)',
      notNull: false,
    },
    extension: {
      type: 'varchar(50)',
      notNull: false,
    },
    checksum: {
      type: 'varchar(64)',
      notNull: false,
      comment: 'SHA-256 hash of file content',
    },
    is_directory: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    last_modified: {
      type: 'timestamp',
      notNull: true,
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
  });

  // Create indexes for efficient querying
  pgm.createIndex('file_metadata', 'relative_path', { unique: true });
  pgm.createIndex('file_metadata', 'file_type');
  pgm.createIndex('file_metadata', 'extension');
  pgm.createIndex('file_metadata', 'is_directory');
  pgm.createIndex('file_metadata', 'last_modified', { method: 'btree', order: 'DESC' });
  pgm.createIndex('file_metadata', 'file_size');
  
  // Create composite index for common queries
  pgm.createIndex('file_metadata', ['file_type', 'is_directory']);

  // Create full-text search index on file_name
  pgm.sql(`
    CREATE INDEX file_metadata_file_name_trgm_idx 
    ON file_metadata 
    USING gin (file_name gin_trgm_ops);
  `);

  // Add check constraint for file_size
  pgm.addConstraint('file_metadata', 'file_metadata_file_size_check', {
    check: 'file_size >= 0',
  });

  // Create trigger to update updated_at timestamp
  pgm.sql(`
    CREATE TRIGGER update_file_metadata_updated_at
    BEFORE UPDATE ON file_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  // Add comments
  pgm.sql(`
    COMMENT ON TABLE file_metadata IS 'Stores metadata about files and folders in the application';
  `);

  pgm.sql(`
    COMMENT ON COLUMN file_metadata.checksum IS 'SHA-256 hash for file integrity verification';
  `);

  pgm.sql(`
    COMMENT ON COLUMN file_metadata.relative_path IS 'Path relative to project root';
  `);
};

exports.down = (pgm) => {
  // Drop trigger
  pgm.sql('DROP TRIGGER IF EXISTS update_file_metadata_updated_at ON file_metadata;');

  // Drop table (indexes and constraints are dropped automatically)
  pgm.dropTable('file_metadata');
};
