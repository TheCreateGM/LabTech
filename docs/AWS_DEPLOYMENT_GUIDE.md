# AWS Deployment Guide

Complete guide for deploying the LabTech GeoLab User Tracking System on Amazon Web Services (AWS).

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Step-by-Step Deployment](#step-by-step-deployment)
- [Configuration](#configuration)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)
- [Cost Estimation](#cost-estimation)

## Prerequisites

### Required Tools

1. **AWS CLI** (version 2.x or later)
   ```bash
   # Install AWS CLI
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   
   # Verify installation
   aws --version
   ```

2. **Terraform** (version 1.0 or later)
   ```bash
   # Install Terraform
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   
   # Verify installation
   terraform --version
   ```

3. **Node.js** (version 18.x or later)
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

### AWS Account Setup

1. **Create AWS Account**: Sign up at [aws.amazon.com](https://aws.amazon.com)

2. **Configure AWS CLI**:
   ```bash
   aws configure
   ```
   
   Enter your credentials:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region (e.g., `us-east-1`)
   - Default output format: `json`

3. **Verify Access**:
   ```bash
   aws sts get-caller-identity
   ```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                    Route 53 (DNS)                            │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                CloudFront (CDN)                              │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│              Application Load Balancer                       │
│                    (ALB)                                     │
└────────────┬───────────────────────────┬────────────────────┘
             │                           │
┌────────────┴────────┐     ┌───────────┴────────────┐
│   EC2 Auto Scaling  │     │   EC2 Auto Scaling     │
│   Group (AZ-1)      │     │   Group (AZ-2)         │
│   - App Server 1    │     │   - App Server 2       │
│   - App Server 2    │     │   - App Server 3       │
└────────────┬────────┘     └───────────┬────────────┘
             │                           │
             └───────────┬───────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                  RDS PostgreSQL                              │
│                  (Multi-AZ)                                  │
│   Primary (AZ-1) ←→ Standby (AZ-2)                         │
└──────────────────────────────────────────────────────────────┘
             │
┌────────────┴────────────────────────────────────────────────┐
│              ElastiCache Redis                               │
│              (Multi-AZ)                                      │
└──────────────────────────────────────────────────────────────┘
             │
┌────────────┴────────────────────────────────────────────────┐
│                    S3 Buckets                                │
│   - Static Assets                                            │
│   - Database Backups                                         │
│   - Application Logs                                         │
└──────────────────────────────────────────────────────────────┘
```

### Components

- **Route 53**: DNS management
- **CloudFront**: CDN for static assets
- **Application Load Balancer**: Distributes traffic across EC2 instances
- **EC2 Auto Scaling**: Automatically scales application servers
- **RDS PostgreSQL**: Managed database with Multi-AZ deployment
- **ElastiCache Redis**: Session storage and caching
- **S3**: Object storage for backups and static files
- **CloudWatch**: Monitoring and logging
- **Secrets Manager**: Secure credential storage

## Step-by-Step Deployment

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/labtech-geolab.git
cd labtech-geolab
```

### Step 2: Configure Terraform Variables

1. Navigate to Terraform directory:
   ```bash
   cd deployment/aws/terraform
   ```

2. Copy example variables file:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

3. Edit `terraform.tfvars`:
   ```hcl
   # Project Configuration
   project_name = "labtech-geolab"
   environment  = "production"
   aws_region   = "us-east-1"
   
   # Network Configuration
   vpc_cidr = "10.0.0.0/16"
   availability_zones = ["us-east-1a", "us-east-1b"]
   
   # EC2 Configuration
   instance_type = "t3.medium"
   min_instances = 2
   max_instances = 10
   desired_instances = 2
   
   # RDS Configuration
   db_instance_class = "db.t3.medium"
   db_name = "labtech_geolab"
   db_username = "admin"
   db_allocated_storage = 100
   db_multi_az = true
   
   # Redis Configuration
   redis_node_type = "cache.t3.micro"
   redis_num_cache_nodes = 2
   
   # Domain Configuration
   domain_name = "labtech-geolab.com"
   
   # SSL Certificate ARN (from ACM)
   ssl_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/..."
   
   # Tags
   tags = {
     Project     = "LabTech GeoLab"
     Environment = "Production"
     ManagedBy   = "Terraform"
   }
   ```

### Step 3: Initialize Terraform

```bash
terraform init
```

This will:
- Download required providers
- Initialize backend
- Prepare working directory

### Step 4: Plan Deployment

```bash
terraform plan -out=tfplan
```

Review the planned changes carefully. Terraform will show:
- Resources to be created
- Estimated costs
- Configuration details

### Step 5: Apply Infrastructure

```bash
terraform apply tfplan
```

This process takes 15-20 minutes. Terraform will create:
- VPC and networking components
- Security groups
- EC2 instances with Auto Scaling
- RDS database
- ElastiCache cluster
- Load balancer
- S3 buckets
- IAM roles and policies

### Step 6: Configure Database

1. Get RDS endpoint from Terraform output:
   ```bash
   terraform output rds_endpoint
   ```

2. Connect to RDS:
   ```bash
   psql -h <rds-endpoint> -U admin -d labtech_geolab
   ```

3. Run migrations:
   ```bash
   cd ../../../backend
   npm install
   DATABASE_URL="postgresql://admin:<password>@<rds-endpoint>:5432/labtech_geolab" npm run migrate
   ```

### Step 7: Deploy Application Code

1. Get EC2 instance IPs:
   ```bash
   terraform output ec2_instance_ips
   ```

2. Run deployment script:
   ```bash
   cd ../scripts
   ./deploy-ec2.sh
   ```

   Or manually deploy to each instance:
   ```bash
   # SSH into EC2 instance
   ssh -i ~/.ssh/labtech-key.pem ec2-user@<instance-ip>
   
   # Clone repository
   git clone https://github.com/your-org/labtech-geolab.git
   cd labtech-geolab/backend
   
   # Install dependencies
   npm install --production
   
   # Build application
   npm run build
   
   # Set up environment variables
   sudo nano /etc/environment
   # Add all required variables (see Configuration section)
   
   # Start application with PM2
   sudo npm install -g pm2
   pm2 start dist/index.js --name labtech-api
   pm2 startup
   pm2 save
   ```

### Step 8: Configure Load Balancer

1. Get ALB DNS name:
   ```bash
   terraform output alb_dns_name
   ```

2. Test load balancer:
   ```bash
   curl http://<alb-dns-name>/api/v1/health
   ```

### Step 9: Configure CloudFront

1. Get CloudFront distribution ID:
   ```bash
   terraform output cloudfront_distribution_id
   ```

2. Wait for distribution to deploy (10-15 minutes)

3. Test CloudFront:
   ```bash
   curl https://<cloudfront-domain>/api/v1/health
   ```

### Step 10: Configure Route 53

1. Get Route 53 hosted zone ID:
   ```bash
   terraform output route53_zone_id
   ```

2. Update DNS records (if not using Terraform):
   ```bash
   aws route53 change-resource-record-sets \
     --hosted-zone-id <zone-id> \
     --change-batch file://dns-records.json
   ```

3. Verify DNS:
   ```bash
   dig labtech-geolab.com
   ```

### Step 11: Configure SSL Certificate

1. Request certificate in ACM:
   ```bash
   aws acm request-certificate \
     --domain-name labtech-geolab.com \
     --subject-alternative-names "*.labtech-geolab.com" \
     --validation-method DNS
   ```

2. Validate certificate via DNS

3. Update ALB listener to use HTTPS

### Step 12: Set Up Monitoring

1. Configure CloudWatch alarms:
   ```bash
   aws cloudwatch put-metric-alarm \
     --alarm-name high-cpu-usage \
     --alarm-description "Alert when CPU exceeds 80%" \
     --metric-name CPUUtilization \
     --namespace AWS/EC2 \
     --statistic Average \
     --period 300 \
     --threshold 80 \
     --comparison-operator GreaterThanThreshold \
     --evaluation-periods 2
   ```

2. Set up log aggregation:
   ```bash
   # Install CloudWatch agent on EC2 instances
   sudo yum install amazon-cloudwatch-agent
   sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
     -a fetch-config \
     -m ec2 \
     -s \
     -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json
   ```

## Configuration

### Environment Variables

Create `/etc/environment` on each EC2 instance:

```bash
# Application
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://admin:<password>@<rds-endpoint>:5432/labtech_geolab
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# Redis
REDIS_URL=redis://<elasticache-endpoint>:6379
REDIS_PASSWORD=<redis-password>

# JWT
JWT_SECRET=<generate-secure-secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
JWT_PRIVATE_KEY_PATH=/etc/labtech/keys/private.pem
JWT_PUBLIC_KEY_PATH=/etc/labtech/keys/public.pem

# Encryption
ENCRYPTION_KEY=<generate-32-byte-key>

# AWS
AWS_REGION=us-east-1
AWS_S3_BUCKET=labtech-geolab-backups
AWS_ACCESS_KEY_ID=<from-iam-role>
AWS_SECRET_ACCESS_KEY=<from-iam-role>

# Monitoring
SENTRY_DSN=<your-sentry-dsn>
PROMETHEUS_PORT=9090

# CORS
CORS_ORIGIN=https://labtech-geolab.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Security Groups

Terraform creates the following security groups:

1. **ALB Security Group**:
   - Inbound: 80 (HTTP), 443 (HTTPS) from 0.0.0.0/0
   - Outbound: All traffic

2. **EC2 Security Group**:
   - Inbound: 3000 from ALB security group
   - Inbound: 22 (SSH) from your IP
   - Outbound: All traffic

3. **RDS Security Group**:
   - Inbound: 5432 from EC2 security group
   - Outbound: None

4. **Redis Security Group**:
   - Inbound: 6379 from EC2 security group
   - Outbound: None

### IAM Roles

Terraform creates IAM roles with necessary permissions:

1. **EC2 Instance Role**:
   - S3 read/write for backups
   - CloudWatch logs write
   - Secrets Manager read
   - Systems Manager access

2. **RDS Enhanced Monitoring Role**:
   - CloudWatch logs write

## Monitoring and Maintenance

### CloudWatch Dashboards

Access CloudWatch dashboard:
```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:
```

Key metrics to monitor:
- EC2 CPU utilization
- RDS connections
- ALB request count
- ElastiCache hit rate
- Application errors

### Automated Backups

RDS automated backups are configured with:
- Backup retention: 30 days
- Backup window: 03:00-04:00 UTC
- Maintenance window: Sun 04:00-05:00 UTC

Manual backup:
```bash
aws rds create-db-snapshot \
  --db-instance-identifier labtech-geolab-db \
  --db-snapshot-identifier manual-backup-$(date +%Y%m%d)
```

### Scaling

Auto Scaling is configured to:
- Scale up when CPU > 70% for 5 minutes
- Scale down when CPU < 30% for 10 minutes
- Min instances: 2
- Max instances: 10

Manual scaling:
```bash
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name labtech-geolab-asg \
  --desired-capacity 5
```

### Updates and Deployments

Zero-downtime deployment:

1. Build new AMI with updated code
2. Update Launch Template
3. Trigger rolling update:
   ```bash
   aws autoscaling start-instance-refresh \
     --auto-scaling-group-name labtech-geolab-asg
   ```

## Troubleshooting

### Issue: Cannot connect to RDS

**Symptoms**: Database connection timeout

**Solutions**:
1. Check security group rules:
   ```bash
   aws ec2 describe-security-groups --group-ids <rds-sg-id>
   ```

2. Verify RDS is available:
   ```bash
   aws rds describe-db-instances --db-instance-identifier labtech-geolab-db
   ```

3. Test connection from EC2:
   ```bash
   telnet <rds-endpoint> 5432
   ```

### Issue: High CPU usage

**Symptoms**: Application slow, CPU > 80%

**Solutions**:
1. Check CloudWatch metrics
2. Increase instance size:
   ```bash
   # Update terraform.tfvars
   instance_type = "t3.large"
   
   # Apply changes
   terraform apply
   ```

3. Scale out (add more instances):
   ```bash
   aws autoscaling set-desired-capacity \
     --auto-scaling-group-name labtech-geolab-asg \
     --desired-capacity 4
   ```

### Issue: 502 Bad Gateway

**Symptoms**: ALB returns 502 error

**Solutions**:
1. Check target health:
   ```bash
   aws elbv2 describe-target-health \
     --target-group-arn <target-group-arn>
   ```

2. Check application logs:
   ```bash
   ssh ec2-user@<instance-ip>
   pm2 logs labtech-api
   ```

3. Verify health check endpoint:
   ```bash
   curl http://<instance-ip>:3000/api/v1/health
   ```

### Issue: Out of memory

**Symptoms**: Application crashes, OOM errors

**Solutions**:
1. Increase instance memory:
   ```bash
   # Update instance type to memory-optimized
   instance_type = "r5.large"
   ```

2. Optimize Node.js memory:
   ```bash
   pm2 start dist/index.js --name labtech-api --max-memory-restart 1G
   ```

3. Check for memory leaks:
   ```bash
   pm2 monit
   ```

### Issue: Database connection pool exhausted

**Symptoms**: "Too many connections" error

**Solutions**:
1. Increase RDS max connections:
   ```bash
   aws rds modify-db-parameter-group \
     --db-parameter-group-name labtech-params \
     --parameters "ParameterName=max_connections,ParameterValue=200,ApplyMethod=immediate"
   ```

2. Optimize connection pool:
   ```bash
   # In environment variables
   DATABASE_POOL_MAX=50
   ```

### Issue: SSL certificate errors

**Symptoms**: HTTPS not working, certificate warnings

**Solutions**:
1. Verify certificate status:
   ```bash
   aws acm describe-certificate --certificate-arn <cert-arn>
   ```

2. Check ALB listener:
   ```bash
   aws elbv2 describe-listeners --load-balancer-arn <alb-arn>
   ```

3. Update certificate:
   ```bash
   aws elbv2 modify-listener \
     --listener-arn <listener-arn> \
     --certificates CertificateArn=<new-cert-arn>
   ```

## Cost Estimation

### Monthly Cost Breakdown (us-east-1)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| EC2 (t3.medium x 2) | 2 instances, 24/7 | $60 |
| RDS PostgreSQL (db.t3.medium) | Multi-AZ, 100GB | $120 |
| ElastiCache Redis (cache.t3.micro x 2) | Multi-AZ | $25 |
| Application Load Balancer | 1 ALB | $20 |
| S3 Storage | 100GB | $2.30 |
| CloudFront | 1TB transfer | $85 |
| Route 53 | 1 hosted zone | $0.50 |
| CloudWatch | Standard monitoring | $10 |
| Data Transfer | 1TB outbound | $90 |
| **Total** | | **~$413/month** |

### Cost Optimization Tips

1. **Use Reserved Instances**: Save up to 72% on EC2 and RDS
2. **Right-size instances**: Monitor usage and downsize if possible
3. **Use S3 Lifecycle policies**: Move old backups to Glacier
4. **Enable CloudFront caching**: Reduce origin requests
5. **Use Spot Instances**: For non-critical workloads
6. **Set up billing alerts**: Monitor costs in real-time

### Scaling Costs

- **10x traffic**: ~$800/month (scale to 5 instances)
- **100x traffic**: ~$2,500/month (scale to 20 instances, larger RDS)

## Next Steps

1. **Set up CI/CD**: Automate deployments with GitHub Actions
2. **Configure monitoring**: Set up Grafana dashboards
3. **Implement backups**: Schedule automated backups
4. **Security hardening**: Enable AWS WAF, GuardDuty
5. **Performance testing**: Load test with 1000+ concurrent users
6. **Documentation**: Document runbooks and procedures

## Additional Resources

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS Cost Optimization](https://aws.amazon.com/pricing/cost-optimization/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/latest/reference/)

## Support

For deployment issues:
- AWS Support: [console.aws.amazon.com/support](https://console.aws.amazon.com/support)
- Project Issues: [github.com/your-org/labtech-geolab/issues](https://github.com/your-org/labtech-geolab/issues)
- Email: devops@labtech-geolab.com
