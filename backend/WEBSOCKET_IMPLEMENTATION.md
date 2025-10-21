# WebSocket Implementation Guide

## Overview

The LabTech GeoLab backend now includes a real-time WebSocket server using Socket.IO for live activity updates to admin dashboards.

## Features

- **Real-time Activity Updates**: Admins receive instant notifications when users perform actions
- **Batch Updates**: Activities are batched and sent every 10 seconds for efficiency
- **Event Throttling**: Maximum 10 events per second per client to prevent overwhelming
- **JWT Authentication**: Secure WebSocket connections using JWT tokens
- **Admin-Only Room**: Only authenticated admin users can receive activity updates
- **Error Resilience**: WebSocket failures don't affect activity logging

## Architecture

```
Client (Admin Dashboard)
    ↓ (WebSocket Connection)
Socket.IO Server
    ↓ (Event Emission)
ActivityTrackingService
    ↓ (Queue Processing)
Database
```

## WebSocket Events

### Client → Server

#### `authenticate`
Authenticate the WebSocket connection using a JWT token.

**Payload:**
```typescript
string // JWT access token
```

**Response Events:**
- `connection:authenticated` - Authentication successful
- `authentication:error` - Authentication failed

### Server → Client

#### `connection:authenticated`
Emitted when authentication is successful.

**Payload:**
```typescript
{
  userId: string;
  username: string;
  role: string;
}
```

#### `authentication:error`
Emitted when authentication fails.

**Payload:**
```typescript
{
  message: string;
}
```

#### `activity:new`
Emitted when a new activity is logged (throttled to max 10/second per client).

**Payload:**
```typescript
{
  id: string;
  userId: string | null;
  username?: string;
  action: string;
  resourceType: string;
  resourcePath: string;
  metadata?: Record<string, any>;
  timestamp: string; // ISO 8601
  ipAddress?: string;
  userAgent?: string;
}
```

#### `activity:batch`
Emitted every 10 seconds with a batch of recent activities.

**Payload:**
```typescript
{
  activities: ActivityEvent[];
  count: number;
  timestamp: string; // ISO 8601
}
```

#### `stats:update`
Emitted when activity statistics are updated.

**Payload:**
```typescript
{
  totalActivities: number;
  actionsBreakdown: Record<string, number>;
  topUsers: Array<{ userId: string; username: string; count: number }>;
  topFiles: Array<{ path: string; count: number }>;
  timestamp: string; // ISO 8601
}
```

## Client Implementation Example

### JavaScript/TypeScript

```typescript
import { io, Socket } from 'socket.io-client';

// Connect to WebSocket server
const socket: Socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling'],
  autoConnect: false,
});

// Authenticate with JWT token
function authenticate(token: string) {
  socket.connect();
  
  socket.on('connect', () => {
    console.log('Connected to WebSocket server');
    socket.emit('authenticate', token);
  });
  
  socket.on('connection:authenticated', (data) => {
    console.log('Authenticated as:', data.username);
  });
  
  socket.on('authentication:error', (error) => {
    console.error('Authentication failed:', error.message);
    socket.disconnect();
  });
}

// Listen for new activities
socket.on('activity:new', (activity) => {
  console.log('New activity:', activity);
  // Update UI with new activity
});

// Listen for batch activities
socket.on('activity:batch', (batch) => {
  console.log(`Received ${batch.count} activities`);
  // Update UI with batch activities
});

// Listen for stats updates
socket.on('stats:update', (stats) => {
  console.log('Stats updated:', stats);
  // Update dashboard statistics
});

// Handle disconnection
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

// Authenticate with your JWT token
const jwtToken = 'your-jwt-access-token';
authenticate(jwtToken);
```

### Angular Service Example

```typescript
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../environments/environment';

export interface ActivityEvent {
  id: string;
  userId: string | null;
  username?: string;
  action: string;
  resourceType: string;
  resourcePath: string;
  metadata?: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private activitySubject = new Subject<ActivityEvent>();
  private batchSubject = new Subject<ActivityEvent[]>();
  private statsSubject = new Subject<any>();
  
  public activity$ = this.activitySubject.asObservable();
  public batch$ = this.batchSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();
  
  connect(token: string): void {
    this.socket = io(environment.apiUrl, {
      transports: ['websocket', 'polling'],
    });
    
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.socket!.emit('authenticate', token);
    });
    
    this.socket.on('connection:authenticated', (data) => {
      console.log('WebSocket authenticated:', data);
    });
    
    this.socket.on('activity:new', (activity: ActivityEvent) => {
      this.activitySubject.next(activity);
    });
    
    this.socket.on('activity:batch', (batch: { activities: ActivityEvent[] }) => {
      this.batchSubject.next(batch.activities);
    });
    
    this.socket.on('stats:update', (stats: any) => {
      this.statsSubject.next(stats);
    });
    
    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });
  }
  
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
```

