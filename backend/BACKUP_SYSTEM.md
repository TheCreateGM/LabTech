# Database Backup and Recovery System

## Overview

The LabTech GeoLab backup system provides automated database backups with encryption, S3 storage, monitoring, and recovery capabilities.

## Features

- **Automated Backups**: Scheduled full and incremental backups
- **Encryption**: AES-256-GCM encryption for backup files
- **S3 Integration**: Optional upload to AWS S3 with encryption
- **Monitoring**: Real-time backup monitoring and alerts
- **Retention Policy**: Automated cleanup based on configurable retention rules
- **Point-in-Time Recovery**: Restore database to specific timestamps
- **Verification**: Checksum validation for backup integrity
- **Dashboard**: Admin dashboard for backup management

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Backup System                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Backup     │  │   Restore    │  │   Cleanup    │ │
│  │   Service    │  │   Service    │  │   Service    │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                  │                  │         │
│         └──────────────────┼──────────────────┘         │
│                            │                            │
│                   ┌────────┴────────┐                   │
│                   │   Monitoring    │                   │
│                   │    Service      │                   │
│                   └────────┬────────┘                   │
│                            │                            │
│         ┌──────────────────┼──────────────────┐         │
│         │                  │                  │         │
│    ┌────┴────┐      ┌──────┴──────┐    ┌─────┴─────┐  │
│    │  Local  │      │     S3      │    │   Alerts  │  │
│    │ Storage │      │   Storage   │    │  (Email/  │  │
│    │         │      │             │    │   Slack)  │  │
│    └─────────┘      └─────────────┘    └───────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# Backup Configuration
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=your-backup-bucket
BACKUP_EMAIL_ALERTS=true
BACKUP_EMAIL_RECIPIENTS=admin@example.com,ops@example.com
BACKUP_SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
BACKUP_STORAGE_THRESHOLD=80

# AWS Configuration (for S3 uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Encryption
ENCRYPTION_KEY=your-32-byte-hex-encryption-key
```

### Generate Encryption Key

```bash
# Generate a secure 32-byte encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Usage

### Manual Backups

#### Full Backup

```bash
cd backend
npm run backup:full
```

#### Incremental Backup

```bash
cd backend
npm run backup:incremental
```

### Automated Backups

#### Setup Cron Jobs (Linux/macOS)

```bash
cd backend
npm run backup:schedule
```

This will configure:
- Daily full backup at 2:00 AM UTC
- Incremental backup every 6 hours
- Weekly cleanup on Sunday at 3:00 AM UTC

#### Heroku Scheduler

For Heroku deployments, configure the Heroku Scheduler add-on:

1. Install the add-on:
   ```bash
   heroku addons:create scheduler:standard
   ```

2. Open the scheduler dashboard:
   ```bash
   heroku addons:open scheduler
   ```

3. Add the following jobs:

   **Daily Full Backup (2:00 AM UTC)**
   ```
   cd backend && npm run backup:full
   ```

   **Incremental Backup (every 6 hours)**
   ```
   cd backend && npm run backup:incremental
   ```

   **Weekly Cleanup (Sunday 3:00 AM UTC)**
   ```
   cd backend && npm run backup:cleanup
   ```

### Database Restore

#### Interactive Restore

```bash
cd backend
npm run backup:restore
```

This will:
1. List all available backups
2. Prompt you to select a backup
3. Confirm the restore operation
4. Restore the database

#### Restore from Specific File

```bash
cd backend
npm run backup:restore -- --file backup-full-2024-01-15T10-30-00-000Z.sql.enc
```

#### Point-in-Time Recovery

```bash
cd backend
npm run backup:restore -- --point-in-time 2024-01-15T10:30:00Z
```

### Backup Cleanup

#### Manual Cleanup

```bash
cd backend
npm run backup:cleanup
```

#### Dry Run (Preview)

```bash
cd backend
npm run backup:cleanup -- --dry-run
```

## Retention Policy

The backup system implements a tiered retention policy:

| Period | Retention | Backup Type |
|--------|-----------|-------------|
| Daily | 30 days | All backups |
| Weekly | 90 days | Sunday full backups |
| Monthly | 365 days | First-of-month full backups |

### Customization

Modify the retention policy in `backend/scripts/cleanup-backups.ts`:

```typescript
const retentionPolicy: RetentionPolicy = {
  dailyRetentionDays: 30,    // Keep all backups for 30 days
  weeklyRetentionDays: 90,   // Keep weekly backups for 90 days
  monthlyRetentionDays: 365, // Keep monthly backups for 1 year
};
```

## Monitoring

### API Endpoints

All endpoints require admin authentication.

#### Get Backup Statistics

```bash
GET /api/v1/backups/stats
```

Response:
```json
{
  "success": true,
  "data": {
    "totalBackups": 45,
    "successfulBackups": 44,
    "failedBackups": 1,
    "totalSize": 5368709120,
    "lastBackupTime": "2024-01-15T10:30:00Z",
    "storageUsage": {
      "used": 10737418240,
      "total": 53687091200,
      "percentage": 20.0
    }
  }
}
```

#### Get Backup History

```bash
GET /api/v1/backups/history?limit=50
```

#### Generate Backup Report

