# Local Development Setup

Complete guide for setting up the LabTech GeoLab User Tracking System for local development.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Development Tools](#development-tools)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Debugging](#debugging)
- [Common Issues](#common-issues)

## Prerequisites

### Required Software

1. **Node.js** (version 18.x or later)
   ```bash
   # Check version
   node --version
   
   # Install via nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   ```

2. **PostgreSQL** (version 15.x or later)
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   
   # macOS
   brew install postgresql@15
   brew services start postgresql@15
   
   # Verify installation
   psql --version
   ```

3. **Redis** (version 7.x or later)
   ```bash
   # Ubuntu/Debian
   sudo apt-get install redis-server
   sudo systemctl start redis
   
   # macOS
   brew install redis
   brew services start redis
   
   # Verify installation
   redis-cli ping
   ```

4. **Git**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install git
   
   # macOS
   brew install git
   
   # Verify installation
   git --version
   ```

### Recommended Software

1. **VS Code** with extensions:
   - ESLint
   - Prettier
   - Angular Language Service
   - PostgreSQL
   - GitLens

2. **Postman** or **Insomnia** for API testing

3. **pgAdmin** or **DBeaver** for database management

## Quick Start

For a rapid setup, run the automated setup script:

```bash
# Clone repository
git clone https://github.com/your-org/labtech-geolab.git
cd labtech-geolab

# Run setup script
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh
```

The script will:
- Install all dependencies
- Set up database
- Run migrations
- Generate SSL certificates
- Create environment files
- Start development servers

## Detailed Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/labtech-geolab.git
cd labtech-geolab
```

### Step 2: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ..
npm install
```

### Step 3: Set Up PostgreSQL

```bash
# Create database user
sudo -u postgres createuser -s labtech

# Set password
sudo -u postgres psql
postgres=# ALTER USER labtech WITH PASSWORD 'your_password';
postgres=# \q

# Create database
createdb -U labtech labtech_geolab

# Verify connection
psql -U labtech -d labtech_geolab -c "SELECT version();"
```

### Step 4: Set Up Redis

```bash
# Start Redis server
redis-server

# Test connection
redis-cli ping
# Should return: PONG

# Set password (optional but recommended)
redis-cli
127.0.0.1:6379> CONFIG SET requirepass "your_redis_password"
127.0.0.1:6379> AUTH your_redis_password
127.0.0.1:6379> exit
```

### Step 5: Configure Environment Variables

```bash
# Backend environment
cd backend
cp .env.example .env
nano .env
```

Edit `.env`:

```bash
# Application
NODE_ENV=development
PORT=3000
API_VERSION=v1
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://labtech:your_password@localhost:5432/labtech_geolab
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://localhost:6379
# REDIS_PASSWORD=your_redis_password  # Uncomment if you set a password

# JWT (development keys - DO NOT use in production)
JWT_SECRET=dev-secret-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Encryption (development key - DO NOT use in production)
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# CORS
CORS_ORIGIN=http://localhost:4200

# Rate Limiting (relaxed for development)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000

# Features
ENABLE_SWAGGER=true
ENABLE_METRICS=true
ENABLE_MFA=true
```

Frontend environment:

```bash
# Root directory
cd ..
cp src/environments/environment.example.ts src/environments/environment.ts
nano src/environments/environment.ts
```

Edit `environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  wsUrl: 'http://localhost:3000',
  enableDebug: true
};
```

### Step 6: Generate RSA Keys for JWT

```bash
cd backend

# Create keys directory
mkdir -p keys

# Generate private key
openssl genrsa -out keys/private.pem 2048

# Generate public key
openssl rsa -in keys/private.pem -pubout -out keys/public.pem

# Update .env
echo "JWT_PRIVATE_KEY_PATH=./keys/private.pem" >> .env
echo "JWT_PUBLIC_KEY_PATH=./keys/public.pem" >> .env
```

### Step 7: Run Database Migrations

```bash
cd backend

# Run migrations
npm run migrate

# Verify migrations
npm run migrate:status

# Should show all migrations as "up"
```

### Step 8: Seed Database (Optional)

```bash
# Create seed script
npm run seed

# Or manually insert test data
psql -U labtech -d labtech_geolab

-- Create admin user
INSERT INTO users (username, email, password_hash, role)
VALUES (
  'admin',
  'admin@localhost',
  '$2b$10$YourBcryptHashHere',  -- Use bcrypt to hash 'admin123'
  'admin'
);
```

Generate bcrypt hash:

```bash
node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('admin123', 10).then(hash => console.log(hash));
"
```

## Development Tools

### VS Code Configuration

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true,
    "**/node_modules": true,
    "**/dist": true
  }
}
```

Create `.vscode/launch.json` for debugging:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/backend/src/index.ts",
      "preLaunchTask": "tsc: build - backend/tsconfig.json",
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"],
      "envFile": "${workspaceFolder}/backend/.env"
    },
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug Frontend",
      "url": "http://localhost:4200",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

### Git Hooks

Set up pre-commit hooks with Husky:

```bash
# Install Husky
npm install --save-dev husky

