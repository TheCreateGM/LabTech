# Architecture Overview

Comprehensive architecture documentation for the LabTech GeoLab User Tracking System.

## Table of Contents

- [System Overview](#system-overview)
- [Technology Stack](#technology-stack)
- [Architecture Patterns](#architecture-patterns)
- [Component Architecture](#component-architecture)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [Scalability](#scalability)

## System Overview

The LabTech GeoLab User Tracking System is a full-stack application built with a modern microservices-inspired architecture. It tracks user interactions, stores activity logs, and provides administrative monitoring capabilities.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Angular SPA     │         │   Ionic Mobile   │         │
│  │  (Web Frontend)  │         │   App            │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
└───────────┼──────────────────────────────┼──────────────────┘
            │                              │
            └──────────────┬───────────────┘
                           │ HTTPS/WSS
┌──────────────────────────┼──────────────────────────────────┐
│                  API Gateway / Load Balancer                 │
│              (Nginx / AWS ALB / Heroku Router)               │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                  Application Layer                           │
│  ┌─────────────────────────────────────────────────┐        │
│  │         Node.js + Express Backend               │        │
│  │  ┌──────────────┐  ┌──────────────┐            │        │
│  │  │ REST API     │  │ WebSocket    │            │        │
│  │  │ Controllers  │  │ Server       │            │        │
│  │  └──────┬───────┘  └──────┬───────┘            │        │
│  │         │                  │                     │        │
│  │  ┌──────┴──────────────────┴───────┐           │        │
│  │  │      Business Logic Layer       │           │        │
│  │  │  - Services                     │           │        │
│  │  │  - Repositories                 │           │        │
│  │  │  - Middleware                   │           │        │
│  │  └──────┬──────────────────────────┘           │        │
│  └─────────┼──────────────────────────────────────┘        │
└────────────┼──────────────────────────────────────────────┘
             │
┌────────────┼──────────────────────────────────────────────┐
│         Data Layer                                          │
│  ┌──────────┴──────────┐  ┌────────────┐  ┌────────────┐ │
│  │ PostgreSQL          │  │ Redis      │  │ S3/Storage │ │
│  │ (Primary Database)  │  │ (Cache)    │  │ (Backups)  │ │
│  └─────────────────────┘  └────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Frontend**: Angular/Ionic application for user interface
2. **Backend API**: Node.js/Express REST API server
3. **WebSocket Server**: Real-time communication for admin dashboard
4. **Database**: PostgreSQL for persistent storage
5. **Cache**: Redis for session management and caching
6. **Storage**: S3 or local filesystem for backups

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Angular | 18.x | Web framework |
| Ionic | 8.x | Mobile UI components |
| Capacitor | 6.x | Native mobile capabilities |
| TypeScript | 5.x | Type-safe JavaScript |
| RxJS | 7.x | Reactive programming |
| Socket.IO Client | 4.x | WebSocket client |
| Chart.js | 4.x | Data visualization |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18.x | Runtime environment |
| Express | 4.x | Web framework |
| TypeScript | 5.x | Type-safe JavaScript |
| PostgreSQL | 15.x | Primary database |
| Redis | 7.x | Cache and sessions |
| Socket.IO | 4.x | WebSocket server |
| JWT | 9.x | Authentication |
| Bcrypt | 5.x | Password hashing |

### DevOps

| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Local development |
| Terraform | Infrastructure as Code |
| GitHub Actions | CI/CD |
| Nginx | Reverse proxy |
| PM2 | Process management |
| Prometheus | Metrics collection |
| Grafana | Metrics visualization |
| Sentry | Error tracking |

## Architecture Patterns

### 1. Layered Architecture

The application follows a strict layered architecture:

```
┌─────────────────────────────────────┐
│      Presentation Layer             │
│  (Controllers, Routes, Middleware)  │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│      Business Logic Layer           │
│  (Services, Domain Logic)           │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│      Data Access Layer              │
│  (Repositories, ORM)                │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│      Data Layer                     │
│  (Database, Cache, Storage)         │
└─────────────────────────────────────┘
```

**Benefits**:
- Clear separation of concerns
- Easy to test each layer independently
- Maintainable and scalable
- Follows SOLID principles

### 2. Repository Pattern

Data access is abstracted through repositories:

```typescript
// Base Repository
class BaseRepository<T> {
  async findById(id: string): Promise<T | null>
  async findAll(filters?: any): Promise<T[]>
  async create(data: Partial<T>): Promise<T>
  async update(id: string, data: Partial<T>): Promise<T>
  async delete(id: string): Promise<boolean>
}

// Specific Repository
class ActivityLogRepository extends BaseRepository<ActivityLog> {
  async findByUserId(userId: string): Promise<ActivityLog[]>
  async findByDateRange(start: Date, end: Date): Promise<ActivityLog[]>
  async exportToCSV(filters: any): Promise<string>
}
```

**Benefits**:
- Database-agnostic business logic
- Easy to mock for testing
- Centralized data access logic
- Supports multiple data sources

### 3. Service Layer Pattern

Business logic is encapsulated in services:

```typescript
class ActivityTrackingService {
  constructor(
    private activityRepo: ActivityLogRepository,
    private userRepo: UserRepository,
    private queue: Queue
  ) {}

  async logActivity(data: ActivityData): Promise<ActivityLog> {
    // Validate data
    // Apply business rules
    // Store in database
    // Emit events
    // Return result
  }
}
```

**Benefits**:
- Reusable business logic
- Transaction management
- Event coordination
- Easy to test

### 4. Middleware Pattern

Cross-cutting concerns handled by middleware:

```typescript
// Authentication middleware
app.use('/api/v1/activities', authenticateToken);

// Rate limiting middleware
app.use('/api/v1/auth', rateLimiter);

// Request logging middleware
app.use(requestLogger);

// Error handling middleware
app.use(errorHandler);
```

**Benefits**:
- Separation of concerns
- Reusable across routes
- Easy to add/remove features
- Clean route handlers

### 5. Event-Driven Architecture

Asynchronous operations use events:

```typescript
// Event emitter
eventEmitter.emit('activity:logged', activity);

// Event listener
eventEmitter.on('activity:logged', async (activity) => {
  await websocketService.broadcast('activity:new', activity);
  await notificationService.notify(activity);
});
```

**Benefits**:
- Loose coupling
- Scalable
- Non-blocking operations
- Easy to add new features

## Component Architecture

### Backend Components

#### 1. Controllers

Handle HTTP requests and responses:

```typescript
class ActivityController {
  async getActivities(req: Request, res: Response) {
    const filters = this.parseFilters(req.query);
    const activities = await this.activityService.getActivities(filters);
    res.json({ data: activities });
  }
}
```

**Responsibilities**:
- Request validation
- Response formatting
- Error handling
- HTTP status codes

#### 2. Services

Implement business logic:

```typescript
class ActivityTrackingService {
  async logActivity(data: ActivityData): Promise<ActivityLog> {
    // Validate
    this.validateActivityData(data);
    
    // Enrich
    const enriched = await this.enrichActivityData(data);
    
    // Store
    const activity = await this.activityRepo.create(enriched);
    
    // Emit event
    this.eventEmitter.emit('activity:logged', activity);
    
    return activity;
  }
}
```

**Responsibilities**:
- Business logic
- Data validation
- Transaction management
- Event emission

#### 3. Repositories

Handle data persistence:

```typescript
class ActivityLogRepository extends BaseRepository<ActivityLog> {
  async findByUserId(userId: string): Promise<ActivityLog[]> {
    return this.db.query(
      'SELECT * FROM activity_logs WHERE user_id = $1',
      [userId]
    );
  }
}
```

**Responsibilities**:
- Database queries
- Data mapping
- Query optimization
- Connection management

#### 4. Middleware

Handle cross-cutting concerns:

```typescript
// Authentication
const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const user = await authService.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

**Responsibilities**:
- Authentication
- Authorization
- Rate limiting
- Request logging
- Error handling

### Frontend Components

#### 1. Services

Handle API communication and state:

```typescript
@Injectable({ providedIn: 'root' })
export class ActivityTrackingService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  trackActivity(activity: Activity): Observable<Activity> {
    return this.http.post<Activity>(
      `${this.apiUrl}/activities`,
      activity
    );
  }
}
```

#### 2. Components

Implement UI logic:

```typescript
@Component({
  selector: 'app-activity-log-table',
  templateUrl: './activity-log-table.component.html'
})
export class ActivityLogTableComponent implements OnInit {
  activities$: Observable<Activity[]>;

  constructor(private activityService: ActivityLogService) {}

  ngOnInit() {
    this.activities$ = this.activityService.getActivities();
  }
}
```

#### 3. Guards

Protect routes:

```typescript
@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  canActivate(): boolean {
    return this.authService.isAdmin();
  }
}
```

#### 4. Interceptors

Handle HTTP requests globally:

```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = localStorage.getItem('accessToken');
    if (token) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }
    return next.handle(req);
  }
}
```

## Data Flow

### Activity Logging Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ User    │────>│ Angular │────>│ Backend │────>│Database │
│ Action  │     │ Service │     │ API     │     │         │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
                                      │
                                      ├──────> Queue
                                      │
                                      └──────> WebSocket
                                               (Real-time)
```

