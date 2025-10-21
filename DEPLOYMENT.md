# LabTech GeoLab Deployment Guide

This document provides an overview of all deployment options and configurations for the LabTech GeoLab application.

## Deployment Options

LabTech GeoLab supports three deployment strategies:

1. **Docker Compose** - Local development and self-hosted deployments
2. **Heroku** - Quick cloud deployment with managed services
3. **AWS** - Enterprise-grade infrastructure with full control

## Quick Start

### Docker Compose (Recommended for Development)

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access the application at `http://localhost:8080`

### Heroku (Recommended for Quick Production)

```bash
# Run automated setup script
./deployment/heroku/setup.sh

# Or manually:
heroku create labtech-geolab
heroku addons:create heroku-postgresql:standard-0
heroku addons:create heroku-redis:premium-0
git push heroku main
```

See [deployment/heroku/README.md](deployment/heroku/README.md) for detailed instructions.

### AWS (Recommended for Enterprise)

```bash
# Configure AWS credentials
aws configure

# Initialize Terraform
cd deployment/aws/terraform
terraform init

# Deploy infrastructure
terraform apply

# Deploy application
ssh ec2-user@<instance-ip>
./deploy-ec2.sh
```

See [deployment/aws/README.md](deployment/aws/README.md) for detailed instructions.

## Architecture Overview

### Docker Architecture

```
┌─────────────────────────────────────────────┐
│  Nginx Reverse Proxy (Port 80/443)         │
└─────────────┬───────────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼────┐         ┌────▼────┐
│Frontend│         │ Backend │
│(Nginx) │         │(Node.js)│
│Port 8080│        │Port 3000│
└────────┘         └────┬────┘
                        │
              ┌─────────┴─────────┐
              │                   │
         ┌────▼─────┐      ┌─────▼────┐
         │PostgreSQL│      │  Redis   │
         │Port 5432 │      │Port 6379 │
         └──────────┘      └──────────┘
```

### Heroku Architecture

```
┌──────────────────────────────────────────┐
│  Heroku Router (SSL/TLS)                 │
└─────────────┬────────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼────┐         ┌────▼────┐
│Web Dyno│         │Worker   │
│(2x)    │         │Dyno (1x)│
└────┬───┘         └────┬────┘
     │                  │
     └────────┬─────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼──────────┐  ┌─────▼────────┐
│Heroku        │  │Heroku Redis  │
│Postgres      │  │              │
└──────────────┘  └──────────────┘
```

### AWS Architecture

```
┌──────────────────────────────────────────┐
│  Route 53 DNS                            │
└─────────────┬────────────────────────────┘
              │
┌─────────────▼────────────────────────────┐
│  CloudFront CDN                          │
└─────────────┬────────────────────────────┘
              │
┌─────────────▼────────────────────────────┐
│  Application Load Balancer               │
└─────────────┬────────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼────────┐    ┌─────▼────────┐
│EC2 Auto    │    │EC2 Auto      │
│Scaling     │    │Scaling       │
│Group (Web) │    │Group (Worker)│
└────┬───────┘    └─────┬────────┘
     │                  │
     └────────┬─────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼──────────┐  ┌─────▼────────┐
│RDS PostgreSQL│  │ElastiCache   │
│(Multi-AZ)    │  │Redis         │
└──────────────┘  └──────────────┘
```

## Configuration Files

### Docker

- `Dockerfile` - Frontend production image
- `backend/Dockerfile` - Backend production image
- `backend/Dockerfile.dev` - Backend development image
- `docker-compose.yml` - Production services
- `docker-compose.dev.yml` - Development services
- `nginx.conf` - Nginx configuration
- `nginx-default.conf` - Nginx site configuration
- `.dockerignore` - Files to exclude from Docker builds

### Heroku

- `Procfile` - Process definitions (web, worker, release)
- `app.json` - Heroku app configuration and add-ons
- `deployment/heroku/setup.sh` - Automated setup script
- `deployment/heroku/README.md` - Detailed deployment guide

### AWS

- `deployment/aws/terraform/` - Terraform infrastructure as code
  - `main.tf` - Main Terraform configuration
  - `variables.tf` - Input variables
  - `outputs.tf` - Output values
  - `terraform.tfvars.example` - Example variable values
- `deployment/aws/scripts/deploy-ec2.sh` - EC2 deployment script
- `deployment/aws/README.md` - Detailed deployment guide

### CI/CD

- `.github/workflows/ci.yml` - Continuous integration pipeline
- `.github/workflows/deploy-staging.yml` - Staging deployment
- `.github/workflows/deploy-production.yml` - Production deployment
- `.github/workflows/deploy-aws.yml` - AWS deployment
- `.github/workflows/README.md` - CI/CD documentation

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Redis
REDIS_URL=redis://host:6379

# JWT Authentication
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_min_32_chars