# Initialize Husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm test"

# Add commit-msg hook
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
```

## Running the Application

### Development Mode

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```

The backend will start on http://localhost:3000

**Terminal 2 - Frontend**:
```bash
npm start
```

The frontend will start on http://localhost:4200

**Terminal 3 - Watch Mode (Optional)**:
```bash
cd backend
npm run watch
```

### Production Build

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd ..
npm run build

# Start production server
cd backend
npm run start:prod
```

### Docker Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Testing

### Run All Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd ..
npm test

# E2E tests
npm run e2e
```

### Run Specific Tests

```bash
# Run specific test file
npm test -- user.service.spec.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create user"

# Run tests with coverage
npm run test:coverage
```

### Watch Mode

```bash
# Backend
cd backend
npm run test:watch

# Frontend
cd ..
npm run test:watch
```

## Debugging

### Backend Debugging

#### VS Code

1. Set breakpoints in code
2. Press F5 or select "Debug Backend" from debug menu
3. Application starts in debug mode

#### Chrome DevTools

```bash
# Start with inspect flag
node --inspect dist/index.js

# Open Chrome
chrome://inspect

# Click "inspect" under Remote Target
```

#### Debug Logs

```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# View logs
tail -f logs/app.log
```

### Frontend Debugging

#### Browser DevTools

1. Open application in Chrome
2. Press F12 to open DevTools
3. Use Sources tab to set breakpoints
4. Use Console for logging

#### Angular DevTools

Install Angular DevTools extension for Chrome:
- View component tree
- Inspect component state
- Profile performance

### Database Debugging

```bash
# Connect to database
psql -U labtech -d labtech_geolab

# Enable query logging
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

# View logs
tail -f /var/log/postgresql/postgresql-15-main.log

# Explain query
EXPLAIN ANALYZE SELECT * FROM activity_logs WHERE user_id = '...';
```

### Redis Debugging

```bash
# Connect to Redis
redis-cli

# Monitor all commands
MONITOR

# View all keys
KEYS *

# Get key value
GET session:abc123

# View key TTL
TTL session:abc123
```

## Common Issues

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Database Connection Failed

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check connection
psql -U labtech -d labtech_geolab -c "SELECT 1;"
```

### Redis Connection Failed

```bash
# Check Redis status
redis-cli ping

# Restart Redis
sudo systemctl restart redis

# Check logs
sudo journalctl -u redis -f
```

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

### TypeScript Errors

```bash
# Rebuild TypeScript
npm run build

# Check for type errors
npm run type-check

# Update TypeScript
npm install -D typescript@latest
```

### Migration Errors

```bash
# Check migration status
npm run migrate:status

# Rollback last migration
npm run migrate:down

# Reset database (development only)
npm run db:reset
npm run migrate
```

## Development Workflow

### Daily Workflow

1. **Pull latest changes**:
   ```bash
   git pull origin main
   ```

2. **Install dependencies** (if package.json changed):
   ```bash
   npm install
   ```

3. **Run migrations** (if new migrations):
   ```bash
   cd backend
   npm run migrate
   ```

4. **Start development servers**:
   ```bash
   # Terminal 1
   cd backend && npm run dev
   
   # Terminal 2
   npm start
   ```

5. **Make changes and test**

6. **Commit and push**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/your-branch
   ```

### Code Quality Checks

```bash
# Run all checks
npm run validate

# Individual checks
npm run lint          # ESLint
npm run format        # Prettier
npm run type-check    # TypeScript
npm test              # Tests
```

## Additional Resources

- [Architecture Documentation](./ARCHITECTURE.md)
- [API Documentation](../backend/docs/README.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

## Getting Help

- **Documentation**: Check [docs/](../docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/labtech-geolab/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/labtech-geolab/discussions)
- **Slack**: #labtech-dev channel
- **Email**: dev@labtech-geolab.com
