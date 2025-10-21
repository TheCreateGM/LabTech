# Activity Tracking Service

## Overview

The Activity Tracking Service provides comprehensive user activity tracking for the LabTech GeoLab application. It captures page views, file access, API calls, and custom user actions, storing them locally in IndexedDB for offline support and syncing them to the backend when connectivity is available.

## Features

- **Automatic Page View Tracking**: Tracks all route navigation events
- **HTTP Request Tracking**: Intercepts and logs all API calls with metadata
- **Offline Support**: Uses IndexedDB to queue activities when offline
- **Auto-Flush**: Automatically sends queued activities every 30 seconds
- **Batch Processing**: Flushes queue when it reaches 50 items
- **Retry Logic**: Retries failed submissions up to 3 times
- **Type Safety**: Full TypeScript support with defined interfaces

## Components

### 1. ActivityTrackingService (`activity-tracking.service.ts`)

Main service for tracking user activities.

**Key Methods:**

- `initializeTracking()`: Initialize the service and IndexedDB
- `trackPageView(route, metadata)`: Track page navigation
- `trackFileAccess(filePath, action)`: Track file operations
- `trackUserAction(action, details)`: Track custom actions
- `flushQueue()`: Manually flush queued activities
- `getQueueStats()`: Get queue size and oldest timestamp

**Usage Example:**

```typescript
import { ActivityTrackingService } from './services/activity-tracking.service';

// Inject the service
constructor(private trackingService: ActivityTrackingService) {}

// Initialize (done automatically in app.component.ts)
await this.trackingService.initializeTracking();

// Track a custom action
await this.trackingService.trackUserAction('button_click', {
  resourceType: 'page',
  resourcePath: '/home',
  buttonId: 'submit-btn',
  formData: { /* ... */ }
});

// Track file access
await this.trackingService.trackFileAccess('/data/results.csv', 'download');
```

### 2. Tracking Interceptor (`tracking.interceptor.ts`)

HTTP interceptor that automatically tracks all API calls.

**Features:**

- Captures request URL, method, duration, and status code
- Excludes tracking API calls to prevent infinite loops
- Tracks both successful and failed requests
- Non-blocking (doesn't affect application performance)

**Automatic Registration:**

The interceptor is automatically registered in `main.ts` and requires no additional configuration.

### 3. Router Integration (`app.component.ts`)

Automatic page view tracking integrated with Angular Router.

**Features:**

- Tracks all navigation events
- Captures route parameters and query parameters
- Includes navigation metadata (previous URL, navigation ID)
- Initializes tracking service on app startup

## Data Models

### ActivityEvent

```typescript
interface ActivityEvent {
  userId?: string;
  action: string;
  resourceType: 'file' | 'folder' | 'page';
  resourcePath: string;
  metadata?: Record<string, any>;
  timestamp: string; // ISO 8601 format
}
```

### AccessAction

```typescript
type AccessAction = 'read' | 'write' | 'delete' | 'open' | 'download';
```

## Configuration

### Environment Variables

Update `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1'
};
```

### Queue Settings

Default settings in `ActivityTrackingService`:

- **MAX_QUEUE_SIZE**: 50 items (triggers auto-flush)
- **FLUSH_INTERVAL**: 30 seconds
- **MAX_RETRY_COUNT**: 3 attempts

## IndexedDB Schema

**Database Name**: `ActivityTrackingDB`
**Version**: 1
**Object Store**: `activityQueue`

**Indexes:**
- `timestamp`: For chronological ordering
- `retryCount`: For retry management

## Backend API Integration

The service sends activities to:

```
POST /api/v1/activities
```

**Request Body:**

```json
{
  "userId": "optional-user-id",
  "action": "page_view",
  "resourceType": "page",
  "resourcePath": "/home",
  "metadata": {
    "userAgent": "...",
    "screenWidth": 1920,
    "screenHeight": 1080
  },
  "timestamp": "2025-01-21T10:30:00.000Z"
}
```

## Error Handling

- All tracking operations fail silently to prevent disrupting the application
- Errors are logged to console for debugging
- Failed activities are retried up to 3 times
- Activities exceeding max retries are removed from queue

## Testing

### Manual Testing

```typescript
// Get queue statistics
const stats = await trackingService.getQueueStats();
console.log('Queue size:', stats.size);
console.log('Oldest activity:', stats.oldestTimestamp);

// Manually flush queue
await trackingService.flushQueue();

// Clear queue (for testing)
await trackingService.clearQueue();
```

### Debugging

Enable verbose logging by checking browser console for:
- "Activity tracking initialized successfully"
- "Flushing X queued activities..."
- "Queue flush completed"

## Performance Considerations

- Activities are queued asynchronously (non-blocking)
- IndexedDB operations are optimized for performance
- Auto-flush prevents queue from growing too large
- HTTP interceptor adds minimal overhead (~1-2ms per request)

## Security

- User IDs should be encrypted before sending to backend
- Sensitive data in metadata should be sanitized
- API endpoint should require authentication
- HTTPS should be used in production

## Future Enhancements

- User authentication integration
- Configurable flush intervals
- Activity filtering/sampling
- Compression for large payloads
- WebSocket support for real-time streaming
