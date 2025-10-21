# Activity Tracking Backend Services Implementation

## Overview

This document describes the implementation of Task 4: "Build activity tracking backend services" from the user tracking system specification.

## Implemented Components

### 1. Activity Tracking Service (Task 4.1)

**File**: `backend/src/services/ActivityTrackingService.ts`

**Features**:
- Async queue processing using Bull (Redis-backed job queue)
- Batch processing of up to 100 activities per batch
- Automatic batch flushing every 5 seconds
- Retry logic with exponential backoff (3 attempts)
- Dead letter queue for permanently failed logs
- Queue statistics and monitoring
- Immediate logging option for critical activities

**Key Methods**:
- `logActivity()` - Queue activity for batch processing
- `logActivityImmediate()` - Log activity immediately with high priority
- `getQueueStats()` - Get queue statistics
- `retryDeadLetterQueue()` - Retry failed jobs
- `flush()` - Flush pending batch immediately

**Dependencies Added**:
- `bull` - Job queue library
- `@types/bull` - TypeScript definitions

### 2. File Metadata Scanning Service (Task 4.2)

**File**: `backend/src/services/FileMetadataService.ts`

**Features**:
- Recursive directory scanning
- File metadata extraction (name, path, size, type, extension, checksum)
- SHA-256 checksum calculation
- Real-time file system watching using chokidar
- Automatic database updates within 5 seconds of file changes
- Configurable exclude patterns (node_modules, .git, etc.)
- Support for files up to 100MB

**Key Methods**:
- `scanDirectory()` - Recursively scan directory
- `getFileMetadata()` - Get metadata for specific file
- `watchFileSystem()` - Start real-time file watching
- `performInitialScan()` - Scan and store in database
- `stopWatching()` - Stop file system watcher

**Dependencies Added**:
- `chokidar` - File system watcher
- `mime-types` - MIME type detection
- `@types/mime-types` - TypeScript definitions

### 3. Activity Tracking Controller & API Endpoints (Task 4.3)

**File**: `backend/src/controllers/ActivityController.ts`

**Endpoints Implemented**:

1. **POST /api/v1/activities** - Log new activity
   - Authentication: Required
   - Validation: action, resourceType, resourcePath
   - Returns: 202 Accepted

2. **GET /api/v1/activities** - Get paginated activity logs
   - Authentication: Required
   - Query params: page, limit, userId, startDate, endDate, action, resourcePath
   - Returns: Paginated results with metadata

3. **GET /api/v1/activities/:id** - Get specific activity by ID
   - Authentication: Required
   - Validation: UUID format
   - Returns: Single activity or 404

4. **GET /api/v1/activities/export** - Export logs as CSV or JSON
   - Authentication: Required (Admin only)
   - Query params: format (csv/json), filters
   - Returns: File download with streaming

5. **GET /api/v1/activities/stats** - Get activity statistics
   - Authentication: Required
   - Returns: Total count, action breakdown, top users, top files

6. **GET /api/v1/activities/queue/stats** - Get queue statistics
   - Authentication: Required (Admin only)
   - Returns: Queue metrics (waiting, active, failed, etc.)

**Validation**:
- Input validation using express-validator
- Sanitization of user inputs
- Type checking and format validation

**File**: `backend/src/routes/activity.routes.ts`

**Route Configuration**:
- All routes require authentication
- Export and queue stats require admin role
- Proper middleware ordering

## Configuration Updates

### Redis Configuration

**File**: `backend/src/config/index.ts`

Added Redis configuration:
```typescript
redis: {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || '',
  db: parseInt(process.env.REDIS_DB || '0', 10),
}
```

### Environment Variables

Required environment variables:
- `REDIS_HOST` - Redis server host (default: localhost)
- `REDIS_PORT` - Redis server port (default: 6379)
- `REDIS_PASSWORD` - Redis password (optional)
- `REDIS_DB` - Redis database number (default: 0)
- `FILE_SCAN_PATH` - Path to scan for files (default: ../src)
- `FILE_WATCH_ENABLED` - Enable file watching (default: false)

## Integration

### Main Application

**File**: `backend/src/index.ts`

Added activity routes mounting:
```typescript
import('./routes/activity.routes').then((activityRoutes) => {
  this.app.use('/api/v1/activities', activityRoutes.default);
});
```

### Service Exports

**File**: `backend/src/services/index.ts`

Exported new services:
- `ActivityTrackingService`
- `FileMetadataService`

### Controller Exports

**File**: `backend/src/controllers/index.ts`

Exported new controller:
- `ActivityController`

## Requirements Fulfilled

### Task 4.1 Requirements
✅ ActivityTrackingService with logActivity method
✅ Async queue using Bull
✅ Batch insert for up to 100 activities
✅ Retry logic with exponential backoff
✅ Dead letter queue for failed logs

### Task 4.2 Requirements
✅ FileMetadataService with scanDirectory, getFileMetadata, watchFileSystem
✅ Node.js fs module for recursive scanning
✅ Metadata extraction (name, path, size, type, extension, checksum)
✅ File system watcher using chokidar
✅ Database updates within 5 seconds

### Task 4.3 Requirements
✅ POST /api/v1/activities endpoint
✅ GET /api/v1/activities with pagination and filters
✅ GET /api/v1/activities/:id endpoint
✅ GET /api/v1/activities/export with CSV/JSON streaming
✅ GET /api/v1/activities/stats endpoint
✅ Input validation and sanitization

## Testing Recommendations

### Unit Tests
- ActivityTrackingService: Queue operations, batch processing, retry logic
- FileMetadataService: Directory scanning, metadata extraction, file watching
- ActivityController: Request validation, response formatting

### Integration Tests
- End-to-end activity logging flow
- File system watching and database updates
- Export functionality with large datasets
- Queue processing under load

### Performance Tests
- Batch processing with 100+ activities
- Concurrent activity logging (1000+ users)
- File scanning with large directories
- Export with 10,000+ records

## Next Steps

To use these services:

1. **Start Redis server**:
   ```bash
   redis-server
   ```

2. **Update .env file**:
   ```
   REDIS_HOST=localhost
   REDIS_PORT=6379
   FILE_SCAN_PATH=../src
   FILE_WATCH_ENABLED=true
   ```

3. **Initialize services** (optional, in application startup):
   ```typescript
   import { fileMetadataService } from './services/FileMetadataService';
   
   // Perform initial scan
   await fileMetadataService.performInitialScan();
   
   // Start watching
   fileMetadataService.watchFileSystem();
   ```

4. **Use activity tracking**:
   ```typescript
   import { activityTrackingService } from './services/ActivityTrackingService';
   
   await activityTrackingService.logActivity(
     userId,
     'read',
     'file',
     '/path/to/file.txt',
     { additionalInfo: 'value' },
     ipAddress,
     userAgent
   );
   ```

## Dependencies

All required dependencies have been installed:
- bull@^4.x
- @types/bull@^4.x
- chokidar@^3.x
- mime-types@^2.x
- @types/mime-types@^2.x

## Notes

- The activity tracking service uses Redis for queue management. Ensure Redis is running before starting the application.
- File system watching is disabled by default. Enable it by setting `FILE_WATCH_ENABLED=true` in the environment.
- The batch processing interval is set to 5 seconds. This can be adjusted in the service configuration.
- Large files (>100MB) are skipped during scanning to prevent memory issues.
- All endpoints require authentication. Admin-only endpoints are protected with the `requireAdmin` middleware.

