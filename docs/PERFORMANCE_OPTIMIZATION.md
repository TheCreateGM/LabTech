# Performance Optimization Guide

This document outlines the performance optimizations implemented in the LabTech GeoLab application.

## Backend Optimizations

### 1. Caching Layer (Redis)

**Implementation**: `backend/src/services/CacheService.ts`

The application uses Redis for caching frequently accessed data:

- **User Sessions**: TTL 15 minutes (900 seconds)
- **Activity Statistics**: TTL 5 minutes (300 seconds)
- **File Metadata**: TTL 1 hour (3600 seconds)

**Usage Example**:
```typescript
import { cacheService, CacheKeys } from './services/CacheService';

// Get or compute value
const stats = await cacheService.getOrSet(
  CacheKeys.activityStats(),
  CacheKeys.activityStatsTTL,
  async () => {
    return await activityLogRepository.getStatistics();
  }
);
```

**Cache Invalidation**:
- Activity statistics cache is invalidated when new activities are logged
- File metadata cache is invalidated when files are updated
- User session cache is managed automatically by TTL

### 2. Database Query Optimization

**Migration**: `backend/migrations/1761100000001_add-performance-indexes.js`

Added performance indexes for frequently queried columns:

#### Activity Logs Indexes:
- Composite index: `(user_id, timestamp)` - For user activity queries
- Composite index: `(action, timestamp)` - For action-based filtering
- Composite index: `(resource_type, resource_path)` - For resource queries
- Index: `ip_address` - For security analysis
- Partial index: Recent activities (last 30 days)

#### File Metadata Indexes:
- Index: `file_type` - For type filtering
- Index: `extension` - For extension filtering
- Index: `is_directory` - For directory queries
- Composite index: `(file_type, file_size)` - For analytics
- Index: `last_modified` - For sorting

#### Users Indexes:
- Index: `role` - For role-based queries
- Index: `mfa_enabled` - For MFA user queries
- Index: `last_login` - For activity analysis

### 3. Connection Pooling

**Configuration**: `backend/src/config/database.ts`

PostgreSQL connection pool settings:
- Minimum connections: 5
- Maximum connections: 20
- Idle timeout: 30 seconds
- Connection timeout: 10 seconds
- Statement timeout: 30 seconds

### 4. Cursor-Based Pagination

**Implementation**: `backend/src/repositories/ActivityLogRepository.ts`

Cursor-based pagination is more efficient than offset-based for large datasets:

```typescript
const result = await activityLogRepository.findWithCursor(
  filters,
  limit,
  cursor
);

// Returns: { data, nextCursor, hasMore }
```

**Benefits**:
- Consistent performance regardless of page number
- No duplicate or missing records during pagination
- Better for real-time data

### 5. Query Performance Monitoring

**Utility**: `backend/src/utils/queryOptimizer.ts`

Tools for monitoring and optimizing queries:

```typescript
import { executeWithMonitoring, analyzeQuery, getTableStats } from './utils/queryOptimizer';

// Execute with monitoring
const results = await executeWithMonitoring(query, params);

// Analyze query plan
const plan = await analyzeQuery(query, params);

// Get table statistics
const stats = await getTableStats('activity_logs');
```

**Features**:
- Automatic slow query detection (> 1 second)
- Query execution plan analysis
- Table and index statistics
- Batch query execution

## Frontend Optimizations

### 1. Lazy Loading

**Implementation**: `src/app/admin/admin.routes.ts`

All admin module components are lazy loaded:

```typescript
{
  path: 'logs',
  loadComponent: () => import('./activity-log-table/activity-log-table.component')
    .then(m => m.ActivityLogTableComponent)
}
```

**Benefits**:
- Reduced initial bundle size
- Faster initial page load
- Components loaded only when needed

### 2. Debouncing

**Implementation**: `src/app/admin/activity-filter/activity-filter.component.ts`

Filter inputs are debounced by 300ms:

```typescript
this.filterForm.get('resourcePath')?.valueChanges
  .pipe(
    debounceTime(300),
    distinctUntilChanged(),
    takeUntil(this.destroy$)
  )
  .subscribe(() => {
    this.applyFilters();
  });
```

