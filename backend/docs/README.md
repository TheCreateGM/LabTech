# API Documentation

Complete API documentation for the LabTech GeoLab User Tracking System.

## Documentation Resources

### Interactive API Documentation (Swagger UI)

Access the interactive API documentation at:
```
http://localhost:3000/api-docs
```

The Swagger UI provides:
- Interactive API testing
- Request/response examples
- Schema definitions
- Authentication testing
- Try-it-out functionality

### OpenAPI Specification

The complete OpenAPI 3.0 specification is available in multiple formats:

- **YAML**: [openapi.yaml](./openapi.yaml)
- **JSON**: `http://localhost:3000/api-docs/openapi.json`

### Code Examples

Practical code examples for common use cases:
- [API Examples](./API_EXAMPLES.md) - TypeScript and cURL examples

## Quick Start

### 1. Start the API Server

```bash
cd backend
npm install
npm run dev
```

The API will be available at `http://localhost:3000/api/v1`

### 2. Access Documentation

Open your browser and navigate to:
```
http://localhost:3000/api-docs
```

### 3. Authenticate

Most endpoints require authentication. To test authenticated endpoints:

1. Use the `/auth/register` or `/auth/login` endpoint to get a JWT token
2. Click the "Authorize" button in Swagger UI
3. Enter your token in the format: `Bearer <your_token>`
4. Click "Authorize" to save

Now you can test all authenticated endpoints.

## API Overview

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Rate Limiting

- Standard endpoints: 100 requests per minute per IP
- Authentication endpoints: 10 requests per minute per IP

### Response Format

All responses follow a consistent format:

**Success Response:**
```json
{
  "data": { ... },
  "pagination": { ... }  // For paginated endpoints
}
```

**Error Response:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

## Endpoint Categories

### Authentication (`/auth`)

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### Multi-Factor Authentication (`/auth/mfa`)

- `POST /auth/mfa/setup` - Setup MFA
- `POST /auth/mfa/verify` - Verify MFA token

### Activities (`/activities`)

- `GET /activities` - Get activity logs (paginated)
- `POST /activities` - Log new activity
- `GET /activities/:id` - Get specific activity
- `GET /activities/export` - Export logs (CSV/JSON)
- `GET /activities/stats` - Get activity statistics

### GDPR (`/gdpr`)

- `POST /gdpr/export` - Export user data
- `DELETE /gdpr/delete` - Delete user data

### Backup (`/backup`)

- `POST /backup/create` - Create manual backup (admin)
- `GET /backup/list` - List available backups (admin)

### Monitoring (`/metrics`)

- `GET /metrics` - Prometheus metrics

## Common Use Cases

### 1. User Registration and Login

```typescript
// Register
const response = await fetch('http://localhost:3000/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    email: 'john@example.com',
    password: 'SecurePass123!'
  })
});

const { accessToken, refreshToken } = await response.json();
```

### 2. Track User Activity

```typescript
await fetch('http://localhost:3000/api/v1/activities', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'read',
    resourceType: 'file',
    resourcePath: '/projects/sample.pdf',
    metadata: { fileSize: 1024000 }
  })
});
```

### 3. Get Activity Logs with Filters

```typescript
const params = new URLSearchParams({
  page: '1',
  limit: '50',
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-01-31T23:59:59Z',
  action: 'read'
});

const response = await fetch(
  `http://localhost:3000/api/v1/activities?${params}`,
  {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  }
);

const { data, pagination } = await response.json();
```

### 4. Export Activity Data

```typescript
const response = await fetch(
  'http://localhost:3000/api/v1/activities/export?format=csv&startDate=2024-01-01T00:00:00Z',
  {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  }
);

