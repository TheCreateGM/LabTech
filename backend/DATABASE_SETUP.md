# Database Setup Guide

This guide explains how to set up and use the database connection and migration system for the LabTech GeoLab backend.

## Prerequisites

- PostgreSQL 12 or later installed and running
- Node.js 18+ and npm installed
- Database credentials configured in `.env` file

## Environment Configuration

Copy `.env.example` to `.env` and configure your database connection:

```bash
cp .env.example .env
```

Update the `DATABASE_URL` in your `.env` file:

```
DATABASE_URL=postgresql://username:password@localhost:5432/labtech_geolab
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
```

## Database Connection

The database connection is managed by the `DatabaseConnection` class in `src/config/database.ts`. It provides:

- **Connection pooling** with configurable min/max connections
- **Automatic retry logic** with exponential backoff
- **Health check endpoint** for monitoring
- **Graceful shutdown** handling

### Features

- Min connections: 5 (configurable)
- Max connections: 20 (configurable)
- Idle timeout: 30 seconds
- Connection timeout: 10 seconds
- Max retry attempts: 5
- Initial retry delay: 5 seconds (exponential backoff)

## Running Migrations

### Install Dependencies

All required dependencies are already installed:
- `pg` - PostgreSQL client
- `node-pg-migrate` - Migration tool

### Create Database

First, create the database if it doesn't exist:

```bash
psql -U postgres
CREATE DATABASE labtech_geolab;
\q
```

### Run Migrations

Execute all pending migrations:

```bash
npm run migrate:up
```

This will create the following tables:
1. `users` - User accounts with authentication and MFA support
2. `activity_logs` - User activity tracking with JSONB metadata
3. `file_metadata` - File and folder metadata
4. `admin_sessions` - JWT token and session management

### Rollback Migrations

To rollback the last migration:

```bash
npm run migrate:down
```

### Create New Migration

To create a new migration file:

```bash
npm run migrate:create <migration-name>
```

Example:
```bash
npm run migrate:create add-user-preferences
```

## Database Schema

### Users Table

Stores user accounts with authentication credentials and role-based access control.

**Columns:**
- `id` (UUID) - Primary key
- `username` (VARCHAR) - Unique username
- `email` (VARCHAR) - Unique email address
- `password_hash` (VARCHAR) - Bcrypt hashed password
- `role` (VARCHAR) - User role: 'user', 'admin', or 'super_admin'
- `mfa_secret` (VARCHAR) - TOTP secret for MFA
- `mfa_enabled` (BOOLEAN) - MFA enabled flag
- `created_at` (TIMESTAMP) - Account creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp (auto-updated)
- `last_login` (TIMESTAMP) - Last login timestamp

**Indexes:**
- `username` (unique)
- `email` (unique)
- `role`

### Activity Logs Table

Tracks all user activities for auditing and monitoring.

**Columns:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users (nullable, SET NULL on delete)
- `action` (VARCHAR) - Action type: 'read', 'write', 'delete', 'open', 'download', etc.
- `resource_type` (VARCHAR) - Resource type: 'file', 'folder', 'page', 'api', etc.
- `resource_path` (TEXT) - Path to the resource
- `metadata` (JSONB) - Additional context data
- `ip_address` (INET) - Client IP address
- `user_agent` (TEXT) - Client user agent
- `timestamp` (TIMESTAMP) - Activity timestamp

**Indexes:**
- `user_id`
- `timestamp` (DESC)
- `action`
- `resource_type`
- `resource_path` (hash)
- `(user_id, timestamp)` (composite)
- `(action, timestamp)` (composite)
- `metadata` (GIN for JSONB queries)

### File Metadata Table

Stores metadata about files and folders in the application.

**Columns:**
- `id` (UUID) - Primary key
- `file_name` (VARCHAR) - File or folder name
- `relative_path` (TEXT) - Path relative to project root (unique)
- `absolute_path` (TEXT) - Absolute file system path
- `file_size` (BIGINT) - File size in bytes
- `file_type` (VARCHAR) - MIME type
- `extension` (VARCHAR) - File extension
- `checksum` (VARCHAR) - SHA-256 hash for integrity
- `is_directory` (BOOLEAN) - Directory flag
- `last_modified` (TIMESTAMP) - Last modification time
- `created_at` (TIMESTAMP) - Record creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp (auto-updated)

**Indexes:**
- `relative_path` (unique)
- `file_type`
- `extension`
- `is_directory`
- `last_modified` (DESC)
- `file_size`
- `(file_type, is_directory)` (composite)
- `file_name` (GIN trigram for full-text search)

### Admin Sessions Table

Manages JWT tokens and user sessions.

**Columns:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users (CASCADE on delete)
- `token_hash` (VARCHAR) - Hashed access token (unique)
- `refresh_token_hash` (VARCHAR) - Hashed refresh token
- `expires_at` (TIMESTAMP) - Token expiration time
- `created_at` (TIMESTAMP) - Session creation timestamp
- `ip_address` (INET) - Client IP address
- `user_agent` (TEXT) - Client user agent
- `is_revoked` (BOOLEAN) - Revocation flag
- `revoked_at` (TIMESTAMP) - Revocation timestamp
- `last_activity` (TIMESTAMP) - Last activity timestamp

**Indexes:**
- `token_hash` (unique)
- `refresh_token_hash`
- `user_id`
- `expires_at`
- `is_revoked`
- `(user_id, is_revoked, expires_at)` (composite)

## Repository Layer

The data access layer is implemented using the Repository pattern with the following classes:

### BaseRepository

Abstract base class providing common CRUD operations:
- `findById(id)` - Find record by ID
- `findAll(limit, offset)` - Find all records with pagination
- `count(whereClause, params)` - Count records
- `delete(id)` - Delete record by ID
- `exists(id)` - Check if record exists