```bash
GET /api/v1/backups/report
```

#### Trigger Manual Backup

```bash
POST /api/v1/backups/trigger
Content-Type: application/json

{
  "type": "full"
}
```

### Alerts

The system sends alerts for:

1. **Backup Failures**: Immediate notification when a backup fails
2. **Storage Threshold**: Alert when storage usage exceeds 80% (configurable)

Alerts are sent via:
- Email (if configured)
- Slack webhook (if configured)
- Console logs (always)

## S3 Storage

### Setup

1. Create an S3 bucket:
   ```bash
   aws s3 mb s3://your-backup-bucket --region us-east-1
   ```

2. Enable versioning:
   ```bash
   aws s3api put-bucket-versioning \
     --bucket your-backup-bucket \
     --versioning-configuration Status=Enabled
   ```

3. Enable encryption:
   ```bash
   aws s3api put-bucket-encryption \
     --bucket your-backup-bucket \
     --server-side-encryption-configuration '{
       "Rules": [{
         "ApplyServerSideEncryptionByDefault": {
           "SSEAlgorithm": "AES256"
         }
       }]
     }'
   ```

4. Set lifecycle policy (optional):
   ```bash
   aws s3api put-bucket-lifecycle-configuration \
     --bucket your-backup-bucket \
     --lifecycle-configuration file://lifecycle.json
   ```

   `lifecycle.json`:
   ```json
   {
     "Rules": [{
       "Id": "DeleteOldBackups",
       "Status": "Enabled",
       "Prefix": "backups/",
       "Expiration": {
         "Days": 90
       }
     }]
   }
   ```

### IAM Policy

Create an IAM user with the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-backup-bucket",
        "arn:aws:s3:::your-backup-bucket/*"
      ]
    }
  ]
}
```

## Security

### Encryption

- **Algorithm**: AES-256-GCM
- **Key Management**: Environment variable or key management service
- **IV**: Unique initialization vector per backup
- **Auth Tag**: Ensures data integrity

### Access Control

- All backup management endpoints require admin authentication
- Backup files are encrypted at rest
- S3 uploads use server-side encryption
- Secure key storage recommended (AWS KMS, HashiCorp Vault)

### Best Practices

1. **Rotate Encryption Keys**: Rotate keys every 90 days
2. **Secure Storage**: Store backups in separate region/account
3. **Test Restores**: Regularly test restore procedures
4. **Monitor Alerts**: Respond promptly to backup failures
5. **Audit Logs**: Review cleanup logs for compliance

## Troubleshooting

### Backup Fails

1. Check database connectivity:
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

2. Verify pg_dump is installed:
   ```bash
   pg_dump --version
   ```

3. Check disk space:
   ```bash
   df -h
   ```

4. Review logs:
   ```bash
   tail -f backend/logs/backup.log
   ```

### Restore Fails

1. Verify backup file exists and is not corrupted
2. Check database permissions
3. Ensure sufficient disk space
4. Review error messages in console output

### S3 Upload Fails

1. Verify AWS credentials:
   ```bash
   aws s3 ls s3://your-backup-bucket
   ```

2. Check IAM permissions
3. Verify bucket exists and is accessible
4. Check network connectivity

### High Storage Usage

1. Run cleanup manually:
   ```bash
   npm run backup:cleanup
   ```

2. Adjust retention policy
3. Consider increasing storage capacity
4. Review backup frequency

## Performance

### Backup Times

Typical backup times (approximate):

| Database Size | Full Backup | Incremental |
|---------------|-------------|-------------|
| 100 MB | 5-10 seconds | 2-5 seconds |
| 1 GB | 30-60 seconds | 10-20 seconds |
| 10 GB | 5-10 minutes | 1-3 minutes |
| 100 GB | 30-60 minutes | 10-20 minutes |

### Optimization

1. **Compression**: pg_dump uses custom format with compression
2. **Parallel Backup**: Use `-j` flag for large databases
3. **Network**: Use same region for S3 uploads
4. **Incremental**: Reduce backup size with incremental backups

## Disaster Recovery

### Recovery Time Objective (RTO)

Target: 4 hours

### Recovery Point Objective (RPO)

Target: 6 hours (based on incremental backup frequency)

### Recovery Procedure

1. **Identify Failure**: Detect database corruption or data loss
2. **Select Backup**: Choose appropriate backup based on timestamp
3. **Restore Database**: Execute restore procedure
4. **Verify Data**: Validate restored data integrity
5. **Resume Operations**: Bring application back online

### Testing

Perform quarterly disaster recovery drills:

1. Schedule maintenance window
2. Restore to test environment
3. Verify data integrity
4. Document recovery time
5. Update procedures as needed

## Compliance

### GDPR

- Backups include personal data
- Implement data retention policies
- Provide data export capabilities
- Secure deletion of old backups

### Audit Trail

All backup operations are logged:
- Backup creation (success/failure)
- Restore operations
- Cleanup operations
- Access to backup files

Logs are stored in:
- `backend/logs/backup.log`
- `backend/logs/backup-cleanup.log`
- `backend/backups/backup-monitor.log`

## Support

For issues or questions:

1. Check logs in `backend/logs/`
2. Review this documentation
3. Contact system administrator
4. File issue in project repository

## References

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
