# Database Schema Documentation

Complete database schema documentation for the LabTech GeoLab User Tracking System.

## Table of Contents

- [Overview](#overview)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Tables](#tables)
- [Indexes](#indexes)
- [Relationships](#relationships)
- [Data Types](#data-types)
- [Migrations](#migrations)

## Overview

The database uses PostgreSQL 15+ and follows a normalized relational design. All tables use UUID primary keys for better distribution and security.

### Database Statistics

- **Tables**: 4 main tables
- **Indexes**: 12 indexes
- **Foreign Keys**: 3 relationships
- **Estimated Size**: ~100MB per 1M activity logs

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         users                                │
├─────────────────────────────────────────────────────────────┤
│ PK │ id                UUID                                  │
│    │ username          VARCHAR(255)  UNIQUE NOT NULL        │
│    │ email             VARCHAR(255)  UNIQUE NOT NULL        │
│    │ password_hash     VARCHAR(255)  NOT NULL               │
│    │ role              VARCHAR(50)   NOT NULL DEFAULT 'user'│
│    │ mfa_secret        VARCHAR(255)                         │
│    │ mfa_enabled       BOOLEAN       DEFAULT FALSE          │
│    │ consent_given     BOOLEAN       DEFAULT FALSE          │
│    │ consent_date      TIMESTAMP                            │
│    │ created_at        TIMESTAMP     DEFAULT NOW()          │
│    │ updated_at        TIMESTAMP     DEFAULT NOW()          │
│    │ last_login        TIMESTAMP                            │
└──────────┬──────────────────────────────────────────────────┘
           │
           │ 1:N
           │
┌──────────┴──────────────────────────────────────────────────┐
│                    activity_logs                             │
├─────────────────────────────────────────────────────────────┤
│ PK │ id                UUID                                  │
│ FK │ user_id           UUID          REFERENCES users(id)   │
│    │ action            VARCHAR(50)   NOT NULL               │
│    │ resource_type     VARCHAR(50)   NOT NULL               │
│    │ resource_path     TEXT          NOT NULL               │
│    │ metadata          JSONB                                │
│    │ ip_address        INET                                 │
│    │ user_agent        TEXT                                 │
│    │ timestamp         TIMESTAMP     NOT NULL DEFAULT NOW() │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    file_metadata                             │
├─────────────────────────────────────────────────────────────┤
│ PK │ id                UUID                                  │
│    │ file_name         VARCHAR(255)  NOT NULL               │
│    │ relative_path     TEXT          NOT NULL UNIQUE        │
│    │ absolute_path     TEXT          NOT NULL               │
│    │ file_size         BIGINT        NOT NULL               │
│    │ file_type         VARCHAR(100)                         │
│    │ extension         VARCHAR(50)                          │
│    │ checksum          VARCHAR(64)                          │
│    │ is_directory      BOOLEAN       DEFAULT FALSE          │
│    │ last_modified     TIMESTAMP     NOT NULL               │
│    │ created_at        TIMESTAMP     DEFAULT NOW()          │
│    │ updated_at        TIMESTAMP     DEFAULT NOW()          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    admin_sessions                            │
├─────────────────────────────────────────────────────────────┤
│ PK │ id                UUID                                  │
│ FK │ user_id           UUID          REFERENCES users(id)   │
│    │ token_hash        VARCHAR(255)  NOT NULL               │
│    │ refresh_token_hash VARCHAR(255)                        │
│    │ expires_at        TIMESTAMP     NOT NULL               │
│    │ created_at        TIMESTAMP     DEFAULT NOW()          │
│    │ ip_address        INET                                 │
│    │ user_agent        TEXT                                 │
└─────────────────────────────────────────────────────────────┘
```

## Tables

### users

Stores user account information and authentication data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique user identifier |
| username | VARCHAR(255) | UNIQUE, NOT NULL | User's login name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| role | VARCHAR(50) | NOT NULL, DEFAULT 'user' | User role (user, admin, super_admin) |
| mfa_secret | VARCHAR(255) | NULL | TOTP secret for MFA |
| mfa_enabled | BOOLEAN | DEFAULT FALSE | Whether MFA is enabled |
| consent_given | BOOLEAN | DEFAULT FALSE | GDPR consent status |
| consent_date | TIMESTAMP | NULL | Date consent was given |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| last_login | TIMESTAMP | NULL | Last successful login |

**Indexes**:
- `users_pkey` (PRIMARY KEY on id)
- `users_username_key` (UNIQUE on username)
- `users_email_key` (UNIQUE on email)
- `idx_users_role` (on role)

**Example**:
```sql
INSERT INTO users (username, email, password_hash, role)
VALUES (
  'johndoe',
  'john@example.com',
  '$2b$10$...',  -- bcrypt hash
  'user'
);
```

### activity_logs

Stores all user activity events for tracking and auditing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique activity identifier |
| user_id | UUID | FOREIGN KEY, NULL | Reference to users table |
| action | VARCHAR(50) | NOT NULL | Action type (read, write, delete, open, download) |
| resource_type | VARCHAR(50) | NOT NULL | Resource type (file, folder, page) |
| resource_path | TEXT | NOT NULL | Path to the resource |
| metadata | JSONB | NULL | Additional context data |
| ip_address | INET | NULL | Client IP address |
| user_agent | TEXT | NULL | Client user agent string |
| timestamp | TIMESTAMP | NOT NULL, DEFAULT NOW() | When the activity occurred |

**Indexes**:
- `activity_logs_pkey` (PRIMARY KEY on id)
- `idx_activity_logs_user_id` (on user_id)
- `idx_activity_logs_timestamp` (on timestamp DESC)
- `idx_activity_logs_action` (on action)
- `idx_activity_logs_resource_path` (on resource_path)
- `idx_activity_logs_metadata` (GIN on metadata)

**Foreign Keys**:
- `fk_activity_logs_user_id` FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL

**Example**:
```sql
INSERT INTO activity_logs (user_id, action, resource_type, resource_path, metadata, ip_address)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'read',
  'file',
  '/projects/sample.pdf',
  '{"fileSize": 1024000, "duration": 5000}'::jsonb,
  '192.168.1.100'::inet
);
```

### file_metadata

Stores metadata about files in the system for tracking and indexing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique file metadata identifier |
| file_name | VARCHAR(255) | NOT NULL | Name of the file |
| relative_path | TEXT | UNIQUE, NOT NULL | Relative path from project root |
| absolute_path | TEXT | NOT NULL | Absolute filesystem path |
| file_size | BIGINT | NOT NULL | File size in bytes |
| file_type | VARCHAR(100) | NULL | MIME type |
| extension | VARCHAR(50) | NULL | File extension |
| checksum | VARCHAR(64) | NULL | SHA-256 checksum |
| is_directory | BOOLEAN | DEFAULT FALSE | Whether this is a directory |
| last_modified | TIMESTAMP | NOT NULL | Last modification time |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Record update timestamp |

**Indexes**:
- `file_metadata_pkey` (PRIMARY KEY on id)
- `file_metadata_relative_path_key` (UNIQUE on relative_path)
- `idx_file_metadata_file_type` (on file_type)
- `idx_file_metadata_extension` (on extension)

**Example**:
```sql
INSERT INTO file_metadata (file_name, relative_path, absolute_path, file_size, file_type, extension, checksum, last_modified)
VALUES (
  'sample.pdf',
  '/projects/sample.pdf',
  '/var/www/labtech/projects/sample.pdf',
  1024000,
  'application/pdf',
  'pdf',
  'a1b2c3d4e5f6...',
  '2024-01-15 10:30:00'
);
```

### admin_sessions

Stores active admin sessions for token management and security.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique session identifier |
| user_id | UUID | FOREIGN KEY, NOT NULL | Reference to users table |
| token_hash | VARCHAR(255) | NOT NULL | Hashed access token |
| refresh_token_hash | VARCHAR(255) | NULL | Hashed refresh token |
| expires_at | TIMESTAMP | NOT NULL | Session expiration time |
| created_at | TIMESTAMP | DEFAULT NOW() | Session creation timestamp |
| ip_address | INET | NULL | Client IP address |
| user_agent | TEXT | NULL | Client user agent string |

**Indexes**:
- `admin_sessions_pkey` (PRIMARY KEY on id)
- `idx_admin_sessions_token_hash` (on token_hash)
- `idx_admin_sessions_user_id` (on user_id)

**Foreign Keys**:
- `fk_admin_sessions_user_id` FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

**Example**:
```sql
INSERT INTO admin_sessions (user_id, token_hash, refresh_token_hash, expires_at, ip_address)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'hashed_access_token',
  'hashed_refresh_token',
  NOW() + INTERVAL '15 minutes',
  '192.168.1.100'::inet
);
```

## Indexes

### Performance Indexes

Indexes are strategically placed to optimize common queries:

```sql
-- User lookups
CREATE INDEX idx_users_role ON users(role);

-- Activity log queries
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_resource_path ON activity_logs(resource_path);

-- JSONB metadata search
CREATE INDEX idx_activity_logs_metadata ON activity_logs USING GIN(metadata);

-- File metadata lookups
CREATE INDEX idx_file_metadata_file_type ON file_metadata(file_type);
CREATE INDEX idx_file_metadata_extension ON file_metadata(extension);

-- Session management
CREATE INDEX idx_admin_sessions_token_hash ON admin_sessions(token_hash);
CREATE INDEX idx_admin_sessions_user_id ON admin_sessions(user_id);
```

### Index Usage Examples

```sql
-- Fast user lookup by role
SELECT * FROM users WHERE role = 'admin';

-- Fast activity log queries
SELECT * FROM activity_logs 
WHERE user_id = '...' 
ORDER BY timestamp DESC 
LIMIT 50;

-- Fast metadata search
SELECT * FROM activity_logs 
WHERE metadata @> '{"fileSize": 1024000}'::jsonb;

-- Fast file type filtering
SELECT * FROM file_metadata 
WHERE file_type = 'application/pdf';
```

## Relationships

### One-to-Many Relationships

1. **users → activity_logs**
   - One user can have many activity logs
   - Foreign key: `activity_logs.user_id` → `users.id`
   - On delete: SET NULL (preserve logs even if user deleted)

2. **users → admin_sessions**
   - One user can have many active sessions
   - Foreign key: `admin_sessions.user_id` → `users.id`
   - On delete: CASCADE (delete sessions when user deleted)

### Relationship Diagram

```
users (1) ──────< (N) activity_logs
  │
  └──────< (N) admin_sessions
```

## Data Types

### UUID

All primary keys use UUID v4 for:
- Better distribution in indexes
- Security (non-sequential)
- Easier merging of databases
- Globally unique identifiers

```sql
-- Generate UUID
SELECT gen_random_uuid();

-- Example: 550e8400-e29b-41d4-a716-446655440000
```

### JSONB

Metadata stored as JSONB for:
- Flexible schema
- Efficient storage
- Indexable with GIN
- Query support

```sql
-- Query JSONB
SELECT * FROM activity_logs 
WHERE metadata->>'fileSize' = '1024000';

-- Index JSONB
CREATE INDEX ON activity_logs USING GIN(metadata);
```

### INET

IP addresses stored as INET for:
- Efficient storage (4 bytes for IPv4, 16 for IPv6)
- Built-in validation
- Network operations support

```sql
-- Store IP address
INSERT INTO activity_logs (ip_address) 
VALUES ('192.168.1.100'::inet);

-- Query by network
SELECT * FROM activity_logs 
WHERE ip_address << '192.168.1.0/24'::inet;
```

### TIMESTAMP

All timestamps use TIMESTAMP WITHOUT TIME ZONE:
- Stored in UTC
- Application handles timezone conversion
- Consistent across deployments

```sql
-- Current timestamp
SELECT NOW();

-- Date range query
SELECT * FROM activity_logs 
WHERE timestamp BETWEEN '2024-01-01' AND '2024-01-31';
```

## Migrations

### Migration System

Migrations are managed using node-pg-migrate:

```bash
# Create new migration
npm run migrate:create <migration-name>

# Run migrations
npm run migrate

# Rollback last migration
npm run migrate:down

# Check migration status
npm run migrate:status
```

### Migration Files

Located in `backend/migrations/`:

1. `1697500000001_create-users-table.js`
2. `1697500000002_create-activity-logs-table.js`
3. `1697500000003_create-file-metadata-table.js`
4. `1697500000004_create-admin-sessions-table.js`
5. `1761043621562_add-gdpr-consent-fields.js`

### Example Migration

```javascript
exports.up = (pgm) => {
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    username: {
      type: 'varchar(255)',
      notNull: true,
      unique: true
    },
    email: {
      type: 'varchar(255)',
      notNull: true,
      unique: true
    },
    password_hash: {
      type: 'varchar(255)',
      notNull: true
    },
    role: {
      type: 'varchar(50)',
      notNull: true,
      default: 'user'
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()')
    }
  });

  pgm.createIndex('users', 'role');
};

exports.down = (pgm) => {
  pgm.dropTable('users');
};
```

## Query Examples

### Common Queries

```sql
-- Get user with activity count
SELECT u.*, COUNT(a.id) as activity_count
FROM users u
LEFT JOIN activity_logs a ON u.id = a.user_id
GROUP BY u.id;

-- Get recent activities with user info
SELECT a.*, u.username, u.email
FROM activity_logs a
JOIN users u ON a.user_id = u.id
ORDER BY a.timestamp DESC
LIMIT 50;

-- Get activity statistics by action
SELECT action, COUNT(*) as count
FROM activity_logs
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY action
ORDER BY count DESC;

-- Get top users by activity
SELECT u.username, COUNT(a.id) as activity_count
FROM users u
JOIN activity_logs a ON u.id = a.user_id
WHERE a.timestamp >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.username
ORDER BY activity_count DESC
LIMIT 10;

-- Get file access frequency
SELECT resource_path, COUNT(*) as access_count
FROM activity_logs
WHERE resource_type = 'file'
AND timestamp >= NOW() - INTERVAL '7 days'
GROUP BY resource_path
ORDER BY access_count DESC
LIMIT 20;

-- Clean up expired sessions
DELETE FROM admin_sessions
WHERE expires_at < NOW();

-- Get user's recent activities with metadata
SELECT 
  a.action,
  a.resource_path,
  a.metadata->>'fileSize' as file_size,
  a.timestamp
FROM activity_logs a
WHERE a.user_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY a.timestamp DESC
LIMIT 20;
```

### Performance Optimization

```sql
-- Analyze table statistics
ANALYZE activity_logs;

-- Vacuum to reclaim space
VACUUM ANALYZE activity_logs;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Find slow queries
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Backup and Restore

### Backup

```bash
# Full backup
pg_dump -U labtech -d labtech_geolab > backup.sql

# Compressed backup
pg_dump -U labtech -d labtech_geolab | gzip > backup.sql.gz

# Schema only
pg_dump -U labtech -d labtech_geolab --schema-only > schema.sql

# Data only
pg_dump -U labtech -d labtech_geolab --data-only > data.sql
```

### Restore

```bash
# Restore from backup
psql -U labtech -d labtech_geolab < backup.sql

# Restore compressed backup
gunzip -c backup.sql.gz | psql -U labtech -d labtech_geolab

# Restore specific table
pg_restore -U labtech -d labtech_geolab -t activity_logs backup.dump
```

## Maintenance

### Regular Maintenance Tasks

```sql
-- Reindex all tables
REINDEX DATABASE labtech_geolab;

-- Update statistics
ANALYZE;

-- Vacuum full (requires downtime)
VACUUM FULL;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index sizes
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [node-pg-migrate](https://salsita.github.io/node-pg-migrate/)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
