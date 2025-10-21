# Monitoring and Logging Guide

This document describes the monitoring and logging infrastructure for the LabTech GeoLab backend.

## Table of Contents

- [Structured Logging](#structured-logging)
- [Application Monitoring](#application-monitoring)
- [Error Tracking](#error-tracking)
- [Alerts Configuration](#alerts-configuration)
- [Grafana Dashboards](#grafana-dashboards)

## Structured Logging

### Overview

The application uses **Winston** for structured logging with the following features:

- **Log Levels**: DEBUG, INFO, WARN, ERROR
- **Request ID Tracking**: Every request gets a unique ID for tracing
- **Log Rotation**: Daily rotation with 30-day retention
- **Multiple Transports**: Console (development) and files (production)

### Log Files

In production, logs are written to the `logs/` directory:

- `combined-YYYY-MM-DD.log` - All logs (INFO and above)
- `error-YYYY-MM-DD.log` - Error logs only
- `debug-YYYY-MM-DD.log` - Debug logs (7-day retention)

### Usage in Code

```typescript
import logger from './utils/logger';

// Basic logging
logger.info('User logged in', { userId: '123', username: 'john' });
logger.error('Database connection failed', { error: err.message });

// Request-specific logging (with request ID)
import { RequestWithLogger } from './middleware/requestLogger.middleware';

app.get('/api/endpoint', (req: RequestWithLogger, res) => {
  req.logger.info('Processing request', { data: req.body });
});
```

### Log Format

```json
{
  "timestamp": "2025-10-21 20:00:00",
  "level": "info",
  "message": "User logged in",
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "userId": "123",
  "username": "john"
}
```

## Application Monitoring

### Prometheus Metrics

The application exposes metrics at `/metrics` endpoint for Prometheus scraping.

#### Available Metrics

**HTTP Metrics:**
- `labtech_http_requests_total` - Total HTTP requests (by method, route, status)
- `labtech_http_request_duration_seconds` - Request duration histogram
- `labtech_http_errors_total` - Total HTTP errors (by type, status)
- `labtech_active_connections` - Current active HTTP connections

**Database Metrics:**
- `labtech_database_queries_total` - Total database queries (by operation, table)
- `labtech_database_query_duration_seconds` - Query duration histogram
- `labtech_database_connection_pool` - Connection pool status

**Application Metrics:**
- `labtech_activity_logs_total` - Total activity logs created
- `labtech_auth_attempts_total` - Authentication attempts (by result, method)
- `labtech_websocket_connections` - Active WebSocket connections

**System Metrics:**
- `labtech_process_cpu_seconds_total` - CPU usage
- `labtech_process_resident_memory_bytes` - Memory usage
- `labtech_nodejs_heap_size_total_bytes` - Node.js heap size

### Prometheus Configuration

1. **Install Prometheus:**

```bash
# Using Docker
docker run -d -p 9090:9090 \
  -v $(pwd)/monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

2. **Configure Scraping:**

Edit `monitoring/prometheus/prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'labtech-backend'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s
```

3. **Access Prometheus UI:**

Open http://localhost:9090

### Query Examples

```promql
# Request rate (requests per second)
rate(labtech_http_requests_total[5m])

# 95th percentile response time
histogram_quantile(0.95, rate(labtech_http_request_duration_seconds_bucket[5m]))

# Error rate percentage
(sum(rate(labtech_http_errors_total[5m])) / sum(rate(labtech_http_requests_total[5m]))) * 100

# Database query rate
rate(labtech_database_queries_total[5m])

# Active connections
labtech_active_connections
```

## Error Tracking

### Sentry Integration

The application uses **Sentry** for error tracking and performance monitoring.

#### Setup

1. **Create Sentry Project:**
   - Go to https://sentry.io
   - Create a new project (Node.js)
   - Copy the DSN

2. **Configure Environment:**

```bash
# .env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_RELEASE=labtech-geolab@1.0.0
```

3. **Verify Integration:**

The application automatically captures:
- Unhandled exceptions
- Unhandled promise rejections
- HTTP errors (4xx, 5xx)
- Database errors

#### Usage in Code

```typescript
import { captureException, captureMessage, addBreadcrumb } from './utils/sentry';

// Capture exception with context
try {
  // ... code
} catch (error) {
  captureException(error, {
    userId: user.id,
    requestId: req.requestId,
    extra: { additionalData: 'value' }
  });
}

// Capture message
captureMessage('Important event occurred', 'warning', {
  userId: user.id,
  extra: { eventData: data }
});

// Add breadcrumb for debugging
addBreadcrumb('User clicked button', 'user-action', 'info', {
  buttonId: 'submit',
  formData: data
});
```

#### Features

- **Error Grouping**: Similar errors are grouped together
- **Source Maps**: Stack traces show original TypeScript code
- **User Context**: Errors include user ID, email, username
- **Request Context**: Errors include request ID, URL, method
- **Performance Monitoring**: Track slow transactions
- **Release Tracking**: Track errors by release version

## Alerts Configuration

### Alert Rules

Alerts are defined in `monitoring/prometheus/alerts.yml`:

#### Critical Alerts

1. **High Error Rate** (>5% for 5 minutes)
   - Triggers when error rate exceeds threshold
   - Indicates application issues

2. **Database Connection Failure** (no active connections for 2 minutes)
   - Triggers when database is unreachable
   - Requires immediate attention

3. **Service Down** (service unreachable for 1 minute)
   - Triggers when backend is not responding
   - Critical infrastructure issue

#### Warning Alerts

1. **Slow Response Time** (>500ms p95 for 5 minutes)
   - Indicates performance degradation
   - May require optimization

2. **Slow Database Queries** (>100ms p95 for 5 minutes)
   - Database performance issue
   - Check query optimization

3. **High CPU Usage** (>80% for 10 minutes)
   - Resource constraint
   - May need scaling

4. **High Memory Usage** (>2GB for 10 minutes)
   - Memory leak or high load
   - Monitor for growth

5. **Authentication Failure Spike** (>10/s for 5 minutes)
   - Potential security issue
   - Check for brute force attacks

### Alertmanager Configuration

1. **Install Alertmanager:**

```bash
docker run -d -p 9093:9093 \
  -v $(pwd)/monitoring/alertmanager/config.yml:/etc/alertmanager/config.yml \
  prom/alertmanager
```

2. **Configure Notifications:**

Create `monitoring/alertmanager/config.yml`:

```yaml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'team-notifications'

receivers:
  - name: 'team-notifications'
    email_configs:
      - to: 'team@example.com'
        from: 'alerts@example.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alerts@example.com'
        auth_password: 'password'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        channel: '#alerts'
        title: 'LabTech Alert: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

## Grafana Dashboards

### Setup

1. **Install Grafana:**

```bash
docker run -d -p 3001:3000 \
  -e "GF_SECURITY_ADMIN_PASSWORD=admin" \
  grafana/grafana
```

2. **Add Prometheus Data Source:**
   - Open http://localhost:3001
   - Login (admin/admin)
   - Configuration → Data Sources → Add Prometheus
   - URL: http://localhost:9090

3. **Import Dashboard:**
   - Dashboards → Import
   - Upload `monitoring/grafana/labtech-dashboard.json`

### Dashboard Panels

The LabTech dashboard includes:

1. **Request Rate** - Requests per second by endpoint
2. **Response Time** - 95th percentile response time
3. **Error Rate** - Errors per second by type
4. **Active Connections** - HTTP and WebSocket connections
5. **Database Query Rate** - Queries per second by operation
6. **Database Query Duration** - Query performance
7. **CPU Usage** - Process CPU utilization
8. **Memory Usage** - Process memory consumption

### Custom Queries

Add custom panels with these queries:

```promql
# Top 5 slowest endpoints
topk(5, histogram_quantile(0.95, 
  rate(labtech_http_request_duration_seconds_bucket[5m])
))

# Error rate by endpoint
sum by (route) (rate(labtech_http_errors_total[5m]))

# Database connection pool utilization
(labtech_database_connection_pool{status="active"} / 
 labtech_database_connection_pool{status="total"}) * 100
```

## Best Practices

### Logging

1. **Use Appropriate Log Levels:**
   - DEBUG: Detailed debugging information
   - INFO: General informational messages
   - WARN: Warning messages for potentially harmful situations
   - ERROR: Error messages that need attention

2. **Include Context:**
   - Always include request ID for tracing
   - Add user ID when available
   - Include relevant data for debugging

3. **Avoid Sensitive Data:**
   - Never log passwords or tokens
   - Sanitize user input before logging
   - Use encryption for sensitive fields

### Monitoring

1. **Set Realistic Thresholds:**
   - Base alerts on historical data
   - Adjust thresholds as application scales
   - Avoid alert fatigue

2. **Monitor Key Metrics:**
   - Request rate and response time
   - Error rate and types
   - Database performance
   - Resource utilization

3. **Regular Review:**
   - Review metrics weekly
   - Analyze trends and patterns
   - Optimize based on insights

### Error Tracking

1. **Provide Context:**
   - Include user and request context
   - Add breadcrumbs for debugging
   - Tag errors by severity

2. **Handle Errors Gracefully:**
   - Catch and log errors
   - Return user-friendly messages
   - Don't expose internal details

3. **Monitor Error Trends:**
   - Track error frequency
   - Identify recurring issues
   - Prioritize fixes by impact

## Troubleshooting

### Logs Not Appearing

1. Check log directory permissions
2. Verify LOG_FILE_PATH in .env
3. Check disk space

### Metrics Not Updating

1. Verify /metrics endpoint is accessible
2. Check Prometheus scrape configuration
3. Review Prometheus logs

### Sentry Not Capturing Errors

1. Verify SENTRY_DSN is set correctly
2. Check network connectivity to Sentry
3. Review Sentry project settings

### Alerts Not Firing

1. Check Alertmanager configuration
2. Verify alert rules syntax
3. Test notification channels

## Additional Resources

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Sentry Documentation](https://docs.sentry.io/)
