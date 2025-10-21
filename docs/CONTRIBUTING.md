# Contributing Guidelines

Thank you for your interest in contributing to the LabTech GeoLab User Tracking System!

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, trolling, or discriminatory comments
- Personal or political attacks
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

## Getting Started

### Prerequisites

- Node.js 18.x or later
- PostgreSQL 15.x or later
- Redis 7.x or later
- Git
- Code editor (VS Code recommended)

### Local Development Setup

1. **Fork and Clone**:
   ```bash
   git clone https://github.com/your-username/labtech-geolab.git
   cd labtech-geolab
   ```

2. **Install Dependencies**:
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../
   npm install
   ```

3. **Set Up Database**:
   ```bash
   # Create database
   createdb labtech_geolab
   
   # Run migrations
   cd backend
   npm run migrate
   ```

4. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your local settings
   ```

5. **Start Development Servers**:
   ```bash
   # Backend (in backend directory)
   npm run dev
   
   # Frontend (in root directory)
   npm start
   ```

### Project Structure

```
labtech-geolab/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── repositories/   # Data access
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   └── utils/          # Utilities
│   ├── migrations/         # Database migrations
│   ├── tests/              # Backend tests
│   └── docs/               # Backend documentation
├── src/                    # Frontend application
│   └── app/
│       ├── admin/          # Admin module
│       ├── pages/          # Page components
│       ├── services/       # Angular services
│       └── guards/         # Route guards
├── docs/                   # Project documentation
└── deployment/             # Deployment configs
```

## Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates
- `chore/` - Maintenance tasks

### 2. Make Changes

- Write clean, readable code
- Follow coding standards (see below)
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run linter
npm run lint

# Run tests
npm test

# Run type checking
npm run type-check

# Run all checks
npm run validate
```

### 4. Commit Your Changes

Follow commit message guidelines (see below):

```bash
git add .
git commit -m "feat: add user activity export feature"
```

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

## Coding Standards

### TypeScript/JavaScript

#### Style Guide

- Use TypeScript for all new code
- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use ESLint and Prettier for formatting
- Maximum line length: 100 characters
- Use 2 spaces for indentation

#### Naming Conventions

```typescript
// Classes: PascalCase
class UserService {}

// Interfaces: PascalCase with 'I' prefix (optional)
interface IUser {}

// Functions/Methods: camelCase
function getUserById() {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;

// Variables: camelCase
const userId = '123';

// Private properties: camelCase with underscore prefix
private _internalState = {};
```

#### Code Organization

```typescript
// 1. Imports (grouped and sorted)
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// 2. Interfaces/Types
interface User {
  id: string;
  username: string;
}

// 3. Class declaration
@Injectable({ providedIn: 'root' })
export class UserService {
  // 4. Properties
  private apiUrl = environment.apiUrl;
  
  // 5. Constructor
  constructor(private http: HttpClient) {}
  
  // 6. Public methods
  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }
  
  // 7. Private methods
  private handleError(error: any): void {
    console.error(error);
  }
}
```

#### Best Practices

1. **Use async/await over promises**:
   ```typescript
   // Good
   async function getUser(id: string): Promise<User> {
     const user = await userRepository.findById(id);
     return user;
   }
   
   // Avoid
   function getUser(id: string): Promise<User> {
     return userRepository.findById(id).then(user => user);
   }
   ```

2. **Use destructuring**:
   ```typescript
   // Good
   const { username, email } = user;
   
   // Avoid
   const username = user.username;
   const email = user.email;
   ```

3. **Use template literals**:
   ```typescript
   // Good
   const message = `Hello, ${username}!`;
   
   // Avoid
   const message = 'Hello, ' + username + '!';
   ```

4. **Use optional chaining**:
   ```typescript
   // Good
   const city = user?.address?.city;
   
   // Avoid
   const city = user && user.address && user.address.city;
   ```

5. **Use nullish coalescing**:
   ```typescript
   // Good
   const port = config.port ?? 3000;
   
   // Avoid
   const port = config.port || 3000;
   ```

### Angular

#### Component Structure

```typescript
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit, OnDestroy {
  // 1. Input/Output properties
  @Input() users: User[] = [];
  @Output() userSelected = new EventEmitter<User>();
  
  // 2. Public properties
  loading = false;
  error: string | null = null;
  
  // 3. Private properties
  private destroy$ = new Subject<void>();
  
  // 4. Constructor
  constructor(private userService: UserService) {}
  
  // 5. Lifecycle hooks
  ngOnInit(): void {
    this.loadUsers();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // 6. Public methods
  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.users = users;
          this.loading = false;
        },
        error: (error) => {
          this.error = error.message;
          this.loading = false;
        }
      });
  }
  
  // 7. Private methods
  private handleError(error: any): void {
    console.error(error);
  }
}
```

#### Template Guidelines

```html
<!-- Use structural directives properly -->
<div *ngIf="loading">Loading...</div>
<div *ngIf="error" class="error">{{ error }}</div>

