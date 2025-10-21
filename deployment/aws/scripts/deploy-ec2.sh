#!/bin/bash

# EC2 Deployment Script for LabTech GeoLab
# This script installs Node.js, clones the repository, installs dependencies, and starts the application

set -e

# Configuration
APP_DIR="/opt/labtech-geolab"
REPO_URL="https://github.com/your-org/labtech-geolab.git"
BRANCH="main"
NODE_VERSION="18"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Update system packages
log_info "Updating system packages..."
sudo yum update -y

# Install Node.js
log_info "Installing Node.js ${NODE_VERSION}..."
curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | sudo bash -
sudo yum install -y nodejs

# Verify Node.js installation
node_version=$(node --version)
npm_version=$(npm --version)
log_info "Node.js version: ${node_version}"
log_info "npm version: ${npm_version}"

# Install Git
log_info "Installing Git..."
sudo yum install -y git

# Install PM2 globally
log_info "Installing PM2 process manager..."
sudo npm install -g pm2

# Install PostgreSQL client
log_info "Installing PostgreSQL client..."
sudo yum install -y postgresql15

# Create application directory
log_info "Creating application directory..."
sudo mkdir -p ${APP_DIR}
sudo chown -R ec2-user:ec2-user ${APP_DIR}

# Clone repository
log_info "Cloning repository from ${REPO_URL}..."
if [ -d "${APP_DIR}/.git" ]; then
    log_info "Repository already exists, pulling latest changes..."
    cd ${APP_DIR}
    git fetch origin
    git checkout ${BRANCH}
    git pull origin ${BRANCH}
else
    git clone -b ${BRANCH} ${REPO_URL} ${APP_DIR}
    cd ${APP_DIR}
fi

# Install backend dependencies
log_info "Installing backend dependencies..."
cd ${APP_DIR}/backend
npm ci --only=production

# Build backend
log_info "Building backend application..."
npm run build

# Run database migrations
log_info "Running database migrations..."
npm run migrate

# Create environment file from AWS Systems Manager Parameter Store
log_info "Fetching environment variables from AWS Systems Manager..."
cat > ${APP_DIR}/backend/.env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=$(aws ssm get-parameter --name "/labtech/production/database-url" --with-decryption --query "Parameter.Value" --output text)
REDIS_URL=$(aws ssm get-parameter --name "/labtech/production/redis-url" --with-decryption --query "Parameter.Value" --output text)
JWT_SECRET=$(aws ssm get-parameter --name "/labtech/production/jwt-secret" --with-decryption --query "Parameter.Value" --output text)
JWT_REFRESH_SECRET=$(aws ssm get-parameter --name "/labtech/production/jwt-refresh-secret" --with-decryption --query "Parameter.Value" --output text)
ENCRYPTION_KEY=$(aws ssm get-parameter --name "/labtech/production/encryption-key" --with-decryption --query "Parameter.Value" --output text)
MFA_ISSUER=LabTech GeoLab
CORS_ORIGIN=https://labtech.example.com
LOG_LEVEL=info
EOF

# Set proper permissions
chmod 600 ${APP_DIR}/backend/.env

# Configure PM2 ecosystem
log_info "Configuring PM2 ecosystem..."
cat > ${APP_DIR}/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'labtech-backend',
    cwd: '/opt/labtech-geolab/backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/var/log/labtech/error.log',
    out_file: '/var/log/labtech/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# Create log directory
sudo mkdir -p /var/log/labtech
sudo chown -R ec2-user:ec2-user /var/log/labtech

# Start application with PM2
log_info "Starting application with PM2..."
pm2 delete labtech-backend 2>/dev/null || true
pm2 start ${APP_DIR}/ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
log_info "Configuring PM2 to start on boot..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
pm2 save

# Install and configure CloudWatch agent
log_info "Installing CloudWatch agent..."
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm
rm -f ./amazon-cloudwatch-agent.rpm

# Configure CloudWatch agent
cat > /tmp/cloudwatch-config.json << 'EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/labtech/error.log",
            "log_group_name": "/aws/ec2/labtech/error",
            "log_stream_name": "{instance_id}"
          },
          {
            "file_path": "/var/log/labtech/out.log",
            "log_group_name": "/aws/ec2/labtech/out",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "LabTech/Application",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
          {"name": "cpu_usage_iowait", "rename": "CPU_IOWAIT", "unit": "Percent"}
        ],
        "totalcpu": false
      },
      "disk": {
        "measurement": [
          {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}
        ],
        "resources": ["*"]
      },
      "mem": {
        "measurement": [
          {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
        ]
      }
    }
  }
}
EOF

sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -s \
    -c file:/tmp/cloudwatch-config.json

# Health check
log_info "Performing health check..."
sleep 10
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    log_info "✓ Application is running and healthy"
    pm2 status
else
    log_error "✗ Application health check failed"
    pm2 logs --lines 50
    exit 1
fi

log_info "Deployment completed successfully!"
log_info "Application is running on port 3000"
log_info "View logs with: pm2 logs labtech-backend"
log_info "Monitor with: pm2 monit"
