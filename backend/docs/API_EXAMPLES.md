# API Usage Examples

This document provides practical examples for common API use cases in TypeScript and cURL.

## Table of Contents

- [Authentication](#authentication)
- [Activity Tracking](#activity-tracking)
- [Multi-Factor Authentication](#multi-factor-authentication)
- [Admin Operations](#admin-operations)
- [GDPR Compliance](#gdpr-compliance)

## Authentication

### Register a New User

**TypeScript:**
```typescript
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

async function registerUser() {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      username: 'johndoe',
      email: 'john@example.com',
      password: 'SecurePass123!'
    });
    
    console.log('User registered:', response.data.user);
    console.log('Access token:', response.data.accessToken);
    
    // Store tokens securely
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error.response?.data);
    throw error;
  }
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### User Login

**TypeScript:**
```typescript
async function login(username: string, password: string) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      username,
      password
    });
    
    // Store tokens
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      console.error('Invalid credentials');
    } else if (error.response?.status === 429) {
      console.error('Too many login attempts, please try again later');
    }
    throw error;
  }
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "SecurePass123!"
  }'
```

### Refresh Access Token

**TypeScript:**
```typescript
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  try {
    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken
    });
    
    // Update access token
    localStorage.setItem('accessToken', response.data.accessToken);
    
    return response.data.accessToken;
  } catch (error) {
    // Refresh token expired, redirect to login
    console.error('Refresh token expired');
    localStorage.clear();
    window.location.href = '/login';
    throw error;
  }
}

// Axios interceptor for automatic token refresh
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token_here"
  }'