### UserRepository

User-specific data access methods:
- `findByUsername(username)` - Find user by username
- `findByEmail(email)` - Find user by email
- `create(userData)` - Create new user
- `update(id, userData)` - Update user data
- `findByRole(role)` - Find users by role
- `usernameExists(username)` - Check username availability
- `emailExists(email)` - Check email availability
- `updateLastLogin(id)` - Update last login timestamp
- `countByRole(role)` - Count users by role

### ActivityLogRepository

Activity log data access methods:
- `create(logData)` - Create activity log entry
- `findAllWithFilters(filters, pagination)` - Find logs with filters and pagination
- `findByUserId(userId, pagination)` - Find logs by user
- `findByDateRange(startDate, endDate, pagination)` - Find logs by date range
- `findByAction(action, pagination)` - Find logs by action type
- `exportToCSV(filters)` - Export logs to CSV format
- `exportToJSON(filters)` - Export logs to JSON format
- `getStatistics(filters)` - Get activity statistics
- `batchCreate(logsData)` - Batch create multiple logs

### FileMetadataRepository

File metadata data access methods:
- `create(fileData)` - Create file metadata entry
- `update(id, fileData)` - Update file metadata
- `findByPath(relativePath)` - Find file by path
- `findAllFiles(options)` - Find files with filters
- `findByDirectory(directoryPath)` - Find files in directory
- `findByFileType(fileType)` - Find files by MIME type
- `findByExtension(extension)` - Find files by extension
- `findDirectories()` - Find all directories
- `findFiles()` - Find all files (not directories)
- `searchByName(pattern)` - Search files by name pattern
- `getTotalSize(isDirectory)` - Get total file size
- `countByType()` - Count files by type
- `countByExtension()` - Count files by extension
- `deleteByPath(relativePath)` - Delete by path
- `upsert(fileData)` - Insert or update file metadata
- `batchUpsert(filesData)` - Batch upsert multiple files

## Usage Examples

### Using the Database Connection

```typescript
import { db } from './config/database';

// Initialize connection
await db.connect();

// Execute a query
const users = await db.query('SELECT * FROM users WHERE role = $1', ['admin']);

// Get a client for transactions
const client = await db.getClient();
try {
  await client.query('BEGIN');
  // ... perform queries
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}

// Check database health
const health = await db.healthCheck();
console.log(health);

// Disconnect
await db.disconnect();
```

### Using Repositories

```typescript
import { userRepository, activityLogRepository, fileMetadataRepository } from './repositories';

// Create a user
const user = await userRepository.create({
  username: 'john_doe',
  email: 'john@example.com',
  password_hash: 'hashed_password',
  role: 'user',
});

// Find user by username
const foundUser = await userRepository.findByUsername('john_doe');

// Log an activity
const log = await activityLogRepository.create({
  user_id: user.id,
  action: 'read',
  resource_type: 'file',
  resource_path: '/src/app/app.component.ts',
  metadata: { duration: 1500 },
  ip_address: '192.168.1.1',
  user_agent: 'Mozilla/5.0...',
});

// Find activity logs with filters
const logs = await activityLogRepository.findAllWithFilters(
  {
    userId: user.id,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
  },
  { page: 1, limit: 50 }
);

// Create file metadata
const file = await fileMetadataRepository.create({
  file_name: 'app.component.ts',
  relative_path: 'src/app/app.component.ts',
  absolute_path: '/home/user/project/src/app/app.component.ts',
  file_size: 2048,
  file_type: 'text/typescript',
  extension: '.ts',
  is_directory: false,
  last_modified: new Date(),
});

// Search files by name
const files = await fileMetadataRepository.searchByName('component');
```

## Health Check

The application includes a health check endpoint that verifies database connectivity:

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development",
  "database": {
    "status": "healthy",
    "message": "Database connection is healthy",
    "details": {
      "timestamp": "2024-01-15T10:30:00.000Z",
      "version": "PostgreSQL 15.1...",
      "pool": {
        "totalCount": 5,
        "idleCount": 4,
        "waitingCount": 0
      }
    }
  }
}
```

## Troubleshooting

### Connection Refused

If you get a connection refused error:
1. Verify PostgreSQL is running: `sudo systemctl status postgresql`
2. Check the DATABASE_URL in your `.env` file
3. Ensure the database exists: `psql -U postgres -l`

### Migration Errors

If migrations fail:
1. Check the migration table: `SELECT * FROM pgmigrations;`
2. Manually rollback if needed: `npm run migrate:down`
3. Verify database permissions

### Pool Exhaustion

If you see "pool exhausted" errors:
1. Increase `DATABASE_POOL_MAX` in `.env`
2. Check for connection leaks (unreleased clients)
3. Monitor pool stats via health check endpoint

## Best Practices

1. **Always use prepared statements** - All repository methods use parameterized queries to prevent SQL injection
2. **Release clients** - Always release clients in a finally block when using transactions
3. **Use repositories** - Don't write raw SQL queries; use repository methods
4. **Handle errors** - Wrap database operations in try-catch blocks
5. **Monitor health** - Regularly check the health endpoint
6. **Backup regularly** - Set up automated database backups
7. **Use transactions** - For operations that modify multiple tables

## Next Steps

After setting up the database:
1. Implement authentication service (Task 3)
2. Create activity tracking service (Task 4)
3. Set up WebSocket server (Task 5)
4. Implement encryption features (Task 6)

## Support

For issues or questions, refer to:
- PostgreSQL documentation: https://www.postgresql.org/docs/
- node-pg-migrate documentation: https://salsita.github.io/node-pg-migrate/
- Project requirements: `.kiro/specs/user-tracking-system/requirements.md`
- Project design: `.kiro/specs/user-tracking-system/design.md`