const blob = await response.blob();
// Download the file
```

## Error Handling

### HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `202 Accepted` - Request accepted for processing
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource doesn't exist
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Unexpected server error
- `503 Service Unavailable` - Database connection failed

### Error Codes

| Code | Description |
|------|-------------|
| `INVALID_INPUT` | Request validation failed |
| `UNAUTHORIZED` | Invalid or expired token |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |
| `DATABASE_ERROR` | Database connection failed |

## Security

### Authentication Flow

1. User registers or logs in
2. Server returns access token (15-min expiry) and refresh token (7-day expiry)
3. Client includes access token in Authorization header
4. When access token expires, use refresh token to get new access token
5. When refresh token expires, user must log in again

### Best Practices

1. **Store tokens securely**: Use secure storage (not localStorage for sensitive apps)
2. **Use HTTPS**: Always use HTTPS in production
3. **Implement token refresh**: Automatically refresh tokens before expiry
4. **Handle 401 errors**: Redirect to login when authentication fails
5. **Rate limiting**: Implement client-side rate limiting to avoid 429 errors
6. **Validate input**: Always validate and sanitize user input
7. **Use MFA**: Enable multi-factor authentication for admin accounts

## Testing

### Using Swagger UI

1. Navigate to `http://localhost:3000/api-docs`
2. Click "Authorize" and enter your JWT token
3. Expand any endpoint
4. Click "Try it out"
5. Fill in parameters
6. Click "Execute"
7. View the response

### Using cURL

See [API_EXAMPLES.md](./API_EXAMPLES.md) for detailed cURL examples.

### Using Postman

1. Import the OpenAPI spec: `http://localhost:3000/api-docs/openapi.json`
2. Set up environment variables for tokens
3. Use the collection to test endpoints

## WebSocket API

### Connection

```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: accessToken }
});
```

### Events

**Client → Server:**
- `authenticate` - Authenticate connection with JWT

**Server → Client:**
- `connection:authenticated` - Authentication successful
- `activity:new` - New activity logged
- `activity:batch` - Batch of activities
- `stats:update` - Statistics updated
- `error` - Error occurred

### Example

```typescript
socket.on('connect', () => {
  console.log('Connected');
});

socket.on('activity:new', (activity) => {
  console.log('New activity:', activity);
});

socket.on('stats:update', (stats) => {
  console.log('Stats updated:', stats);
});
```

## Pagination

Paginated endpoints return data in the following format:

```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1000,
    "totalPages": 20
  }
}
```

### Query Parameters

- `page` - Page number (1-indexed)
- `limit` - Items per page (max 100)

### Example

```
GET /api/v1/activities?page=2&limit=50
```

## Filtering

Many endpoints support filtering via query parameters:

### Date Filtering

```
?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z
```

### Field Filtering

```
?userId=550e8400-e29b-41d4-a716-446655440000&action=read
```

### Wildcard Filtering

```
?resourcePath=/projects/%
```

## Exporting Data

### CSV Export

```
GET /api/v1/activities/export?format=csv&startDate=2024-01-01T00:00:00Z
```

Returns a CSV file with headers:
```
id,userId,username,action,resourceType,resourcePath,timestamp,ipAddress
```

### JSON Export

```
GET /api/v1/activities/export?format=json&startDate=2024-01-01T00:00:00Z
```

Returns an array of activity objects.

## Monitoring

### Prometheus Metrics

Access metrics at:
```
GET /api/v1/metrics
```

Available metrics:
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration
- `http_requests_errors_total` - Total errors
- `db_connections_active` - Active database connections
- `activities_logged_total` - Total activities logged

## Support

For issues or questions:
- GitHub Issues: [github.com/labtech-geolab/issues](https://github.com/labtech-geolab/issues)
- Email: support@labtech-geolab.com
- Documentation: [docs.labtech-geolab.com](https://docs.labtech-geolab.com)

## Changelog

### Version 1.0.0 (2024-01-15)

- Initial API release
- Authentication endpoints
- Activity tracking endpoints
- MFA support
- GDPR compliance endpoints
- Backup management
- WebSocket real-time updates
- Prometheus metrics
