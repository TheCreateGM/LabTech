# Heroku Deployment Guide

This guide provides step-by-step instructions for deploying LabTech GeoLab to Heroku.

## Prerequisites

- Heroku CLI installed
- Git installed
- Heroku account created
- GitHub repository set up

## Quick Start

### 1. Install Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Ubuntu/Debian
curl https://cli-assets.heroku.com/install-ubuntu.sh | sh

# Windows
# Download installer from https://devcenter.heroku.com/articles/heroku-cli
```

### 2. Login to Heroku

```bash
heroku login
```

### 3. Create Heroku App

```bash
# Create app with a specific name
heroku create labtech-geolab

# Or let Heroku generate a name
heroku create
```

### 4. Add Buildpack

```bash
heroku buildpacks:set heroku/nodejs
```

### 5. Provision Add-ons

```bash
# PostgreSQL database
heroku addons:create heroku-postgresql:standard-0

# Redis cache
heroku addons:create heroku-redis:premium-0

# Papertrail logging
heroku addons:create papertrail:choklad

# Heroku Scheduler for backup jobs
heroku addons:create scheduler:standard
```

### 6. Configure Environment Variables

```bash
# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32 | cut -c1-32)

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET="$JWT_SECRET"
heroku config:set JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
heroku config:set ENCRYPTION_KEY="$ENCRYPTION_KEY"
heroku config:set MFA_ISSUER="LabTech GeoLab"
heroku config:set CORS_ORIGIN="https://labtech-geolab.herokuapp.com"
heroku config:set LOG_LEVEL=info

# Optional: Email configuration
heroku config:set SMTP_HOST="smtp.sendgrid.net"
heroku config:set SMTP_PORT=587
heroku config:set SMTP_USER="apikey"
heroku config:set SMTP_PASSWORD="your-sendgrid-api-key"
heroku config:set SMTP_FROM="noreply@labtech.com"
```

### 7. Deploy Application

```bash
# Add Heroku remote
heroku git:remote -a labtech-geolab

# Deploy to Heroku
git push heroku main

# Or deploy from a different branch
git push heroku develop:main
```

### 8. Run Database Migrations

```bash
# Migrations run automatically via release phase in Procfile
# To run manually:
heroku run npm run migrate --app labtech-geolab
```

### 9. Scale Dynos

```bash
# Scale web dynos
heroku ps:scale web=2

# Scale worker dynos
heroku ps:scale worker=1
```

### 10. Open Application

```bash
heroku open
```

## Configuration Details

### Database Configuration

Heroku automatically sets the `DATABASE_URL` environment variable when you provision PostgreSQL:

```bash
# View database URL
heroku config:get DATABASE_URL

# Access database
heroku pg:psql

# View database info
heroku pg:info
```

### Redis Configuration

Heroku automatically sets the `REDIS_URL` environment variable:

```bash
# View Redis URL
heroku config:get REDIS_URL

# View Redis info
heroku redis:info
```

### Scheduler Configuration

Set up automated backup jobs:

```bash
# Open scheduler dashboard
heroku addons:open scheduler
```

Add the following jobs:

1. **Daily Database Backup** (Daily at 2:00 AM UTC)
   ```bash
   cd backend && npm run backup:database
   ```

2. **Weekly Cleanup** (Weekly on Sunday at 3:00 AM UTC)
   ```bash
   cd backend && npm run cleanup:old-logs
   ```

## Monitoring and Logging

### View Logs

```bash
# View recent logs
heroku logs --tail

# View logs from specific dyno
heroku logs --dyno web.1 --tail

# View logs from Papertrail
heroku addons:open papertrail
```

### Monitor Application

```bash
# View dyno status
heroku ps

# View metrics
heroku metrics

# Open metrics dashboard
heroku addons:open librato
```

### Application Performance Monitoring

Consider adding New Relic or other APM tools:

```bash
heroku addons:create newrelic:wayne
```

## Scaling

### Horizontal Scaling

```bash
# Scale web dynos
heroku ps:scale web=3

# Scale worker dynos
heroku ps:scale worker=2
```

### Vertical Scaling

```bash
# Upgrade to performance dynos
heroku ps:resize web=performance-m
heroku ps:resize worker=performance-m
```

### Auto-scaling

Enable auto-scaling for production:

```bash
heroku ps:autoscale:enable web --min 2 --max 10 --p95 200
```

## Database Management

### Backups

```bash
# Create manual backup
heroku pg:backups:capture

# List backups
heroku pg:backups

# Download backup
heroku pg:backups:download

# Restore from backup
heroku pg:backups:restore b001 DATABASE_URL
```

### Maintenance

```bash
# Enable maintenance mode
heroku maintenance:on

# Disable maintenance mode
heroku maintenance:off

# Run migrations during maintenance
heroku maintenance:on
heroku run npm run migrate
heroku maintenance:off
```

## CI/CD Integration

### GitHub Integration

1. Go to Heroku Dashboard
2. Select your app
3. Go to "Deploy" tab
4. Connect to GitHub repository
5. Enable automatic deploys from main branch
6. Enable "Wait for CI to pass before deploy"

### Manual Deploy from CLI

```bash
# Deploy specific branch
git push heroku feature-branch:main

