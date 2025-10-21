# GitHub Actions CI/CD Workflows

This directory contains GitHub Actions workflows for continuous integration and deployment of LabTech GeoLab.

## Workflows

### 1. CI Pipeline (`ci.yml`)

Runs on every push and pull request to `main` and `develop` branches.

**Jobs:**
- **lint-backend**: ESLint and TypeScript checks for backend
- **lint-frontend**: ESLint and TypeScript checks for frontend
- **test-backend**: Unit and integration tests with PostgreSQL and Redis
- **test-frontend**: Unit tests for Angular components
- **build-backend**: Build TypeScript backend
- **build-frontend**: Build Angular production bundle
- **security-scan**: Trivy vulnerability scanning and npm audit
- **docker-build**: Build and push Docker images to Docker Hub
- **notify**: Send Slack notifications

**Required Secrets:**
- `DOCKER_USERNAME`: Docker Hub username
- `DOCKER_PASSWORD`: Docker Hub password
- `SLACK_WEBHOOK_URL`: Slack webhook URL (optional)

### 2. Deploy to Staging (`deploy-staging.yml`)

Runs on pull requests to `main` branch.

**Jobs:**
- Deploy to Heroku staging environment
- Run database migrations
- Health check
- Comment on PR with staging URL
- Notify Slack

**Required Secrets:**
- `HEROKU_API_KEY`: Heroku API key
- `HEROKU_STAGING_APP_NAME`: Heroku staging app name
- `SLACK_WEBHOOK_URL`: Slack webhook URL (optional)

### 3. Deploy to Production (`deploy-production.yml`)

Runs on push to `main` branch.

**Jobs:**
- Deploy to Heroku production environment
- Run database migrations
- Health check
- Create GitHub release
- Send notifications (Slack and email)

**Required Secrets:**
- `HEROKU_API_KEY`: Heroku API key
- `HEROKU_PRODUCTION_APP_NAME`: Heroku production app name
- `SLACK_WEBHOOK_URL`: Slack webhook URL (optional)
- `EMAIL_TO`: Email address for notifications (optional)
- `SMTP_HOST`: SMTP server host (optional)
- `SMTP_PORT`: SMTP server port (optional)
- `SMTP_USER`: SMTP username (optional)
- `SMTP_PASSWORD`: SMTP password (optional)
- `SMTP_FROM`: Email sender address (optional)

### 4. Deploy to AWS (`deploy-aws.yml`)

Manual workflow dispatch for AWS deployments.

**Jobs:**
- Build and push Docker images to Amazon ECR
- Run Terraform to provision/update infrastructure
- Trigger Auto Scaling Group instance refresh
- Health check
- Notify Slack

**Required Secrets:**
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `SLACK_WEBHOOK_URL`: Slack webhook URL (optional)

## Setup Instructions

### 1. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

#### Required for CI:
```
DOCKER_USERNAME=your_docker_username
DOCKER_PASSWORD=your_docker_password
```

#### Required for Heroku Deployment:
```
HEROKU_API_KEY=your_heroku_api_key
HEROKU_STAGING_APP_NAME=labtech-geolab-staging
HEROKU_PRODUCTION_APP_NAME=labtech-geolab
```

#### Required for AWS Deployment:
```
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

#### Optional for Notifications:
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
EMAIL_TO=alerts@example.com
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
SMTP_FROM=noreply@labtech.com
```

### 2. Configure GitHub Environments

Go to your GitHub repository → Settings → Environments

Create the following environments:

#### Staging Environment
- **Name**: `staging`
- **Deployment branches**: Selected branches → `main`
- **Environment secrets**: (same as repository secrets)

#### Production Environment
- **Name**: `production`
- **Deployment branches**: Selected branches → `main`
- **Required reviewers**: Add team members who must approve production deployments
- **Wait timer**: 5 minutes (optional)
- **Environment secrets**: (same as repository secrets)

### 3. Enable GitHub Actions

Go to your GitHub repository → Settings → Actions → General

- **Actions permissions**: Allow all actions and reusable workflows
- **Workflow permissions**: Read and write permissions
- **Allow GitHub Actions to create and approve pull requests**: ✓

### 4. Configure Branch Protection

Go to your GitHub repository → Settings → Branches

Add branch protection rule for `main`:

- **Require a pull request before merging**: ✓
- **Require approvals**: 1
- **Require status checks to pass before merging**: ✓
  - Select: `lint-backend`, `lint-frontend`, `test-backend`, `test-frontend`, `build-backend`, `build-frontend`
- **Require branches to be up to date before merging**: ✓
- **Include administrators**: ✓

## Workflow Triggers

### Automatic Triggers

- **Push to `main`**: Runs CI + Production deployment
- **Push to `develop`**: Runs CI only
- **Pull request to `main`**: Runs CI + Staging deployment
- **Pull request to `develop`**: Runs CI only

### Manual Triggers

- **AWS Deployment**: Go to Actions → Deploy to AWS → Run workflow
  - Select environment (staging/production)
  - Click "Run workflow"

## Monitoring Deployments

### View Workflow Runs

Go to your GitHub repository → Actions

- View all workflow runs
- Click on a run to see detailed logs
- Download artifacts (build outputs, test results)

### View Deployment Status

Go to your GitHub repository → Deployments

- View deployment history
- See active deployments
- View deployment URLs

### Slack Notifications

If configured, you'll receive Slack notifications for:
- CI pipeline status
- Staging deployments
- Production deployments (success/failure)
- AWS deployments

### Email Notifications

If configured, you'll receive email notifications for:
- Production deployment success
- Production deployment failure

## Troubleshooting

### Workflow Fails on Lint

```bash
# Run locally to fix
npm run lint -- --fix
git add .
git commit -m "Fix linting errors"
git push
```

### Workflow Fails on Tests

```bash
# Run tests locally
npm test

# Fix failing tests
# Commit and push
```

### Workflow Fails on Build

```bash
# Run build locally
npm run build

# Check for TypeScript errors
npm run type-check

# Fix errors and push
```

### Deployment Fails

1. Check workflow logs in GitHub Actions
2. Check application logs:
   - Heroku: `heroku logs --tail -a app-name`
   - AWS: Check CloudWatch logs
3. Verify environment variables are set correctly
4. Check database migrations ran successfully

### Docker Build Fails

1. Test Docker build locally:
   ```bash
   docker build -t test-backend -f backend/Dockerfile backend/
   docker build -t test-frontend -f Dockerfile .
   ```
2. Check Dockerfile syntax
3. Verify all dependencies are installed

## Best Practices

1. **Always create pull requests** for changes
2. **Wait for CI to pass** before merging
3. **Review staging deployment** before merging to main
4. **Monitor production deployments** after merge
5. **Rollback if issues occur**: `heroku rollback -a app-name`
6. **Keep secrets secure**: Never commit secrets to repository
7. **Update dependencies regularly**: Run `npm audit fix`
8. **Test locally first**: Run tests and builds before pushing

## Customization

### Add New Workflow

1. Create new file in `.github/workflows/`
2. Define workflow triggers and jobs
3. Add required secrets to GitHub
4. Test workflow on feature branch

### Modify Existing Workflow

1. Edit workflow file
2. Test changes on feature branch
3. Create pull request
4. Merge after review

### Add New Environment

1. Create environment in GitHub Settings
2. Add environment-specific secrets
3. Update workflow to use new environment
4. Configure deployment protection rules

## Support

For issues with workflows:
1. Check workflow logs in GitHub Actions
2. Review this documentation
3. Check GitHub Actions documentation
4. Contact DevOps team
