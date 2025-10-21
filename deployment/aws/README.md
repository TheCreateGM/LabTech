# AWS Deployment Guide

This guide provides step-by-step instructions for deploying LabTech GeoLab to AWS using Terraform.

## Prerequisites

- AWS CLI installed and configured
- Terraform >= 1.0 installed
- SSH key pair created in AWS
- Domain name and SSL certificate in ACM
- AWS account with appropriate permissions

## Architecture Overview

The deployment creates the following AWS resources:

- **VPC**: Custom VPC with public and private subnets across 3 availability zones
- **EC2**: Auto Scaling Group with Application Load Balancer
- **RDS**: PostgreSQL database with Multi-AZ deployment
- **ElastiCache**: Redis cluster for caching and sessions
- **S3**: Bucket for backups and static assets
- **CloudFront**: CDN for static content delivery
- **CloudWatch**: Monitoring, logging, and alerting
- **IAM**: Roles and policies for EC2 instances

## Deployment Steps

### 1. Configure AWS Credentials

```bash
aws configure
```

### 2. Create S3 Backend for Terraform State

```bash
# Create S3 bucket for Terraform state
aws s3api create-bucket \
    --bucket labtech-terraform-state \
    --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket labtech-terraform-state \
    --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
    --table-name labtech-terraform-locks \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region us-east-1
```

### 3. Store Secrets in AWS Systems Manager Parameter Store

```bash
# Database password
aws ssm put-parameter \
    --name "/labtech/production/database-url" \
    --value "postgresql://username:password@endpoint:5432/labtech" \
    --type "SecureString" \
    --region us-east-1

# Redis URL
aws ssm put-parameter \
    --name "/labtech/production/redis-url" \
    --value "redis://endpoint:6379" \
    --type "SecureString" \
    --region us-east-1

# JWT Secret
aws ssm put-parameter \
    --name "/labtech/production/jwt-secret" \
    --value "your-jwt-secret-min-32-chars" \
    --type "SecureString" \
    --region us-east-1

# JWT Refresh Secret
aws ssm put-parameter \
    --name "/labtech/production/jwt-refresh-secret" \
    --value "your-jwt-refresh-secret-min-32-chars" \
    --type "SecureString" \
    --region us-east-1

# Encryption Key
aws ssm put-parameter \
    --name "/labtech/production/encryption-key" \
    --value "your-encryption-key-32-chars" \
    --type "SecureString" \
    --region us-east-1
```

### 4. Configure Terraform Variables

```bash
cd deployment/aws/terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your specific values:
- Update database credentials
- Set your domain name
- Add your ACM certificate ARN
- Configure alert email
- Set SSH key pair name

### 5. Initialize Terraform

```bash
terraform init
```

### 6. Review Terraform Plan

```bash
terraform plan
```

### 7. Apply Terraform Configuration

```bash
terraform apply
```

Type `yes` when prompted to create resources.

### 8. Deploy Application to EC2

After Terraform completes, get the EC2 instance IPs:

```bash
terraform output
```

SSH into an EC2 instance and run the deployment script:

```bash
# SSH into EC2 instance
ssh -i ~/.ssh/labtech-keypair.pem ec2-user@<instance-ip>

# Download and run deployment script
curl -O https://raw.githubusercontent.com/your-org/labtech-geolab/main/deployment/aws/scripts/deploy-ec2.sh
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

### 9. Configure DNS

Point your domain to the CloudFront distribution or ALB:

```bash
# Get CloudFront domain name
terraform output cloudfront_domain_name

# Create CNAME record in your DNS provider
# labtech.example.com -> d1234567890.cloudfront.net
```

### 10. Verify Deployment

```bash
# Check application health
curl https://labtech.example.com/health

# Check API
curl https://labtech.example.com/api/v1/health
```

## Post-Deployment Configuration

### Configure CloudWatch Alarms

CloudWatch alarms are automatically created for:
- High CPU usage (> 80%)
- High memory usage (> 80%)
- High error rate (> 5%)
- Database connection failures
- Unhealthy target instances

Alerts are sent to the email specified in `alert_email` variable.

### Setup Automated Backups

RDS automated backups are configured with:
- Backup retention: 30 days
- Backup window: 03:00-04:00 UTC
- Multi-AZ deployment for high availability

### Configure Auto Scaling

Auto Scaling is configured to:
- Scale up when CPU > 70% for 5 minutes
- Scale down when CPU < 30% for 5 minutes
- Min instances: 2
- Max instances: 10

## Monitoring and Logging

### View Application Logs

```bash
# SSH into EC2 instance
ssh -i ~/.ssh/labtech-keypair.pem ec2-user@<instance-ip>

# View PM2 logs
pm2 logs labtech-backend

# View CloudWatch logs
aws logs tail /aws/ec2/labtech/error --follow
```

### Monitor Metrics

Access CloudWatch dashboard:
1. Go to AWS Console > CloudWatch
2. Select "Dashboards"
3. View "LabTech-Production" dashboard

## Updating the Application

### Deploy New Version

```bash
# SSH into EC2 instance
ssh -i ~/.ssh/labtech-keypair.pem ec2-user@<instance-ip>

# Pull latest changes
cd /opt/labtech-geolab
git pull origin main

# Rebuild and restart
cd backend
npm ci --only=production
npm run build
npm run migrate
pm2 restart labtech-backend
```

### Rolling Update with Auto Scaling

For zero-downtime deployments:

1. Create new AMI with updated application
2. Update Launch Template with new AMI
3. Trigger Auto Scaling Group instance refresh

## Troubleshooting

### Application Not Starting

```bash
# Check PM2 status
pm2 status

# View error logs
pm2 logs labtech-backend --err

# Check system resources
top
df -h
```

### Database Connection Issues

```bash
# Test database connectivity
psql -h <rds-endpoint> -U labtech_admin -d labtech

# Check security groups
aws ec2 describe-security-groups --group-ids <sg-id>
```

### High CPU Usage

```bash
# Check running processes
top

# View PM2 metrics
pm2 monit

# Scale up instances
aws autoscaling set-desired-capacity \
    --auto-scaling-group-name labtech-asg \
    --desired-capacity 4
```

## Cleanup

To destroy all AWS resources:

```bash
cd deployment/aws/terraform
terraform destroy
```

**Warning**: This will delete all data including databases and backups.

## Cost Estimation

Estimated monthly costs for production deployment:

- EC2 (2x t3.medium): ~$60
- RDS (db.t3.medium Multi-AZ): ~$120
- ElastiCache (2x cache.t3.medium): ~$100
- ALB: ~$20
- CloudFront: ~$10 (varies with traffic)
- S3: ~$5 (varies with storage)
- Data Transfer: ~$20 (varies with traffic)

**Total**: ~$335/month (may vary based on usage)

## Security Best Practices

1. **Rotate Secrets**: Regularly rotate database passwords and JWT secrets
2. **Enable MFA**: Enable MFA for AWS root and IAM users
3. **Review IAM Policies**: Follow principle of least privilege
4. **Enable CloudTrail**: Enable AWS CloudTrail for audit logging
5. **Update Security Groups**: Regularly review and update security group rules
6. **Patch Systems**: Keep EC2 instances and dependencies updated
7. **Enable Encryption**: Ensure encryption at rest and in transit

## Support

For issues or questions:
- Check CloudWatch logs
- Review Terraform state
- Contact DevOps team