<!-- Use trackBy for *ngFor -->
<div *ngFor="let user of users; trackBy: trackByUserId">
  {{ user.username }}
</div>

<!-- Use async pipe for observables -->
<div *ngIf="users$ | async as users">
  <div *ngFor="let user of users">{{ user.username }}</div>
</div>

<!-- Use proper event binding -->
<button (click)="onUserClick(user)">Select</button>
```

### SQL

```sql
-- Use uppercase for keywords
SELECT id, username, email
FROM users
WHERE role = 'admin'
ORDER BY created_at DESC;

-- Use meaningful aliases
SELECT 
  u.username,
  COUNT(a.id) AS activity_count
FROM users u
LEFT JOIN activity_logs a ON u.id = a.user_id
GROUP BY u.id, u.username;

-- Use proper indentation
INSERT INTO users (
  username,
  email,
  password_hash,
  role
) VALUES (
  'johndoe',
  'john@example.com',
  '$2b$10$...',
  'user'
);
```

## Testing Requirements

### Test Coverage

- Minimum 80% code coverage for new code
- All new features must include tests
- Bug fixes must include regression tests

### Test Types

1. **Unit Tests**: Test individual functions/methods
2. **Integration Tests**: Test component interactions
3. **E2E Tests**: Test complete user flows

### Writing Tests

#### Backend Tests (Jest)

```typescript
describe('UserService', () => {
  let userService: UserService;
  let userRepository: jest.Mocked<UserRepository>;
  
  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      create: jest.fn(),
    } as any;
    
    userService = new UserService(userRepository);
  });
  
  describe('getUser', () => {
    it('should return user when found', async () => {
      const mockUser = { id: '123', username: 'johndoe' };
      userRepository.findById.mockResolvedValue(mockUser);
      
      const result = await userService.getUser('123');
      
      expect(result).toEqual(mockUser);
      expect(userRepository.findById).toHaveBeenCalledWith('123');
    });
    
    it('should throw error when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);
      
      await expect(userService.getUser('123')).rejects.toThrow('User not found');
    });
  });
});
```

#### Frontend Tests (Jasmine/Karma)

```typescript
describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let userService: jasmine.SpyObj<UserService>;
  
  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getUsers']);
    
    await TestBed.configureTestingModule({
      declarations: [UserListComponent],
      providers: [
        { provide: UserService, useValue: userServiceSpy }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });
  
  it('should load users on init', () => {
    const mockUsers = [{ id: '1', username: 'john' }];
    userService.getUsers.and.returnValue(of(mockUsers));
    
    component.ngOnInit();
    
    expect(component.users).toEqual(mockUsers);
    expect(userService.getUsers).toHaveBeenCalled();
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- user.service.spec.ts
```

## Pull Request Process

### Before Submitting

1. ✅ All tests pass
2. ✅ Code is linted and formatted
3. ✅ Documentation is updated
4. ✅ Commit messages follow guidelines
5. ✅ Branch is up to date with main

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally

## Screenshots (if applicable)
Add screenshots here

## Related Issues
Closes #123
```

### Review Process

1. **Automated Checks**: CI/CD runs tests and linting
2. **Code Review**: At least one approval required
3. **Testing**: Reviewer tests changes locally
4. **Merge**: Squash and merge to main

## Commit Message Guidelines

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test additions/updates
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Examples

```bash
# Feature
feat(auth): add multi-factor authentication

Implement TOTP-based MFA for admin users.
Includes QR code generation and backup codes.

Closes #123

# Bug fix
fix(api): resolve memory leak in activity logging

Fixed unclosed database connections in ActivityService.
Added proper cleanup in error handlers.

Fixes #456

# Documentation
docs(readme): update installation instructions

Added Docker setup instructions and troubleshooting section.

# Refactoring
refactor(services): extract common repository logic

Created BaseRepository class to reduce code duplication.
```

### Rules

1. Use imperative mood ("add" not "added")
2. Don't capitalize first letter
3. No period at the end
4. Limit subject line to 50 characters
5. Wrap body at 72 characters
6. Reference issues in footer

## Questions or Issues?

- **Documentation**: Check [docs/](../docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/labtech-geolab/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/labtech-geolab/discussions)
- **Email**: dev@labtech-geolab.com

Thank you for contributing! 🎉
