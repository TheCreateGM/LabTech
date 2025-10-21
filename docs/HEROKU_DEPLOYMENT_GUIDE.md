# Heroku Deployment Guide

Complete guide for deploying the LabTech GeoLab User Tracking System on Heroku.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Step-by-Step Deployment](#step-by-step-deployment)
- [Configuration](#configuration)
- [Add-ons Setup](#add-ons-setup)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)
- [Cost Estimation](#cost-estimation)

## Prerequisites

### Required Tools

1. **Heroku CLI**
   ```bash
   # Install Heroku CLI (Linux/Mac)
   curl https://cli-assets.heroku.com/install.sh | sh
   
   # Verify installation
   heroku --version
   ```

2. **Git**
   ```bash
   git --version
   ```

3. **Node.js** (version 18.x or later)
   ```bash
   node --version
   npm --version
   ```

### Heroku Account

1. Sign up at [heroku.com](https://signup.heroku.com/)
2. Verify your email
3. Add payment method (required for add-ons)

### Login to Heroku

```bash
heroku login
```

This opens a browser for authentication.

## Quick Start

For a rapid deployment, use our automated setup script:

```bash
cd deployment/heroku
chmod +x setup.sh
./setup.sh
```

The script will:
- Create Heroku app
- Add required add-ons
- Set environment variables
- Deploy the application
- Run database migrations

## Step-by-Step Deployment

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/labtech-geolab.git
cd labtech-geolab
```

### Step 2: Create Heroku App

```bash
# Create app with specific region
heroku create labtech-geolab --region us

# Or let Heroku choose the name
heroku create --region us
```

**Available regions:**
- `us` - United States
- `eu` - Europe
- `ap` - Asia Pacific

### Step 3: Add PostgreSQL Database

```bash
# Add Heroku Postgres (Standard 0 plan)
heroku addons:create heroku-postgresql:standard-0

# Wait for provisioning
heroku pg:wait

# Verify database
heroku pg:info
```

**Database Plans:**
- `mini` - $5/month, 10GB storage
- `basic` - $9/month, 10GB storage
- `standard-0` - $50/month, 64GB storage (recommended)
- `standard-2` - $200/month, 256GB storage

### Step 4: Add Redis

```bash
# Add Heroku Redis (Premium 0 plan)
heroku addons:create heroku-redis:premium-0

# Verify Redis
heroku redis:info
```

**Redis Plans:**
- `hobby-dev` - Free, 25MB (development only)
- `premium-0` - $15/month, 100MB (recommended)
- `premium-1` - $60/month, 1GB

### Step 5: Configure Environment Variables

```bash
# Set Node.js version
heroku config:set NODE_ENV=production

# Set JWT secrets
heroku config:set JWT_SECRET=$(openssl rand -base64 32)

# Set encryption key
heroku config:set ENCRYPTION_KEY=$(openssl rand -hex 32)

# Set CORS origin
heroku config:set CORS_ORIGIN=https://labtech-geolab.herokuapp.com

# Set API version
heroku config:set API_VERSION=v1

# View all config vars
heroku config
```

### Step 6: Generate RSA Keys for JWT

```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Generate public key
openssl rsa -in private.pem -pubout -out public.pem

# Set as config vars (base64 encoded)
heroku config:set JWT_PRIVATE_KEY=$(cat private.pem | base64 -w 0)
heroku config:set JWT_PUBLIC_KEY=$(cat public.pem | base64 -w 0)

# Clean up local keys
rm private.pem public.pem
```

### Step 7: Configure Buildpacks

```bash
# Add Node.js buildpack
heroku buildpacks:add heroku/nodejs

# Verify buildpacks
heroku buildpacks
```

### Step 8: Deploy Application

```bash
# Deploy from main branch
git push heroku main

# Or deploy from a different branch
git push heroku develop:main
```

Heroku will:
- Detect Node.js application
- Install dependencies
- Build the application
- Start the web process

### Step 9: Run Database Migrations

```bash
# Run migrations
heroku run npm run migrate

# Verify migrations
heroku run npm run migrate:status
```

### Step 10: Scale Dynos

```bash
# Scale web dynos
heroku ps:scale web=2

# Scale worker dynos (if needed)
heroku ps:scale worker=1

# Check dyno status
heroku ps
```

### Step 11: Open Application

```bash
# Open in browser
heroku open

# Test API
curl https://labtech-geolab.herokuapp.com/api/v1/health
```

## Configuration

### Procfile

The `Procfile` defines process types:

```
web: npm run start:prod
worker: npm run worker:start
release: npm run migrate
```

- **web**: Main application server
- **worker**: Background job processor
- **release**: Runs before each deployment

### app.json

The `app.json` file configures the app:

```json
{
  "name": "LabTech GeoLab",
  "description": "User tracking and monitoring system",
  "repository": "https://github.com/your-org/labtech-geolab",
  "keywords": ["node", "express", "postgresql", "tracking"],
  "buildpacks": [
    {
      "url": "heroku/nodejs"
    }
  ],
  "formation": {
    "web": {
      "quantity": 2,
      "size": "standard-1x"
    },
    "worker": {
      "quantity": 1,
      "size": "standard-1x"
    }
  },
  "addons": [
    {
      "plan": "heroku-postgresql:standard-0"
    },
    {
      "plan": "heroku-redis:premium-0"
    },
    {
      "plan": "papertrail:choklad"
    },
    {
      "plan": "scheduler:standard"
    }
  ],
  "env": {
    "NODE_ENV": {
      "value": "production"
    },
    "API_VERSION": {
      "value": "v1"
    },
    "JWT_SECRET": {
      "generator": "secret"
    },
    "ENCRYPTION_KEY": {
      "generator": "secret"
    }
  }
}
```

### Environment Variables

Complete list of required environment variables:

```bash
# Application
NODE_ENV=production
PORT=3000  # Automatically set by Heroku
API_VERSION=v1

# Database (automatically set by Heroku Postgres)
DATABASE_URL=postgresql://...
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# Redis (automatically set by Heroku Redis)
REDIS_URL=redis://...

# JWT
JWT_SECRET=<generated-secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
JWT_PRIVATE_KEY=<base64-encoded-private-key>
JWT_PUBLIC_KEY=<base64-encoded-public-key>

# Encryption
ENCRYPTION_KEY=<generated-key>

# CORS
CORS_ORIGIN=https://labtech-geolab.herokuapp.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring (optional)
SENTRY_DSN=<your-sentry-dsn>
```

Set all variables at once:

```bash
heroku config:set \
  NODE_ENV=production \
  API_VERSION=v1 \
  JWT_ACCESS_EXPIRY=15m \
  JWT_REFRESH_EXPIRY=7d \
  DATABASE_POOL_MIN=5 \
  DATABASE_POOL_MAX=20 \
  RATE_LIMIT_WINDOW_MS=60000 \
  RATE_LIMIT_MAX_REQUESTS=100
```

## Add-ons Setup

### Papertrail (Logging)

```bash
# Add Papertrail
heroku addons:create papertrail:choklad

# View logs
heroku addons:open papertrail

# Or use CLI
heroku logs --tail
```

**Plans:**
- `choklad` - Free, 50MB/month, 7-day retention
- `fixa` - $7/month, 100MB/month, 7-day retention
- `trams` - $25/month, 1GB/month, 7-day retention

### Heroku Scheduler (Cron Jobs)

```bash
# Add Scheduler
heroku addons:create scheduler:standard

# Open scheduler dashboard
heroku addons:open scheduler
```

Configure jobs in the dashboard:
- **Daily Backup**: `npm run backup:create` at 2:00 AM UTC
- **Cleanup Old Backups**: `npm run backup:cleanup` at 3:00 AM UTC
- **Generate Reports**: `npm run reports:generate` at 4:00 AM UTC

### New Relic (APM)

```bash
# Add New Relic
heroku addons:create newrelic:wayne

# Configure New Relic
heroku config:set NEW_RELIC_APP_NAME="LabTech GeoLab"
heroku config:set NEW_RELIC_LOG=stdout

# View APM dashboard
heroku addons:open newrelic
```

### Sentry (Error Tracking)

```bash
# Set Sentry DSN
heroku config:set SENTRY_DSN=https://...@sentry.io/...

# Verify Sentry integration
heroku run node -e "require('./dist/utils/sentry').testSentry()"
```

## Monitoring and Maintenance

### View Logs

```bash
# Tail logs
heroku logs --tail

# View last 1000 lines
heroku logs -n 1000

# Filter by dyno
heroku logs --dyno web.1

# Filter by source
heroku logs --source app
```

### Monitor Dynos

```bash
# Check dyno status
heroku ps

# Restart all dynos
heroku restart

# Restart specific dyno
heroku restart web.1

# Stop dynos
heroku ps:stop web.1
```

### Database Management

```bash
# Connect to database
heroku pg:psql

# View database info
heroku pg:info

# Create backup
heroku pg:backups:capture

# List backups
heroku pg:backups

# Download backup
heroku pg:backups:download

# Restore from backup
heroku pg:backups:restore b001 DATABASE_URL
```

### Redis Management

```bash
# View Redis info
heroku redis:info

# Connect to Redis CLI
heroku redis:cli

# View Redis stats
heroku redis:stats

# Clear Redis cache
heroku redis:cli --confirm labtech-geolab
> FLUSHALL
```

### Scaling

```bash
# Scale web dynos
heroku ps:scale web=3

# Scale worker dynos
heroku ps:scale worker=2

# Scale to zero (stop)
heroku ps:scale web=0

# Auto-scaling (requires Performance dynos)
heroku ps:autoscale:enable web --min 2 --max 10 --p95 500
```

### Maintenance Mode

```bash
# Enable maintenance mode
heroku maintenance:on

# Disable maintenance mode
heroku maintenance:off

# Check status
heroku maintenance
```

## Troubleshooting

### Issue: Application crashes on startup

**Symptoms**: `State changed from starting to crashed`

**Solutions**:

1. Check logs:
   ```bash
   heroku logs --tail
   ```

2. Verify Procfile:
   ```bash
   cat Procfile
   ```

3. Test locally:
   ```bash
   heroku local web
   ```

4. Check environment variables:
   ```bash
   heroku config
   ```

### Issue: Database connection errors

**Symptoms**: `ECONNREFUSED` or `Connection timeout`

**Solutions**:

1. Verify DATABASE_URL:
   ```bash
   heroku config:get DATABASE_URL
   ```

2. Check database status:
   ```bash
   heroku pg:info
   ```

3. Test connection:
   ```bash
   heroku run node -e "require('pg').Client({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}}).connect().then(()=>console.log('OK'))"
   ```

4. Restart dynos:
   ```bash
   heroku restart
   ```

### Issue: Out of memory

**Symptoms**: `R14 - Memory quota exceeded`

**Solutions**:

1. Check memory usage:
   ```bash
   heroku logs --tail | grep "R14"
   ```

2. Upgrade dyno type:
   ```bash
   heroku ps:type web=standard-2x
   ```

3. Optimize Node.js memory:
   ```bash
   heroku config:set NODE_OPTIONS="--max-old-space-size=2048"
   ```

### Issue: Slow response times

**Symptoms**: `H12 - Request timeout`

**Solutions**:

1. Check dyno metrics:
   ```bash
   heroku logs --tail | grep "H12"
   ```

2. Scale up dynos:
   ```bash
   heroku ps:scale web=3
   ```

3. Enable preboot:
   ```bash
   heroku features:enable preboot
   ```

4. Optimize database queries

### Issue: SSL certificate errors

**Symptoms**: Certificate validation failed

**Solutions**:

1. Use Heroku's automatic SSL:
   ```bash
   heroku certs:auto:enable
   ```

2. Add custom domain:
   ```bash
   heroku domains:add www.labtech-geolab.com
   ```

3. Update DNS records as instructed

### Issue: Build failures

**Symptoms**: Build fails during deployment

**Solutions**:

1. Check build logs:
   ```bash
   heroku builds:info
   ```

2. Clear build cache:
   ```bash
   heroku plugins:install heroku-builds
   heroku builds:cache:purge
   ```

3. Verify package.json:
   ```bash
   npm install
   npm run build
   ```

## Cost Estimation

### Monthly Cost Breakdown

| Component | Plan | Monthly Cost |
|-----------|------|--------------|
| Dynos (web x2) | Standard-1X | $50 |
| Dynos (worker x1) | Standard-1X | $25 |
| PostgreSQL | Standard-0 | $50 |
| Redis | Premium-0 | $15 |
| Papertrail | Choklad | Free |
| Scheduler | Standard | Free |
| **Total** | | **$140/month** |

### Dyno Types and Pricing

| Type | RAM | CPU | Price/month |
|------|-----|-----|-------------|
| Free | 512MB | 1x | $0 (sleeps after 30min) |
| Hobby | 512MB | 1x | $7 |
| Standard-1X | 512MB | 1x | $25 |
| Standard-2X | 1GB | 2x | $50 |
| Performance-M | 2.5GB | 4x | $250 |
| Performance-L | 14GB | 8x | $500 |

### Cost Optimization Tips

1. **Use fewer dynos**: Start with 1 web dyno for low traffic
2. **Downgrade add-ons**: Use hobby plans for development
3. **Enable preboot**: Reduce dyno restarts
4. **Use CDN**: Offload static assets to CloudFront
5. **Optimize queries**: Reduce database load
6. **Monitor usage**: Use Heroku metrics to right-size

### Scaling Costs

- **Low traffic** (< 1000 users/day): $50/month (1 web dyno, mini DB)
- **Medium traffic** (< 10,000 users/day): $140/month (2 web dynos, standard DB)
- **High traffic** (< 100,000 users/day): $400/month (5 web dynos, premium DB)

## Advanced Configuration

### Custom Domain

```bash
# Add custom domain
heroku domains:add www.labtech-geolab.com

# Get DNS target
heroku domains

# Update DNS records
# CNAME: www -> <heroku-dns-target>
# ALIAS: @ -> <heroku-dns-target>

# Enable automatic SSL
heroku certs:auto:enable
```

### Review Apps

Enable review apps for pull requests:

```bash
# Enable review apps
heroku pipelines:create labtech-geolab --stage production

# Configure in app.json
{
  "environments": {
    "review": {
      "addons": [
        "heroku-postgresql:hobby-dev",
        "heroku-redis:hobby-dev"
      ],
      "formation": {
        "web": {
          "quantity": 1,
          "size": "hobby"
        }
      }
    }
  }
}
```

### CI/CD with GitHub

```bash
# Connect to GitHub
heroku git:remote -a labtech-geolab

# Enable GitHub integration
heroku pipelines:connect labtech-geolab

# Enable auto-deploy
heroku pipelines:promote -r production
```

### Monitoring with Datadog

```bash
# Add Datadog buildpack
heroku buildpacks:add --index 1 https://github.com/DataDog/heroku-buildpack-datadog.git

# Set Datadog API key
heroku config:set DD_API_KEY=<your-api-key>

# Enable APM
heroku config:set DD_APM_ENABLED=true
```

## Deployment Checklist

Before going to production:

- [ ] Set all environment variables
- [ ] Configure custom domain
- [ ] Enable SSL certificates
- [ ] Set up database backups
- [ ] Configure monitoring (Papertrail, New Relic)
- [ ] Set up error tracking (Sentry)
- [ ] Scale dynos appropriately
- [ ] Test all API endpoints
- [ ] Run load tests
- [ ] Document runbooks
- [ ] Set up alerts
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Test disaster recovery

## Next Steps

1. **Set up CI/CD**: Automate deployments with GitHub Actions
2. **Configure monitoring**: Set up alerts and dashboards
3. **Implement caching**: Use Redis for session storage
4. **Optimize performance**: Profile and optimize slow queries
5. **Security hardening**: Enable WAF, implement security headers
6. **Load testing**: Test with 1000+ concurrent users

## Additional Resources

- [Heroku Dev Center](https://devcenter.heroku.com/)
- [Heroku CLI Reference](https://devcenter.heroku.com/articles/heroku-cli)
- [Heroku Postgres](https://devcenter.heroku.com/articles/heroku-postgresql)
- [Heroku Redis](https://devcenter.heroku.com/articles/heroku-redis)
- [Heroku Metrics](https://devcenter.heroku.com/articles/metrics)

## Support

For deployment issues:
- Heroku Support: [help.heroku.com](https://help.heroku.com)
- Project Issues: [github.com/your-org/labtech-geolab/issues](https://github.com/your-org/labtech-geolab/issues)
- Email: devops@labtech-geolab.com