## Configuration

### Environment Variables

The WebSocket server uses the same CORS configuration as the REST API:

```env
CORS_ORIGIN=http://localhost:8100,http://localhost:4200
```

### Server Configuration

The WebSocket server is automatically initialized when the Express server starts. No additional configuration is required.

## Security

### Authentication

- All WebSocket connections must authenticate within 10 seconds or they will be disconnected
- Authentication uses the same JWT tokens as the REST API
- Only users with `admin` or `super_admin` roles can join the admin room

### Authorization

- Only authenticated admin users receive activity updates
- Regular users cannot access the admin room or receive activity events

### Rate Limiting

- Event throttling prevents overwhelming clients (max 10 events/second per client)
- Batch updates are sent every 10 seconds regardless of activity volume

## Monitoring

### Connection Statistics

Get the number of connected clients:

```typescript
import { webSocketService } from './services/WebSocketService';

const totalClients = webSocketService.getConnectedClientsCount();
const adminClients = webSocketService.getConnectedAdminsCount();

console.log(`Total clients: ${totalClients}`);
console.log(`Admin clients: ${adminClients}`);
```

## Error Handling

The WebSocket service is designed to be resilient:

- WebSocket failures don't affect activity logging
- Failed event emissions are logged but don't throw errors
- Automatic reconnection is handled by the Socket.IO client
- Connection timeouts are handled gracefully

## Testing

### Manual Testing with Socket.IO Client

```bash
npm install -g socket.io-client-cli

# Connect to server
socket-io-client http://localhost:3000

# Authenticate
> emit authenticate "your-jwt-token"

# Listen for events
> on activity:new
> on activity:batch
> on stats:update
```

### Integration Testing

```typescript
import { io, Socket } from 'socket.io-client';

describe('WebSocket Server', () => {
  let socket: Socket;
  const token = 'valid-admin-jwt-token';
  
  beforeAll((done) => {
    socket = io('http://localhost:3000');
    socket.on('connect', () => {
      socket.emit('authenticate', token);
      socket.on('connection:authenticated', () => {
        done();
      });
    });
  });
  
  afterAll(() => {
    socket.disconnect();
  });
  
  it('should receive new activity events', (done) => {
    socket.on('activity:new', (activity) => {
      expect(activity).toHaveProperty('id');
      expect(activity).toHaveProperty('action');
      done();
    });
    
    // Trigger an activity in your test
  });
});
```

## Troubleshooting

### Connection Issues

**Problem**: Client cannot connect to WebSocket server

**Solutions**:
- Verify the server is running: `curl http://localhost:3000/health`
- Check CORS configuration in `.env` file
- Ensure firewall allows WebSocket connections
- Try using polling transport: `{ transports: ['polling'] }`

### Authentication Issues

**Problem**: Authentication fails or times out

**Solutions**:
- Verify JWT token is valid and not expired
- Check that the token includes the required claims (userId, username, role)
- Ensure RSA keys are properly loaded in `backend/keys/`
- Check server logs for authentication errors

### No Events Received

**Problem**: Connected but not receiving activity events

**Solutions**:
- Verify user has admin role
- Check that activities are being logged in the database
- Monitor server logs for event emission errors
- Verify client is listening to the correct event names

## Performance Considerations

- **Event Throttling**: Prevents overwhelming clients with too many events
- **Batch Updates**: Reduces network overhead by grouping activities
- **Connection Pooling**: Socket.IO handles connection pooling automatically
- **Memory Management**: Old throttle entries are cleaned up automatically

## Future Enhancements

Potential improvements for future versions:

1. **Room-based Filtering**: Allow admins to subscribe to specific activity types
2. **Historical Playback**: Replay past activities for debugging
3. **Custom Event Filters**: Let clients specify which events they want to receive
4. **Compression**: Enable WebSocket compression for large payloads
5. **Clustering**: Support multiple server instances with Redis adapter

## Related Documentation

- [Activity Tracking Implementation](./ACTIVITY_TRACKING_IMPLEMENTATION.md)
- [Authentication Guide](./AUTHENTICATION.md)
- [API Documentation](./README.md)
