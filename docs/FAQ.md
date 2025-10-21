# Frequently Asked Questions (FAQ)

Common questions and answers about the LabTech GeoLab User Tracking System.

## Table of Contents

- [General Questions](#general-questions)
- [Installation and Setup](#installation-and-setup)
- [Authentication and Security](#authentication-and-security)
- [Activity Tracking](#activity-tracking)
- [Admin Dashboard](#admin-dashboard)
- [Performance and Scalability](#performance-and-scalability)
- [Troubleshooting](#troubleshooting)
- [Compliance and Privacy](#compliance-and-privacy)

## General Questions

### What is the LabTech GeoLab User Tracking System?

The LabTech GeoLab User Tracking System is a comprehensive solution for monitoring and logging user activities within the LabTech GeoLab application. It provides real-time tracking, detailed analytics, and administrative monitoring capabilities.

### What features does it include?

- **Activity Tracking**: Log all user interactions with files, folders, and pages
- **Admin Dashboard**: Web-based interface for monitoring and analysis
- **Real-Time Updates**: WebSocket-based live activity feed
- **Analytics**: Charts and reports on user activity patterns
- **Export Functionality**: Export data in CSV or JSON format
- **Multi-Factor Authentication**: Enhanced security for admin accounts
- **GDPR Compliance**: Data export and deletion capabilities
- **Automated Backups**: Scheduled database backups

### What technologies does it use?

**Frontend**:
- Angular 18.x
- Ionic 8.x
- TypeScript
- RxJS

**Backend**:
- Node.js 18.x
- Express 4.x
- PostgreSQL 15.x
- Redis 7.x
- Socket.IO

### Is it open source?

The project license depends on your organization's policy. Check the LICENSE file in the repository for details.

### What platforms are supported?

- **Web**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Mobile**: iOS and Android via Ionic/Capacitor
- **Desktop**: Electron app (optional)

## Installation and Setup

### What are the system requirements?

**Minimum**:
- CPU: 2 cores
- RAM: 4GB
- Disk: 20GB
- OS: Linux, macOS, or Windows

**Recommended**:
- CPU: 4 cores
- RAM: 8GB
- Disk: 50GB SSD
- OS: Linux (Ubuntu 22.04 LTS)

### How do I install the system?

See our deployment guides:
- [AWS Deployment Guide](./AWS_DEPLOYMENT_GUIDE.md)
- [Heroku Deployment Guide](./HEROKU_DEPLOYMENT_GUIDE.md)
- [Docker Deployment Guide](./DOCKER_DEPLOYMENT_GUIDE.md)
- [Local Development Setup](./LOCAL_DEVELOPMENT.md)

### Can I use Docker?

Yes! We provide Docker Compose configurations for both development and production. See the [Docker Deployment Guide](./DOCKER_DEPLOYMENT_GUIDE.md).

### How long does installation take?

- **Docker**: 5-10 minutes
- **Manual**: 30-60 minutes
- **Cloud (AWS/Heroku)**: 15-30 minutes

### Do I need a database?

Yes, PostgreSQL 15+ is required. You can use:
- Self-hosted PostgreSQL
- AWS RDS
- Heroku Postgres
- Docker container

### Do I need Redis?

Yes, Redis is required for:
- Session management
- Caching
- Rate limiting
- WebSocket scaling

## Authentication and Security

### How does authentication work?

The system uses JWT (JSON Web Tokens) with RS256 signing:
1. User logs in with username/password
2. Server verifies credentials
3. Server generates access token (15-min expiry) and refresh token (7-day expiry)
4. Client stores tokens securely
5. Client includes access token in API requests
6. Server validates token on each request

### What is Multi-Factor Authentication (MFA)?

MFA adds an extra layer of security by requiring a second form of verification (typically a 6-digit code from an authenticator app) in addition to your password.

### Is MFA required?

- **Admin accounts**: Yes, MFA is required
- **Regular users**: Recommended but optional

### How do I enable MFA?

1. Log in to your account
2. Go to Settings → Security
3. Click "Enable MFA"
4. Scan QR code with authenticator app (Google Authenticator, Authy, etc.)
5. Enter verification code
6. Save backup codes securely

### What if I lose my MFA device?

Use one of your backup codes to log in, then:
1. Disable MFA
2. Set up MFA again with new device

If you don't have backup codes, contact your administrator.

### How are passwords stored?

Passwords are hashed using bcrypt with a cost factor of 10. We never store plain-text passwords.

### How often should I change my password?

We recommend changing your password every 90 days. The system will prompt you when it's time to change.

### What makes a strong password?

A strong password:
- Is at least 12 characters long
- Contains uppercase and lowercase letters
- Contains numbers
- Contains special characters
- Is not a dictionary word
- Is not personal information

Example: `Tr0ub4dor&3!xK9p`

## Activity Tracking

### What activities are tracked?

The system tracks:
- File access (read, write, delete)
- Folder navigation
- Page views
- Downloads
- User logins/logouts
- Admin actions

### Is tracking automatic?

Yes, tracking is automatic once the system is installed. No additional configuration is needed.

### Can users opt out of tracking?

No, tracking is required for security and compliance purposes. However, users can:
- View their own activity data
- Export their data (GDPR right to access)
- Request data deletion (GDPR right to erasure)

### How long is activity data retained?

Activity logs are retained for 90 days by default. This can be configured by administrators.

### Can I track custom events?

Yes, you can log custom activities using the API:

```typescript
await activityService.logActivity({
  action: 'custom_action',
  resourceType: 'custom_resource',
  resourcePath: '/custom/path',
  metadata: { customField: 'value' }
});
```

### Does tracking affect performance?

No, activity tracking is designed to be lightweight:
- Async processing (non-blocking)
- Batch inserts
- Efficient database queries
- Minimal overhead (< 5ms per request)

## Admin Dashboard

### Who can access the admin dashboard?

Only users with the `admin` or `super_admin` role can access the dashboard.

### How do I access the dashboard?

Navigate to `/admin` in your browser or tap the "Admin" tab in the mobile app.

### Can I customize the dashboard?

Yes, you can:
- Adjust date ranges
- Save custom filters
- Configure notifications
- Schedule exports

### How often does the dashboard update?

- **Real-time feed**: Updates instantly via WebSocket
- **Statistics**: Refresh every 10 seconds
- **Charts**: Refresh when date range changes

### Can I export activity data?

Yes, you can export data in CSV or JSON format. See the [Admin Dashboard Guide](./ADMIN_DASHBOARD_GUIDE.md) for details.

### What's the maximum export size?

10,000 records per export. For larger datasets, use the API or contact support.

### Can I schedule automatic exports?

Yes, go to Settings → Scheduled Exports to configure automatic exports.

## Performance and Scalability

### How many users can the system support?

The system is designed to scale horizontally:
- **Small**: 100-1,000 users (single server)
- **Medium**: 1,000-10,000 users (2-5 servers)
- **Large**: 10,000+ users (5+ servers with load balancer)

### How many activities can be logged per second?

With proper configuration:
- **Single server**: 100-500 activities/second
- **Clustered**: 1,000+ activities/second

### How do I scale the system?

**Horizontal Scaling**:
1. Add more application servers
2. Use load balancer (Nginx, AWS ALB)
3. Scale database (read replicas)
4. Scale Redis (cluster mode)

**Vertical Scaling**:
1. Increase server resources (CPU, RAM)
2. Upgrade database instance
3. Optimize queries and indexes

### What's the database size?

Approximate size per 1 million activity logs:
- **PostgreSQL**: ~100MB
- **With indexes**: ~150MB

### How do I optimize performance?

1. **Database**:
   - Add indexes on frequently queried columns
   - Use connection pooling
   - Enable query caching

2. **Application**:
   - Enable Redis caching
   - Use CDN for static assets
   - Optimize API queries

3. **Frontend**:
   - Enable lazy loading
   - Use virtual scrolling
   - Implement pagination

## Troubleshooting

### The application won't start

Check:
1. Environment variables are set correctly
2. Database is running and accessible
3. Redis is running
4. Port 3000 is not in use
5. Dependencies are installed (`npm install`)

See [Troubleshooting Guide](./TROUBLESHOOTING.md) for details.

### I can't connect to the database

Verify:
1. DATABASE_URL is correct
2. PostgreSQL is running
3. Firewall allows connections
4. User has correct permissions

Test connection:
```bash
psql $DATABASE_URL -c "SELECT 1;"
```

### Real-time updates aren't working

Check:
1. WebSocket connection status (green dot in header)
2. Firewall allows WebSocket connections
3. Proxy is configured for WebSocket upgrade
4. Browser supports WebSocket

### The dashboard is slow

Try:
1. Narrow date range
2. Reduce items per page
3. Clear browser cache
4. Use modern browser
5. Check server resources

### I'm getting 401 Unauthorized errors

This means:
1. You're not logged in
2. Your token expired
3. Your token is invalid

Solution: Log out and log in again.

### I'm getting 403 Forbidden errors

This means you don't have permission for the requested action. Contact your administrator to request access.

### Export is taking too long

Large exports may take several minutes. Try:
1. Narrowing date range
2. Applying filters
3. Exporting in smaller batches

## Compliance and Privacy

### Is the system GDPR compliant?

Yes, the system includes GDPR compliance features:
- Data export (right to access)
- Data deletion (right to erasure)
- Consent management
- Data minimization
- Encryption

### How do I export my data?

1. Log in to your account
2. Go to Settings → Privacy
3. Click "Export My Data"
4. Download JSON file

Or use the API:
```bash
curl -X POST https://api.labtech-geolab.com/api/v1/gdpr/export \
  -H "Authorization: Bearer $TOKEN"
```

### How do I delete my data?

1. Log in to your account
2. Go to Settings → Privacy
3. Click "Delete My Data"
4. Confirm deletion (type "DELETE")

**Warning**: This action is irreversible!

### What data is collected?

We collect:
- Username and email
- Activity logs (actions, timestamps, resources)
- IP addresses
- User agent strings
- Session information

We do NOT collect:
- Passwords (only hashed)
- Credit card information
- Social security numbers
- Personal documents

### How is data protected?

- **Encryption at rest**: AES-256
- **Encryption in transit**: TLS 1.3
- **Access control**: Role-based permissions
- **Audit logging**: All access is logged
- **Regular backups**: Daily automated backups

### Who has access to my data?

- **You**: Full access to your own data
- **Administrators**: Access to activity logs for monitoring
- **Super Admins**: Full system access

All access is logged for audit purposes.

### How long is data retained?

- **Activity logs**: 90 days (configurable)
- **User accounts**: Until deleted
- **Backups**: 30 days
- **Audit logs**: 1 year

### Can I request data deletion?

Yes, you have the right to request deletion of your data under GDPR. Use the data deletion feature in Settings or contact support.

## Getting Help

### Where can I find documentation?

- **User Guides**: [docs/](../docs/)
- **API Documentation**: [backend/docs/](../backend/docs/)
- **Video Tutorials**: [youtube.com/labtech-geolab](https://youtube.com/labtech-geolab)

### How do I report a bug?

1. Check if it's a known issue: [GitHub Issues](https://github.com/your-org/labtech-geolab/issues)
2. If not, create a new issue with:
   - Description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Environment details

### How do I request a feature?

1. Check existing feature requests: [GitHub Discussions](https://github.com/your-org/labtech-geolab/discussions)
2. If not already requested, create a new discussion with:
   - Feature description
   - Use case
   - Expected benefits

### How do I contact support?

- **Email**: support@labtech-geolab.com
- **Phone**: 1-800-LABTECH
- **Live Chat**: Available in dashboard
- **Support Hours**: Monday-Friday, 9 AM - 5 PM EST

### Is there a community forum?

Yes! Join our community:
- **GitHub Discussions**: [github.com/your-org/labtech-geolab/discussions](https://github.com/your-org/labtech-geolab/discussions)
- **Slack**: #labtech-community
- **Discord**: [discord.gg/labtech](https://discord.gg/labtech)

### How do I contribute?

We welcome contributions! See our [Contributing Guidelines](./CONTRIBUTING.md) for details.

### Where can I find the source code?

The source code is available on GitHub: [github.com/your-org/labtech-geolab](https://github.com/your-org/labtech-geolab)

## Still Have Questions?

If your question isn't answered here:
1. Check the [documentation](../docs/)
2. Search [GitHub Issues](https://github.com/your-org/labtech-geolab/issues)
3. Ask in [GitHub Discussions](https://github.com/your-org/labtech-geolab/discussions)
4. Contact [support](mailto:support@labtech-geolab.com)