**Benefits**:
- Reduces API calls during typing
- Improves user experience
- Reduces server load

### 3. Infinite Scroll

**Implementation**: `src/app/admin/activity-log-table/activity-log-table.component.html`

Uses Ionic's infinite scroll for pagination:

```html
<ion-infinite-scroll 
  threshold="100px" 
  (ionInfinite)="loadMore($event)"
  [disabled]="!hasMore">
</ion-infinite-scroll>
```

**Benefits**:
- Loads data on demand
- Better mobile experience
- Reduces memory usage

### 4. Service Worker Caching

**Configuration**: `ngsw-config.json`

Service worker caches:
- App shell (prefetch)
- Static assets (lazy load)
- API responses (5 minutes for stats, 1 hour for user data)

**Cache Strategies**:
- **Freshness**: Network first, fallback to cache (for activity logs)
- **Performance**: Cache first, fallback to network (for user data)

**To Enable**:
```bash
# Install service worker package
npm install @angular/service-worker

# Update angular.json to include service worker
ng add @angular/pwa
```

### 5. Bundle Size Optimization

**Analyzer**: `webpack-bundle-analyzer.config.js`

To analyze bundle size:

```bash
# Build production bundle
npm run build:prod

# Analyze bundle
npx webpack-bundle-analyzer dist/stats.json
```

**Optimization Tips**:
1. Remove unused dependencies
2. Use tree-shaking
3. Enable production mode
4. Use lazy loading
5. Optimize images and assets

## Performance Metrics

### Target Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Initial Page Load | < 3s | TBD |
| API Response Time (p95) | < 200ms | TBD |
| Database Query Time | < 100ms | TBD |
| Cache Hit Rate | > 80% | TBD |
| Bundle Size | < 2MB | TBD |

### Monitoring

**Backend Monitoring**:
- Prometheus metrics: `/metrics`
- Health check: `/health`
- Slow query logs: Check application logs

**Frontend Monitoring**:
- Chrome DevTools Performance tab
- Lighthouse audit
- Network tab for API calls

## Best Practices

### Backend

1. **Always use prepared statements** to prevent SQL injection and improve performance
2. **Cache frequently accessed data** with appropriate TTL
3. **Use indexes** for frequently queried columns
4. **Monitor slow queries** and optimize them
5. **Use connection pooling** to manage database connections
6. **Implement cursor-based pagination** for large datasets

### Frontend

1. **Lazy load modules** to reduce initial bundle size
2. **Debounce user inputs** to reduce API calls
3. **Use virtual scrolling** for large lists
4. **Enable service worker** for offline support and caching
5. **Optimize images** and use appropriate formats
6. **Use trackBy** in ngFor loops for better performance

## Troubleshooting

### Slow Queries

1. Check slow query logs:
```bash
tail -f backend/logs/combined.log | grep "Slow query"
```

2. Analyze query plan:
```typescript
const plan = await analyzeQuery(query, params);
console.log(JSON.stringify(plan, null, 2));
```

3. Check table statistics:
```typescript
const stats = await getTableStats('activity_logs');
console.log(stats);
```

### Cache Issues

1. Check cache health:
```bash
curl http://localhost:3000/health
```

2. Clear cache:
```typescript
await cacheService.flush();
```

3. Check cache statistics:
```typescript
const stats = await cacheService.getStats();
console.log(stats);
```

### High Memory Usage

1. Check connection pool:
```typescript
const health = await db.healthCheck();
console.log(health.details.pool);
```

2. Monitor Redis memory:
```bash
redis-cli INFO memory
```

3. Check for memory leaks in Node.js:
```bash
node --inspect backend/dist/index.js
```

## Future Optimizations

1. **Implement GraphQL** for more efficient data fetching
2. **Add CDN** for static assets
3. **Implement server-side rendering (SSR)** for better SEO
4. **Add database read replicas** for scaling reads
5. **Implement request coalescing** to batch similar requests
6. **Add HTTP/2 server push** for critical resources
7. **Implement progressive image loading** with blur-up technique
8. **Add WebSocket connection pooling** for real-time features

## References

- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Angular Performance Guide](https://angular.io/guide/performance-best-practices)
- [Ionic Performance](https://ionicframework.com/docs/techniques/performance)