**Steps**:
1. User performs action in UI
2. Angular service captures event
3. HTTP request sent to backend
4. Backend validates and processes
5. Activity stored in database
6. Event queued for async processing
7. WebSocket broadcasts to connected clients

### Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ User    │────>│ Login   │────>│ Auth    │────>│Database │
│ Login   │     │ Form    │     │ Service │     │         │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
                                      │
                                      ├──────> JWT Token
                                      │
                                      └──────> Redis
                                               (Session)
```

**Steps**:
1. User submits credentials
2. Backend validates credentials
3. Password verified with bcrypt
4. JWT tokens generated
5. Session stored in Redis
6. Tokens returned to client
7. Client stores tokens securely

## Security Architecture

### Defense in Depth

Multiple layers of security:

```
┌─────────────────────────────────────────┐
│  1. Network Security                    │
│     - Firewall                          │
│     - DDoS protection                   │
│     - Rate limiting                     │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│  2. Transport Security                  │
│     - TLS 1.3                           │
│     - Certificate validation            │
│     - HSTS                              │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│  3. Application Security                │
│     - Input validation                  │
│     - Output encoding                   │
│     - CSRF protection                   │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│  4. Authentication & Authorization      │
│     - JWT tokens                        │
│     - MFA                               │
│     - RBAC                              │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│  5. Data Security                       │
│     - Encryption at rest                │
│     - Field-level encryption            │
│     - Secure key management             │
└─────────────────────────────────────────┘
```

### Security Controls

1. **Authentication**: JWT with RS256 signing
2. **Authorization**: Role-based access control
3. **Encryption**: AES-256 for sensitive data
4. **Input Validation**: Strict validation on all inputs
5. **Rate Limiting**: Prevent brute force attacks
6. **CORS**: Restrict cross-origin requests
7. **Security Headers**: HSTS, CSP, X-Frame-Options
8. **SQL Injection Prevention**: Parameterized queries
9. **XSS Prevention**: Output encoding
10. **CSRF Protection**: CSRF tokens

## Scalability

### Horizontal Scaling

The application is designed to scale horizontally:

```
┌─────────────────────────────────────────┐
│         Load Balancer                   │
└──────────┬──────────────────────────────┘
           │
    ┌──────┴──────┬──────────┬──────────┐
    │             │          │          │