# Encryption
ENCRYPTION_KEY=your_encryption_key_32_chars

# Application
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-domain.com
```

### Optional Variables

```bash
# MFA
MFA_ISSUER=LabTech GeoLab

# Logging
LOG_LEVEL=info

# Email (Optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_password
SMTP_FROM=noreply@labtech.com

# AWS (Optional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=labtech-backups

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn
PROMETHEUS_ENABLED=false
```

## Security Considerations

### SSL/TLS

- **Docker**: Configure SSL certificates in nginx
- **Heroku**: Automatic SSL with ACM
- **AWS**: Use ACM certificates with ALB

### Secrets Management

- **Docker**: Use `.env` file (never commit to git)
- **Heroku**: Use `heroku config:set`
- **AWS**: Use AWS Systems Manager Parameter Store

### Database Security

- **Docker**: Use strong passwords, limit network access
- **Heroku**: Automatic encryption at rest
- **AWS**: Enable encryption, use security groups, Multi-AZ

### Application Security

- JWT tokens with RS256 signing
- MFA for admin access
- Rate limiting on all endpoints
- CORS configuration
- Security headers (helmet middleware)
- Input validation and sanitization

## Monitoring and Logging

### Docker

- View logs: `docker-compose logs -f`
- Monitor resources: `docker stats`
- Health checks: Built into docker-compose

### Heroku

- View logs: `heroku logs --tail`
- Metrics: Heroku dashboard
- Add-ons: Papertrail for log aggregation

### AWS

- CloudWatch Logs for application logs
- CloudWatch Metrics for system metrics
- CloudWatch Alarms for alerts
- X-Ray for distributed tracing (optional)

## Backup and Recovery

### Database Backups

- **Docker**: Manual backups with `pg_dump`
- **Heroku**: Automatic daily backups (Standard plans)
- **AWS**: RDS automated backups (30-day retention)

### Application Backups

- **Docker**: Volume backups
- **Heroku**: Git-based deployments
- **AWS**: AMI snapshots, S3 backups

### Disaster Recovery

- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 6 hours
- Regular backup testing
- Documented recovery procedures

## Scaling

### Horizontal Scaling

- **Docker**: Use docker-compose scale or Kubernetes
- **Heroku**: `heroku ps:scale web=3`
- **AWS**: Auto Scaling Groups (automatic)

### Vertical Scaling

- **Docker**: Adjust resource limits in docker-compose
- **Heroku**: `heroku ps:resize web=standard-2x`
- **AWS**: Change instance types in Terraform

### Database Scaling

- **Docker**: Upgrade PostgreSQL resources
- **Heroku**: Upgrade database plan
- **AWS**: RDS instance class, read replicas

## Cost Estimation

### Docker (Self-Hosted)

- Server costs: $20-100/month (VPS)
- Domain: $10-15/year
- SSL certificate: Free (Let's Encrypt)
- **Total**: ~$25-110/month

### Heroku

- Hobby: ~$25/month
- Production: ~$200/month
- Enterprise: ~$500+/month

See [deployment/heroku/README.md](deployment/heroku/README.md) for details.

### AWS

- Development: ~$100/month
- Production: ~$335/month
- Enterprise: ~$1000+/month

See [deployment/aws/README.md](deployment/aws/README.md) for details.

## Troubleshooting

### Common Issues

1. **Application won't start**
   - Check environment variables
   - Verify database connection
   - Check logs for errors

2. **Database connection failed**
   - Verify DATABASE_URL
   - Check network connectivity
   - Verify credentials

3. **High memory usage**
   - Check for memory leaks
   - Increase instance size
   - Enable connection pooling

4. **Slow response times**
   - Enable caching (Redis)
   - Optimize database queries
   - Add database indexes
   - Scale horizontally

### Getting Help

- Check deployment-specific README files
- Review application logs
- Check GitHub Issues
- Contact DevOps team

## Maintenance

### Regular Tasks

- Update dependencies monthly
- Rotate secrets quarterly
- Review security logs weekly
- Test backups monthly
- Update SSL certificates annually

### Updates and Patches

- Security patches: Apply immediately
- Minor updates: Test in staging first
- Major updates: Plan maintenance window

## Next Steps

After deployment:

1. ✅ Configure custom domain
2. ✅ Set up monitoring and alerting
3. ✅ Configure automated backups
4. ✅ Set up CI/CD pipeline
5. ✅ Enable error tracking
6. ✅ Configure APM
7. ✅ Load testing
8. ✅ Security audit

## Support

For deployment issues:

- **Documentation**: Check deployment-specific README files
- **Logs**: Review application and system logs
- **Monitoring**: Check CloudWatch/Heroku metrics
- **Community**: GitHub Discussions
- **Enterprise**: Contact support team

## License

Copyright © 2024 LabTech GeoLab. All rights reserved.