```

### Get Current User

**TypeScript:**
```typescript
async function getCurrentUser() {
  const token = localStorage.getItem('accessToken');
  
  try {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to get user:', error.response?.data);
    throw error;
  }
}
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer your_access_token_here"
```

### Logout

**TypeScript:**
```typescript
async function logout() {
  const token = localStorage.getItem('accessToken');
  
  try {
    await axios.post(`${API_URL}/auth/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // Redirect to login
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout failed:', error.response?.data);
  }
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer your_access_token_here"
```

## Activity Tracking

### Log a New Activity

**TypeScript:**
```typescript
interface ActivityData {
  action: 'read' | 'write' | 'delete' | 'open' | 'download';
  resourceType: 'file' | 'folder' | 'page';
  resourcePath: string;
  metadata?: Record<string, any>;
}

async function logActivity(activity: ActivityData) {
  const token = localStorage.getItem('accessToken');
  
  try {
    const response = await axios.post(`${API_URL}/activities`, activity, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to log activity:', error.response?.data);
    throw error;
  }
}

// Example: Track file access
await logActivity({
  action: 'read',
  resourceType: 'file',
  resourcePath: '/projects/sample.pdf',
  metadata: {
    fileSize: 1024000,
    duration: 5000
  }
});

// Example: Track page view
await logActivity({
  action: 'open',
  resourceType: 'page',
  resourcePath: '/admin/dashboard',
  metadata: {
    referrer: '/home'
  }
});
```

**cURL:**
```bash
# Track file access
curl -X POST http://localhost:3000/api/v1/activities \
  -H "Authorization: Bearer your_access_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "read",
    "resourceType": "file",
    "resourcePath": "/projects/sample.pdf",
    "metadata": {
      "fileSize": 1024000,
      "duration": 5000
    }
  }'
```

### Get Activity Logs with Filters

**TypeScript:**
```typescript
interface ActivityFilters {
  page?: number;
  limit?: number;
  userId?: string;
  startDate?: string;
  endDate?: string;
  action?: string;
  resourcePath?: string;
}

async function getActivities(filters: ActivityFilters = {}) {
  const token = localStorage.getItem('accessToken');
  
  // Build query string
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });
  
  try {
    const response = await axios.get(`${API_URL}/activities?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to get activities:', error.response?.data);
    throw error;
  }
}

// Example: Get recent activities
const recentActivities = await getActivities({
  page: 1,
  limit: 50
});

// Example: Get activities for specific user
const userActivities = await getActivities({
  userId: '550e8400-e29b-41d4-a716-446655440000',
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-01-31T23:59:59Z'
});

// Example: Get file read activities
const fileReads = await getActivities({
  action: 'read',
  resourcePath: '/projects/%'
});
```

**cURL:**
```bash
# Get recent activities
curl -X GET "http://localhost:3000/api/v1/activities?page=1&limit=50" \
  -H "Authorization: Bearer your_access_token_here"

# Get activities with filters
curl -X GET "http://localhost:3000/api/v1/activities?userId=550e8400-e29b-41d4-a716-446655440000&startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z" \
  -H "Authorization: Bearer your_access_token_here"
```

### Export Activity Logs

**TypeScript:**
```typescript
async function exportActivities(
  format: 'csv' | 'json',
  filters: {
    startDate?: string;
    endDate?: string;
    userId?: string;
  } = {}
) {
  const token = localStorage.getItem('accessToken');
  
  const params = new URLSearchParams({ format });
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  
  try {
    const response = await axios.get(`${API_URL}/activities/export?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: format === 'csv' ? 'blob' : 'json'
    });
    
    if (format === 'csv') {
      // Download CSV file
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activities_${Date.now()}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    }
    
    return response.data;
  } catch (error) {
    console.error('Export failed:', error.response?.data);
    throw error;
  }
}

// Example: Export as CSV
await exportActivities('csv', {
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-01-31T23:59:59Z'
});
```

**cURL:**
```bash
# Export as CSV
curl -X GET "http://localhost:3000/api/v1/activities/export?format=csv&startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z" \
  -H "Authorization: Bearer your_access_token_here" \
  -o activities.csv

# Export as JSON
curl -X GET "http://localhost:3000/api/v1/activities/export?format=json&startDate=2024-01-01T00:00:00Z" \
  -H "Authorization: Bearer your_access_token_here" \
  -o activities.json
```

### Get Activity Statistics

**TypeScript:**
```typescript
async function getActivityStats(startDate?: string, endDate?: string) {
  const token = localStorage.getItem('accessToken');
  
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  try {
    const response = await axios.get(`${API_URL}/activities/stats?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to get stats:', error.response?.data);
    throw error;
  }
}

// Example usage
const stats = await getActivityStats('2024-01-01T00:00:00Z', '2024-01-31T23:59:59Z');
console.log('Total activities:', stats.totalActivities);
console.log('Action breakdown:', stats.actionBreakdown);
console.log('Top users:', stats.topUsers);
```

**cURL:**
```bash
curl -X GET "http://localhost:3000/api/v1/activities/stats?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z" \
  -H "Authorization: Bearer your_access_token_here"
```

## Multi-Factor Authentication

### Setup MFA

**TypeScript:**
```typescript
async function setupMFA() {
  const token = localStorage.getItem('accessToken');
  
  try {
    const response = await axios.post(`${API_URL}/auth/mfa/setup`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const { secret, qrCode, backupCodes } = response.data;
    
    // Display QR code to user
    const img = document.createElement('img');
    img.src = qrCode;
    document.body.appendChild(img);
    
    // Store backup codes securely
    console.log('Backup codes:', backupCodes);
    
    return response.data;
  } catch (error) {
    console.error('MFA setup failed:', error.response?.data);
    throw error;
  }
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/mfa/setup \
  -H "Authorization: Bearer your_access_token_here"
```

### Verify MFA Token

**TypeScript:**
```typescript
async function verifyMFA(token: string) {
  const accessToken = localStorage.getItem('accessToken');
  
  try {
    const response = await axios.post(`${API_URL}/auth/mfa/verify`, 
      { token },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (response.data.verified) {
      console.log('MFA verified successfully');
    }
    
    return response.data;
  } catch (error) {
    console.error('MFA verification failed:', error.response?.data);
    throw error;
  }
}

// Example: Verify 6-digit code
await verifyMFA('123456');
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/mfa/verify \
  -H "Authorization: Bearer your_access_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "123456"
  }'
```

## Admin Operations

### Create Manual Backup

**TypeScript:**
```typescript
async function createBackup() {
  const token = localStorage.getItem('accessToken');
  
  try {
    const response = await axios.post(`${API_URL}/backup/create`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Backup initiated:', response.data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      console.error('Admin access required');
    }
    throw error;
  }
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/backup/create \
  -H "Authorization: Bearer your_admin_token_here"
```

### List Available Backups

**TypeScript:**
```typescript
async function listBackups() {
  const token = localStorage.getItem('accessToken');
  
  try {
    const response = await axios.get(`${API_URL}/backup/list`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data.backups;
  } catch (error) {
    console.error('Failed to list backups:', error.response?.data);
    throw error;
  }
}
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/v1/backup/list \
  -H "Authorization: Bearer your_admin_token_here"
```

## GDPR Compliance

### Export User Data

**TypeScript:**
```typescript
async function exportMyData() {
  const token = localStorage.getItem('accessToken');
  
  try {
    const response = await axios.post(`${API_URL}/gdpr/export`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Download data as JSON
    const dataStr = JSON.stringify(response.data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `my_data_${Date.now()}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    return response.data;
  } catch (error) {
    console.error('Data export failed:', error.response?.data);
    throw error;
  }
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/gdpr/export \
  -H "Authorization: Bearer your_access_token_here" \
  -o my_data.json
```

### Delete User Data

**TypeScript:**
```typescript
async function deleteMyData() {
  const token = localStorage.getItem('accessToken');
  
  // Confirm with user
  const confirmed = confirm(
    'Are you sure you want to delete all your data? This action cannot be undone.'
  );
  
  if (!confirmed) return;
  
  try {
    const response = await axios.delete(`${API_URL}/gdpr/delete`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        confirmation: 'DELETE'
      }
    });
    
    console.log('Data deleted:', response.data.message);
    
    // Clear local storage and redirect
    localStorage.clear();
    window.location.href = '/';
    
    return response.data;
  } catch (error) {
    console.error('Data deletion failed:', error.response?.data);
    throw error;
  }
}
```

**cURL:**
```bash
curl -X DELETE http://localhost:3000/api/v1/gdpr/delete \
  -H "Authorization: Bearer your_access_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "confirmation": "DELETE"
  }'
```

## WebSocket Real-Time Updates

### Connect to WebSocket Server

**TypeScript:**
```typescript
import io from 'socket.io-client';

class ActivityMonitor {
  private socket: any;
  
  connect() {
    const token = localStorage.getItem('accessToken');
    
    this.socket = io('http://localhost:3000', {
      auth: {
        token
      }
    });
    
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });
    
    this.socket.on('connection:authenticated', () => {
      console.log('WebSocket authenticated');
    });
    
    this.socket.on('activity:new', (activity: any) => {
      console.log('New activity:', activity);
      // Update UI with new activity
    });
    
    this.socket.on('activity:batch', (activities: any[]) => {
      console.log('Batch activities:', activities);
      // Update UI with batch activities
    });
    
    this.socket.on('stats:update', (stats: any) => {
      console.log('Stats updated:', stats);
      // Update statistics display
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });
    
    this.socket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
    });
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

// Usage
const monitor = new ActivityMonitor();
monitor.connect();
```

## Error Handling Best Practices

**TypeScript:**
```typescript
import axios, { AxiosError } from 'axios';

interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
}

function handleApiError(error: AxiosError<ApiError>) {
  if (!error.response) {
    console.error('Network error:', error.message);
    return;
  }
  
  const { status, data } = error.response;
  
  switch (status) {
    case 400:
      console.error('Validation error:', data.error.details);
      break;
    case 401:
      console.error('Authentication failed');
      // Redirect to login
      window.location.href = '/login';
      break;
    case 403:
      console.error('Access denied');
      break;
    case 404:
      console.error('Resource not found');
      break;
    case 429:
      console.error('Rate limit exceeded, please try again later');
      break;
    case 500:
      console.error('Server error:', data.error.message);
      break;
    default:
      console.error('Unexpected error:', data.error.message);
  }
  
  // Log request ID for support
  console.log('Request ID:', data.error.requestId);
}

// Usage
try {
  await logActivity({ /* ... */ });
} catch (error) {
  handleApiError(error as AxiosError<ApiError>);
}
```

## Rate Limiting Handling

**TypeScript:**
```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response?.status === 429 && i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  
  throw new Error('Max retries exceeded');
}

// Usage
const activities = await retryWithBackoff(() => 
  getActivities({ page: 1, limit: 50 })
);
```