┌───┴───┐   ┌─────┴────┐ ┌──┴────┐ ┌───┴───┐
│ App 1 │   │  App 2   │ │ App 3 │ │ App N │
└───┬───┘   └─────┬────┘ └──┬────┘ └───┬───┘
    │             │          │          │
    └──────┬──────┴──────────┴──────────┘
           │
    ┌──────┴──────────────────────────────┐
    │  Shared Database & Cache             │
    └─────────────────────────────────────┘
```

**Stateless Design**:
- No server-side sessions (JWT tokens)
- Shared Redis for cache
- Centralized database
- Load balancer distributes requests

### Vertical Scaling

Individual components can be scaled vertically:

- **Database**: Increase CPU, RAM, storage
- **Redis**: Increase memory
- **Application**: Increase CPU, RAM

### Caching Strategy

Multi-level caching:

```
┌─────────────────────────────────────────┐
│  1. Browser Cache                       │
│     - Static assets (1 year)            │
│     - API responses (5 minutes)         │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│  2. CDN Cache                           │
│     - Static files                      │
│     - Images                            │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│  3. Redis Cache                         │
│     - User sessions (15 min)            │
│     - Activity stats (5 min)            │
│     - File metadata (1 hour)            │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│  4. Database Query Cache                │
│     - Frequently accessed data          │
└─────────────────────────────────────────┘
```

### Database Optimization

- **Indexing**: Strategic indexes on frequently queried columns
- **Partitioning**: Table partitioning for large datasets
- **Read Replicas**: Separate read and write operations
- **Connection Pooling**: Reuse database connections
- **Query Optimization**: Efficient queries with EXPLAIN ANALYZE

## Design Principles

### SOLID Principles

1. **Single Responsibility**: Each class has one reason to change
2. **Open/Closed**: Open for extension, closed for modification
3. **Liskov Substitution**: Subtypes must be substitutable
4. **Interface Segregation**: Many specific interfaces over one general
5. **Dependency Inversion**: Depend on abstractions, not concretions

### 12-Factor App

1. **Codebase**: One codebase, many deploys
2. **Dependencies**: Explicitly declare dependencies
3. **Config**: Store config in environment
4. **Backing Services**: Treat as attached resources
5. **Build, Release, Run**: Strictly separate stages
6. **Processes**: Execute as stateless processes
7. **Port Binding**: Export services via port binding
8. **Concurrency**: Scale out via process model
9. **Disposability**: Fast startup and graceful shutdown
10. **Dev/Prod Parity**: Keep environments similar
11. **Logs**: Treat logs as event streams
12. **Admin Processes**: Run as one-off processes

## Additional Resources

- [Database Schema](./DATABASE_SCHEMA.md)
- [API Documentation](../backend/docs/README.md)
- [Deployment Guides](./AWS_DEPLOYMENT_GUIDE.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
