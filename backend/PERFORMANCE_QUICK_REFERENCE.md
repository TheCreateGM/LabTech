# Performance Optimization Quick Reference

## Cache Service Usage

### Import
```typescript
import { cacheService, CacheKeys } from './services/CacheService';
```

### Basic Operations
```typescript
// Get from cache
const value = await cacheService.get<MyType>('my-key');

// Set in cache with TTL (seconds)
await cacheService.set('my-key', data, 300);

// Delete from cache
await cacheService.delete('my-key');

// Delete by pattern
await cacheService.deletePattern('user:*');
```

### Get or Set Pattern
```typescript
const data = await cacheService.getOrSet(
  CacheKeys.activityStats(),
  CacheKeys.activityStatsTTL,
  async () => {
    // Compute expensive operation
    return await repository.getStatistics();
  }
);
```

### Standard Cache Keys
```typescript
// User session (TTL: 15 min)
CacheKeys.userSession(userId)

// Activity stats (TTL: 5 min)
CacheKeys.activityStats()
CacheKeys.activityStatsByUser(userId)

// File metadata (TTL: 1 hour)
CacheKeys.fileMetadata(path)
CacheKeys.fileMetadataList()

// User data (TTL: 15 min)
CacheKeys.user(userId)
CacheKeys.userByUsername(username)
CacheKeys.userByEmail(email)
```

## Query Optimization

### Cursor-Based Pagination
```typescript
import { activityLogRepository } from './repositories/ActivityLogRepository';

const result = await activityLogRepository.findWithCursor(
  filters,
  50,  // limit
  cursor  // optional, from previous response
);

// Returns: { data, nextCursor, hasMore }
```

### Query Monitoring
```typescript
import { executeWithMonitoring } from './utils/queryOptimizer';

const results = await executeWithMonitoring(
  'SELECT * FROM activity_logs WHERE user_id = $1',
  [userId]
);
// Automatically logs slow queries (> 1 second)
```

### Query Analysis
```typescript
import { analyzeQuery, getTableStats } from './utils/queryOptimizer';

// Get execution plan
const plan = await analyzeQuery(query, params);

// Get table statistics
const stats = await getTableStats('activity_logs');
console.log(`Rows: ${stats.rowCount}, Size: ${stats.totalSize}`);
```

## Frontend Optimizations

### Debouncing Inputs
```typescript
import { debounceTime, distinctUntilChanged } from 'rxjs';

this.searchControl.valueChanges
  .pipe(
    debounceTime(300),
    distinctUntilChanged()
  )
  .subscribe(value => {
    this.search(value);
  });
```

### Lazy Loading Routes
```typescript
{
  path: 'admin',
  loadComponent: () => import('./admin/admin.component')
    .then(m => m.AdminComponent)
}
```

### Virtual Scrolling (Ionic)
```html
<ion-infinite-scroll 
  threshold="100px" 
  (ionInfinite)="loadMore($event)">
  <ion-infinite-scroll-content></ion-infinite-scroll-content>
</ion-infinite-scroll>
```

## Cache Invalidation Patterns

### After Create/Update
```typescript
// After creating activity
await activityLogRepository.create(data);
await cacheService.delete(CacheKeys.activityStats());
await cacheService.deletePattern(CacheKeys.activityStatsByUser('*'));
```

### After File Update
```typescript
// After updating file metadata
await fileMetadataRepository.update(id, data);
await cacheService.delete(CacheKeys.fileMetadata(path));
await cacheService.delete(CacheKeys.fileMetadataList());
```

## Performance Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

### Cache Statistics
```typescript
const stats = await cacheService.getStats();
console.log(`Keys: ${stats.keys}, Memory: ${stats.memory}`);
```

### Database Pool Status
```typescript
const health = await db.healthCheck();
console.log(health.details.pool);
```

## Common Patterns

### Repository with Cache
```typescript
async findById(id: string): Promise<User | null> {
  return await cacheService.getOrSet(
    CacheKeys.user(id),
    CacheKeys.userTTL,
    async () => {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await this.db.query(query, [id]);
      return result[0] || null;
    }
  );
}
```

### Batch Operations
```typescript
import { executeBatch } from './utils/queryOptimizer';

const queries = [
  { query: 'INSERT INTO ...', params: [...] },
  { query: 'UPDATE ...', params: [...] }
];

const results = await executeBatch(queries);
```

## Performance Targets

| Metric | Target |
|--------|--------|
| Cache Hit Rate | > 80% |
| API Response (p95) | < 200ms |
| Database Query | < 100ms |
| Page Load | < 3s |
| Bundle Size | < 2MB |

## Troubleshooting

### Slow Queries
```bash
# Check logs
tail -f backend/logs/combined.log | grep "Slow query"

# Analyze in database
EXPLAIN ANALYZE SELECT ...;
```

### Cache Issues
```bash
# Check Redis
redis-cli ping
redis-cli INFO stats

# Clear cache
redis-cli FLUSHDB
```

### Bundle Size
```bash
# Analyze bundle
npm run build:prod
npx webpack-bundle-analyzer dist/stats.json
```