# Deploy with build cache cleared
heroku builds:cache:purge
git push heroku main
```

## Environment Management

### Staging Environment

```bash
# Create staging app
heroku create labtech-geolab-staging

# Add staging remote
git remote add staging https://git.heroku.com/labtech-geolab-staging.git

# Deploy to staging
git push staging main

# Promote staging to production
heroku pipelines:promote -a labtech-geolab-staging
```

### Review Apps

Enable review apps for pull requests:

1. Create `app.json` (already included)
2. Go to Heroku Dashboard > Pipeline
3. Enable Review Apps
4. Configure to create review apps for PRs

## Troubleshooting

### Application Crashes

```bash
# View crash logs
heroku logs --tail --dyno web.1

# Restart dynos
heroku restart

# Check dyno status
heroku ps
```

### Database Connection Issues

```bash
# Check database status
heroku pg:info

# Test database connection
heroku pg:psql -c "SELECT 1"

# Reset database (WARNING: deletes all data)
heroku pg:reset DATABASE_URL
```

### Memory Issues

```bash
# View memory usage
heroku logs --tail | grep "Error R14"

# Upgrade dyno size
heroku ps:resize web=standard-2x
```

### Build Failures

```bash
# Clear build cache
heroku builds:cache:purge

# View build logs
heroku builds:info

# Retry build
git commit --allow-empty -m "Trigger rebuild"
git push heroku main
```

## Performance Optimization

### Enable HTTP/2

```bash
heroku labs:enable http-session-affinity
```

### Enable Preboot

```bash
heroku features:enable preboot
```

### Configure Connection Pooling

For PostgreSQL connection pooling:

```bash
heroku addons:create pgbouncer
```

## Security

### SSL/TLS

Heroku provides automatic SSL for all apps:

```bash
# View SSL certificate info
heroku certs:info

# Enable automated certificate management (ACM)
heroku certs:auto:enable
```

### Security Headers

Security headers are configured in the application code (helmet middleware).

### Secrets Management

```bash
# Rotate JWT secrets
NEW_JWT_SECRET=$(openssl rand -base64 32)
heroku config:set JWT_SECRET="$NEW_JWT_SECRET"

# View all config vars
heroku config

# Remove config var
heroku config:unset VARIABLE_NAME
```

## Cost Optimization

### Estimated Monthly Costs

- **Hobby Tier**: ~$25/month
  - Hobby dynos (web + worker): $14
  - Heroku Postgres Mini: $5
  - Heroku Redis Mini: $3
  - Papertrail: Free

- **Production Tier**: ~$200/month
  - Standard-1X dynos (2 web + 1 worker): $75
  - Heroku Postgres Standard-0: $50
  - Heroku Redis Premium-0: $60
  - Papertrail: $7
  - Scheduler: Free

- **Enterprise Tier**: ~$500+/month
  - Performance-M dynos (3 web + 2 worker): $250
  - Heroku Postgres Standard-2: $200
  - Heroku Redis Premium-2: $120
  - Additional monitoring tools: $50+

### Cost Reduction Tips

1. Use fewer dynos during off-peak hours
2. Enable auto-scaling to scale down when not needed
3. Use hobby tier for development/staging
4. Optimize database queries to use smaller database plans
5. Use CDN for static assets

## Backup and Recovery

### Automated Backups

Heroku Postgres Standard plans include automated daily backups:

```bash
# View backup schedule
heroku pg:backups:schedules

# Schedule backups (if not automatic)
heroku pg:backups:schedule DATABASE_URL --at '02:00 America/Los_Angeles'
```

### Manual Backups

```bash
# Create backup
heroku pg:backups:capture

# Download backup
heroku pg:backups:download b001

# Restore backup
heroku pg:backups:restore b001 DATABASE_URL --confirm labtech-geolab
```

### Disaster Recovery

```bash
# Create follower database for read replicas
heroku addons:create heroku-postgresql:standard-0 --follow DATABASE_URL

# Promote follower to primary (in case of failure)
heroku pg:promote HEROKU_POSTGRESQL_FOLLOWER_URL
```

## Useful Commands

```bash
# View app info
heroku info

# View releases
heroku releases

# Rollback to previous release
heroku rollback

# Run one-off commands
heroku run bash
heroku run npm run migrate

# Access Rails console (if applicable)
heroku run node

# View config vars
heroku config

# Restart app
heroku restart

# View dyno status
heroku ps

# View logs
heroku logs --tail
```

## Support and Resources

- [Heroku Dev Center](https://devcenter.heroku.com/)
- [Heroku Status](https://status.heroku.com/)
- [Heroku Support](https://help.heroku.com/)
- [Node.js on Heroku](https://devcenter.heroku.com/categories/nodejs-support)

## Next Steps

After deployment:

1. Configure custom domain
2. Set up monitoring and alerting
3. Configure automated backups
4. Set up CI/CD pipeline
5. Enable review apps for PRs
6. Configure staging environment
7. Set up error tracking (Sentry)
8. Configure APM (New Relic)
