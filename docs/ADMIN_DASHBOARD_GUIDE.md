# Admin Dashboard User Guide

Complete guide for using the LabTech GeoLab Admin Dashboard to monitor user activity and manage the system.

## Table of Contents

- [Getting Started](#getting-started)
- [Dashboard Overview](#dashboard-overview)
- [Viewing Activity Logs](#viewing-activity-logs)
- [Filtering and Searching](#filtering-and-searching)
- [Exporting Data](#exporting-data)
- [Real-Time Monitoring](#real-time-monitoring)
- [Analytics and Reports](#analytics-and-reports)
- [Security Best Practices](#security-best-practices)
- [FAQ](#faq)

## Getting Started

### Accessing the Admin Dashboard

1. **Navigate to the application**:
   - Web: `https://your-domain.com/admin`
   - Mobile: Open app and tap "Admin" tab

2. **Log in with admin credentials**:
   - Enter your username and password
   - Complete MFA verification if enabled
   - Click "Sign In"

3. **Dashboard loads automatically** after successful authentication

### First-Time Setup

If this is your first time accessing the dashboard:

1. **Enable Multi-Factor Authentication** (recommended):
   - Click your profile icon → "Security Settings"
   - Click "Enable MFA"
   - Scan QR code with authenticator app
   - Save backup codes securely
   - Enter verification code to confirm

2. **Customize Dashboard**:
   - Adjust date range for default view
   - Set preferred export format
   - Configure notification preferences

## Dashboard Overview

### Main Components

```
┌─────────────────────────────────────────────────────────┐
│  Header                                                  │
│  [Logo] [Navigation] [Search] [Notifications] [Profile] │
├─────────────────────────────────────────────────────────┤
│  Statistics Cards                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Total    │ │ Today's  │ │ Active   │ │ Top      │  │
│  │ Users    │ │ Activity │ │ Users    │ │ Files    │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
├─────────────────────────────────────────────────────────┤
│  Activity Chart                                          │
│  [Line chart showing activity over time]                │
├─────────────────────────────────────────────────────────┤
│  Activity Log Table                                      │
│  [Paginated table with filters]                         │
├─────────────────────────────────────────────────────────┤
│  Real-Time Feed                                          │
│  [Live activity updates]                                │
└─────────────────────────────────────────────────────────┘
```

### Navigation Menu

- **Dashboard**: Overview and statistics
- **Activity Logs**: Detailed activity table
- **Analytics**: Charts and reports
- **Users**: User management (if authorized)
- **Settings**: System configuration

## Viewing Activity Logs

### Activity Log Table

The activity log table displays all user activities with the following columns:

| Column | Description |
|--------|-------------|
| Timestamp | When the activity occurred |
| User | Username of the person who performed the action |
| Action | Type of action (read, write, delete, open, download) |
| Resource Type | Type of resource (file, folder, page) |
| Resource Path | Path to the accessed resource |
| IP Address | Client IP address |
| Details | Additional metadata (click to expand) |

### Sorting

Click any column header to sort:
- **First click**: Sort ascending
- **Second click**: Sort descending
- **Third click**: Remove sort

### Pagination

Navigate through pages:
- Use page numbers at bottom of table
- Click "Previous" or "Next" buttons
- Change items per page (25, 50, 100)

### Viewing Details

Click any row to view full details:
- Complete metadata
- User agent information
- Session details
- Related activities

## Filtering and Searching

### Quick Filters

Use the filter panel at the top of the activity log:

1. **User Filter**:
   - Click "User" dropdown
   - Select one or more users
   - Click "Apply"

2. **Date Range**:
   - Click "Date Range" picker
   - Select start and end dates
   - Or use presets: Today, Yesterday, Last 7 Days, Last 30 Days
   - Click "Apply"

3. **Action Type**:
   - Click "Action" dropdown
   - Select action types: Read, Write, Delete, Open, Download
   - Click "Apply"

4. **Resource Path**:
   - Enter path or pattern in search box
   - Supports wildcards: `/projects/*`
   - Press Enter or click search icon

### Advanced Filters

Click "Advanced Filters" for more options:

1. **IP Address Range**:
   - Enter IP address or CIDR notation
   - Example: `192.168.1.0/24`

2. **Resource Type**:
   - Filter by file, folder, or page

3. **Metadata Search**:
   - Search within metadata JSON
   - Example: `fileSize > 1000000`

### Saving Filters

Save frequently used filters:

1. Apply desired filters
2. Click "Save Filter" button
3. Enter a name (e.g., "Large File Access")
4. Click "Save"

Load saved filters:
- Click "Saved Filters" dropdown
- Select filter name
- Filters apply automatically

### Clearing Filters

Remove all active filters:
- Click "Clear All Filters" button
- Or click "X" on individual filter chips

## Exporting Data

### Export Options

Export activity logs for analysis or compliance:

1. **Click "Export" button** in toolbar

2. **Select export format**:
   - **CSV**: For Excel or spreadsheet analysis
   - **JSON**: For programmatic processing

3. **Choose date range**:
   - Use current filters
   - Or specify custom range

4. **Apply filters** (optional):
   - Export only filtered data
   - Or export all data

5. **Click "Export"**:
   - File downloads automatically
   - Large exports may take a few moments

### Export Formats

#### CSV Format

```csv
timestamp,user_id,username,action,resource_type,resource_path,ip_address
2024-01-15T10:30:00Z,550e8400...,johndoe,read,file,/projects/sample.pdf,192.168.1.100
```

**Use cases**:
- Excel analysis
- Pivot tables
- Charts and graphs

#### JSON Format

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "username": "johndoe",
    "action": "read",
    "resourceType": "file",
    "resourcePath": "/projects/sample.pdf",
    "metadata": {
      "fileSize": 1024000,
      "duration": 5000
    },
    "ipAddress": "192.168.1.100",
    "timestamp": "2024-01-15T10:30:00Z"
  }
]
```

**Use cases**:
- Programmatic analysis
- Data integration
- Custom reporting

### Export Limits

- **Maximum records**: 10,000 per export
- **For larger exports**: Contact support or use API

### Scheduled Exports

Set up automatic exports:

1. Go to Settings → Scheduled Exports
2. Click "New Schedule"
3. Configure:
   - Frequency (daily, weekly, monthly)
   - Time of day
   - Filters to apply
   - Email recipients
4. Click "Save"

## Real-Time Monitoring

### Live Activity Feed

The real-time feed shows activities as they happen:

**Features**:
- Updates automatically (no refresh needed)
- Shows last 20 activities
- Color-coded by action type
- Auto-scrolls to show latest

**Action Colors**:
- 🟢 Green: Read/Open
- 🔵 Blue: Write
- 🔴 Red: Delete
- 🟡 Yellow: Download

### Connection Status

Monitor WebSocket connection:
- **Connected** (green dot): Receiving real-time updates
- **Disconnected** (red dot): Not receiving updates
- **Reconnecting** (yellow dot): Attempting to reconnect

If disconnected:
1. Check internet connection
2. Refresh page
3. Contact support if issue persists

### Notifications

Enable desktop notifications:

1. Click notification icon in header
2. Click "Enable Notifications"
3. Allow notifications in browser prompt
4. Configure notification preferences:
   - All activities
   - Specific actions only
   - Specific users only

## Analytics and Reports

### Activity Chart

View activity trends over time:

**Chart Types**:
- **Line Chart**: Activity over time
- **Bar Chart**: Activity by action type
- **Pie Chart**: Action distribution

**Time Ranges**:
- Last 24 hours
- Last 7 days
- Last 30 days
- Custom range

**Interactions**:
- Hover over data points for details
- Click legend to show/hide series
- Zoom in on specific time periods

### Statistics Cards

Quick overview metrics:

1. **Total Activities**:
   - Count of all activities
   - Percentage change from previous period

2. **Active Users**:
   - Number of unique users
   - Most active user

3. **Top Files**:
   - Most accessed files
   - Access count

4. **Action Breakdown**:
   - Distribution by action type
   - Percentage of each action

### Custom Reports

Generate custom reports:

1. Go to Analytics → Custom Reports
2. Click "New Report"
3. Configure:
   - Report name
   - Date range
   - Metrics to include
   - Grouping (by user, action, file, etc.)
   - Filters
4. Click "Generate"
5. View, export, or schedule report

## Security Best Practices

### Account Security

1. **Use Strong Passwords**:
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Don't reuse passwords

2. **Enable MFA**:
   - Required for admin accounts
   - Use authenticator app (not SMS)
   - Store backup codes securely

3. **Regular Password Changes**:
   - Change password every 90 days
   - Don't reuse old passwords

### Session Management

1. **Logout When Done**:
   - Always logout after use
   - Especially on shared computers

2. **Session Timeout**:
   - Sessions expire after 15 minutes of inactivity
   - You'll be prompted to re-authenticate

3. **Active Sessions**:
   - View active sessions in Settings
   - Revoke suspicious sessions

### Access Control

1. **Principle of Least Privilege**:
   - Only grant necessary permissions
   - Review user roles regularly

2. **Audit Logs**:
   - Review admin activity logs
   - Investigate suspicious activity

3. **IP Whitelisting** (if available):
   - Restrict admin access to specific IPs
   - Configure in Settings → Security

### Data Protection

1. **Sensitive Data**:
   - Activity logs may contain sensitive information
   - Handle exports securely
   - Delete when no longer needed

2. **GDPR Compliance**:
   - Respect user privacy
   - Honor data deletion requests
   - Maintain data retention policies

3. **Secure Communication**:
   - Always use HTTPS
   - Verify SSL certificate
   - Don't access over public WiFi without VPN

## FAQ

### General Questions

**Q: How often is the dashboard updated?**
A: The dashboard updates in real-time via WebSocket. Statistics refresh every 10 seconds.

**Q: Can I access the dashboard on mobile?**
A: Yes, the dashboard is fully responsive and works on mobile devices. There's also a dedicated mobile app.

**Q: How long are activity logs retained?**
A: Activity logs are retained for 90 days by default. Contact support to adjust retention period.

**Q: Can I delete activity logs?**
A: Only super admins can delete logs. This is logged for audit purposes.

### Filtering and Search

**Q: How do I search for activities by a specific user?**
A: Use the User filter dropdown or search for the username in the search box.

**Q: Can I search within metadata?**
A: Yes, use Advanced Filters → Metadata Search to query JSON metadata.

**Q: Why don't my filters show any results?**
A: Check that your date range includes the period you're interested in. Try clearing filters and applying them one at a time.

### Exporting

**Q: Why is my export taking so long?**
A: Large exports (>10,000 records) may take several minutes. Consider narrowing your date range or filters.

**Q: Can I automate exports?**
A: Yes, set up scheduled exports in Settings → Scheduled Exports.

**Q: What's the maximum export size?**
A: 10,000 records per export. For larger datasets, use the API or contact support.

### Real-Time Monitoring

**Q: Why am I not seeing real-time updates?**
A: Check your connection status (green dot in header). If disconnected, refresh the page. Ensure WebSocket connections aren't blocked by firewall.

**Q: Can I filter the real-time feed?**
A: Not directly, but you can configure notification preferences to only show specific activities.

### Performance

**Q: The dashboard is slow. What can I do?**
A: Try:
- Narrowing your date range
- Reducing items per page
- Clearing browser cache
- Using a modern browser (Chrome, Firefox, Edge)

**Q: Can I improve chart performance?**
A: Yes, reduce the time range or use aggregated views (daily instead of hourly).

### Troubleshooting

**Q: I can't log in. What should I do?**
A: 
1. Verify your credentials
2. Check if MFA is enabled and code is correct
3. Try password reset
4. Contact support if issue persists

**Q: I'm getting "Access Denied" errors.**
A: Your account may not have admin privileges. Contact your system administrator.

**Q: The page won't load.**
A:
1. Check internet connection
2. Clear browser cache
3. Try different browser
4. Check if service is down (status page)

## Getting Help

### Support Resources

- **Documentation**: [docs.labtech-geolab.com](https://docs.labtech-geolab.com)
- **Video Tutorials**: [youtube.com/labtech-geolab](https://youtube.com/labtech-geolab)
- **Knowledge Base**: [help.labtech-geolab.com](https://help.labtech-geolab.com)

### Contact Support

- **Email**: support@labtech-geolab.com
- **Phone**: 1-800-LABTECH
- **Live Chat**: Available in dashboard (bottom right)
- **Support Hours**: Monday-Friday, 9 AM - 5 PM EST

### Reporting Issues

When reporting issues, include:
- Screenshot of error
- Steps to reproduce
- Browser and version
- Date and time of issue
- Your username (not password!)

## Appendix

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus search box |
| `Ctrl+F` | Open filter panel |
| `Ctrl+E` | Export data |
| `Ctrl+R` | Refresh data |
| `Esc` | Close modal/dialog |
| `?` | Show keyboard shortcuts |

### Action Types Reference

| Action | Description | Example |
|--------|-------------|---------|
| read | View or access content | Opening a file |
| write | Create or modify content | Editing a document |
| delete | Remove content | Deleting a file |
| open | Navigate to page | Opening dashboard |
| download | Download file | Saving file locally |

### Resource Types Reference

| Type | Description | Example |
|------|-------------|---------|
| file | Individual file | `/projects/report.pdf` |
| folder | Directory | `/projects/` |
| page | Application page | `/admin/dashboard` |

### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 401 | Unauthorized (login required) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not found |
| 429 | Too many requests (rate limited) |
| 500 | Server error |
