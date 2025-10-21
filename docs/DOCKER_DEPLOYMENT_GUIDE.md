# Docker Self-Hosted Deployment Guide

Complete guide for deploying the LabTech GeoLab User Tracking System using Docker and Docker Compose.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Step-by-Step Deployment](#step-by-step-deployment)
- [Configuration](#configuration)
- [Production Deployment](#production-deployment)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)
- [Kubernetes Deployment](#kubernetes-deployment)

## Prerequisites

### Required Software

1. **Docker** (version 20.10 or later)
   ```bash
   # Install Docker on Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Verify installation
   docker --version
   
   # Add user to docker group
   sudo usermod -aG docker $USER
   newgrp docker
   ```

2. **Docker Compose** (version 2.0 or later)
   ```bash
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   
   # Verify installation
   docker-compose --version
   ```

3. **Git**
   ```bash
   sudo apt-get install git
   ```

### System Requirements

**Minimum**:
- CPU: 2 cores
- RAM: 4GB
- Disk: 20GB
- OS: Linux (Ubuntu 20.04+ recommended)

**Recommended**:
- CPU: 4 cores
- RAM: 8GB
- Disk: 50GB SSD
- OS: Linux (Ubuntu 22.04 LTS)

## Quick Start

### Development Environment

```bash
# Clone repository
git clone https://github.com/your-org/labtech-geolab.git
cd labtech-geolab

# Copy environment file
cp .env.example .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Access application
curl http://localhost:3000/api/v1/health
```

The application will be available at:
- API: http://localhost:3000
- Frontend: http://localhost:4200
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Step-by-Step Deployment

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/labtech-geolab.git
cd labtech-geolab
```

### Step 2: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit environment variables
nano .env
```

Required variables:

```bash
# Application
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database
POSTGRES_USER=labtech
POSTGRES_PASSWORD=<generate-secure-password>
POSTGRES_DB=labtech_geolab
DATABASE_URL=postgresql://labtech:<password>@postgres:5432/labtech_geolab

# Redis
REDIS_PASSWORD=<generate-secure-password>
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379

# JWT
JWT_SECRET=<generate-secure-secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Encryption
ENCRYPTION_KEY=<generate-32-byte-key>

# CORS
CORS_ORIGIN=https://your-domain.com
```

Generate secure passwords:

```bash
# Generate random password
openssl rand -base64 32

# Generate encryption key
openssl rand -hex 32
```

### Step 3: Generate SSL Certificates

For production, use Let's Encrypt:

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Certificates will be in:
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

For development, generate self-signed certificates:

```bash
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/privkey.pem \
  -out ssl/fullchain.pem \
  -subj "/CN=localhost"
```

### Step 4: Build Docker Images

```bash
# Build all images
docker-compose build

# Or build specific service
docker-compose build backend
```

### Step 5: Start Services

```bash
# Start all services in detached mode
docker-compose up -d

# View running containers
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 6: Run Database Migrations

```bash
# Run migrations
docker-compose exec backend npm run migrate

# Verify migrations
docker-compose exec backend npm run migrate:status
```

### Step 7: Create Admin User

```bash
# Connect to database
docker-compose exec postgres psql -U labtech -d labtech_geolab

# Create admin user
INSERT INTO users (username, email, password_hash, role, mfa_enabled)
VALUES ('admin', 'admin@labtech-geolab.com', '<bcrypt-hash>', 'admin', false);

# Exit psql
\q
```

Generate password hash:

```bash
docker-compose exec backend node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('YourSecurePassword', 10).then(hash => console.log(hash));
"
```

### Step 8: Verify Deployment

```bash
# Test API health
curl http://localhost:3000/api/v1/health

# Test database connection
docker-compose exec backend npm run db:test

# Test Redis connection
docker-compose exec redis redis-cli -a ${REDIS_PASSWORD} ping
```

## Configuration

### docker-compose.yml

The main Docker Compose configuration:

```yaml
version: '3.8'

services:
  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: labtech-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=${NODE_ENV}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend/logs:/app/logs
      - ./backend/keys:/app/keys:ro
    networks:
      - labtech-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: labtech-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backend/migrations:/docker-entrypoint-initdb.d:ro
    networks:
      - labtech-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: labtech-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - labtech-network
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: labtech-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./www:/usr/share/nginx/html:ro
    depends_on:
      - backend
    networks:
      - labtech-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres-data:
    driver: local
  redis-data:
    driver: local

networks:
  labtech-network:
    driver: bridge
```

### Nginx Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # API proxy
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Auth endpoints with stricter rate limiting
        location /api/v1/auth/ {
            limit_req zone=auth_limit burst=5 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket support
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # Static files
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

### Backend Dockerfile

Optimized multi-stage Dockerfile:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

## Production Deployment

### Using Docker Compose (Production)

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  postgres:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  redis:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

Deploy:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Using Docker Swarm

Initialize Swarm:

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml labtech

# List services
docker stack services labtech

# Scale service
docker service scale labtech_backend=5

# View logs
docker service logs -f labtech_backend
```

## Monitoring and Maintenance

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend

# Since timestamp
docker-compose logs --since 2024-01-15T10:00:00 backend
```

### Monitor Resources

```bash
# View resource usage
docker stats

# View specific container
docker stats labtech-backend

# Export metrics
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U labtech labtech_geolab > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose exec -T postgres psql -U labtech labtech_geolab < backup_20240115.sql

# Automated backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U labtech labtech_geolab | gzip > ${BACKUP_DIR}/backup_${DATE}.sql.gz
find ${BACKUP_DIR} -name "backup_*.sql.gz" -mtime +30 -delete
EOF

chmod +x backup.sh

# Schedule with cron
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild images
docker-compose build

# Restart services with zero downtime
docker-compose up -d --no-deps --build backend

# Or restart all services
docker-compose down
docker-compose up -d
```

### Clean Up

```bash
# Remove stopped containers
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Clean up unused images
docker image prune -a

# Clean up everything
docker system prune -a --volumes
```

## Troubleshooting

### Issue: Container won't start

**Solutions**:

```bash
# Check logs
docker-compose logs backend

# Check container status
docker-compose ps

# Inspect container
docker inspect labtech-backend

# Try starting manually
docker-compose up backend
```

### Issue: Database connection failed

**Solutions**:

```bash
# Check if postgres is running
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres

# Test connection
docker-compose exec backend node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => console.log('Connected')).catch(console.error);
"

# Restart postgres
docker-compose restart postgres
```

### Issue: Out of disk space

**Solutions**:

```bash
# Check disk usage
df -h

# Check Docker disk usage
docker system df

# Clean up
docker system prune -a --volumes

# Remove old logs
find /var/lib/docker/containers -name "*.log" -mtime +7 -delete
```

### Issue: High memory usage

**Solutions**:

```bash
# Check memory usage
docker stats

# Limit container memory
docker-compose up -d --scale backend=2 --memory="1g"

# Or in docker-compose.yml:
services:
  backend:
    mem_limit: 1g
    memswap_limit: 1g
```

### Issue: SSL certificate errors

**Solutions**:

```bash
# Verify certificate files
ls -la ssl/

# Test certificate
openssl x509 -in ssl/fullchain.pem -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew

# Restart nginx
docker-compose restart nginx
```

## Kubernetes Deployment

For production at scale, use Kubernetes:

### Prerequisites

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace labtech

# Create secrets
kubectl create secret generic labtech-secrets \
  --from-literal=database-password=<password> \
  --from-literal=redis-password=<password> \
  --from-literal=jwt-secret=<secret> \
  -n labtech

# Apply manifests
kubectl apply -f k8s/ -n labtech

# Check status
kubectl get pods -n labtech

# View logs
kubectl logs -f deployment/labtech-backend -n labtech
```

See `k8s/` directory for Kubernetes manifests.

## Next Steps

1. **Set up monitoring**: Install Prometheus and Grafana
2. **Configure backups**: Automate database backups
3. **Implement CI/CD**: Use GitHub Actions for automated deployments
4. **Security hardening**: Enable firewall, fail2ban
5. **Load balancing**: Set up HAProxy or Traefik
6. **High availability**: Deploy across multiple nodes

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)
- [Redis Docker](https://hub.docker.com/_/redis)

## Support

For deployment issues:
- GitHub Issues: [github.com/your-org/labtech-geolab/issues](https://github.com/your-org/labtech-geolab/issues)
- Email: devops@labtech-geolab.com
