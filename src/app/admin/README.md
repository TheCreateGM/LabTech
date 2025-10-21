# Admin Dashboard Module

This module provides a comprehensive admin dashboard for monitoring user activity in the LabTech GeoLab application.

## Features Implemented

### 1. Admin Module Structure (Task 8.1) ✅
- Lazy-loaded admin module with routing
- Main dashboard layout with responsive navigation
- Ionic grid system for mobile-first design
- Child routes for logs, analytics, and real-time monitoring

### 2. Activity Log Table (Task 8.2) ✅
- Paginated table with infinite scroll (50 items per page)
- Sortable columns: timestamp, username, action
- Desktop table view and mobile card view
- Pull-to-refresh functionality
- Loading skeletons for better UX
- Color-coded action badges

### 3. Activity Filter Component (Task 8.3) ✅
- Reactive forms for filter inputs
- Filters: user ID, date range, action type, resource path
- URL query parameter persistence for bookmarking
- Apply and clear filter buttons
- Responsive layout

### 4. Export Functionality (Task 8.4) ✅
- Modal dialog for export configuration
- CSV and JSON format support
- Date range and filter options
- Progress indicator during export
- Warning for large datasets (>10,000 records)
- Automatic file download using Blob API

### 5. Real-time Activity Monitor (Task 8.5) ✅
- WebSocket client with native WebSocket API
- Connection status indicator
- Automatic reconnection with exponential backoff
- Live activity feed (latest 20 activities)
- Auto-scroll for new activities
- Connection management (connect/disconnect)

### 6. Activity Analytics (Task 8.6) ✅
- Date range selector for analytics
- Total activities overview card
- Action breakdown with progress bars
- Top users bar chart
- Top files bar chart
- Activities over time line chart
- Responsive visualizations using CSS

## File Structure

```
src/app/admin/
├── README.md
├── admin.routes.ts                          # Admin module routes
├── admin-dashboard/
│   ├── admin-dashboard.component.ts         # Main dashboard layout
│   ├── admin-dashboard.component.html
│   └── admin-dashboard.component.scss
├── activity-log-table/
│   ├── activity-log-table.component.ts      # Activity logs table
│   ├── activity-log-table.component.html
│   └── activity-log-table.component.scss
├── activity-filter/
│   ├── activity-filter.component.ts         # Filter controls
│   ├── activity-filter.component.html
│   └── activity-filter.component.scss
├── export-dialog/
│   ├── export-dialog.component.ts           # Export modal
│   ├── export-dialog.component.html
│   └── export-dialog.component.scss
├── real-time-monitor/
│   ├── real-time-monitor.component.ts       # Real-time feed
│   ├── real-time-monitor.component.html
│   └── real-time-monitor.component.scss
├── activity-chart/
│   ├── activity-chart.component.ts          # Analytics charts
│   ├── activity-chart.component.html
│   └── activity-chart.component.scss
├── models/
│   └── activity-log.interface.ts            # TypeScript interfaces
└── services/
    ├── activity-log.service.ts              # Activity log API service
    └── websocket.service.ts                 # WebSocket client service
```

## Usage

### Accessing the Admin Dashboard

Navigate to `/admin` in the application. The dashboard will lazy-load the admin module.

### Navigation

The dashboard provides three main sections:
- **Activity Logs**: View and filter activity logs
- **Analytics**: View statistics and charts
- **Real-time Monitor**: Watch live activity feed

### API Integration

The admin dashboard expects the following backend endpoints:

```typescript
GET  /api/v1/activities              // Get paginated activity logs
GET  /api/v1/activities/:id          // Get specific activity
GET  /api/v1/activities/export       // Export logs (CSV/JSON)
GET  /api/v1/activities/stats        // Get activity statistics
WS   /ws                             // WebSocket connection
```

### Environment Configuration

Update `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1'
};
```

## Dependencies

### Required
- `@angular/common`
- `@angular/core`
- `@angular/forms`
- `@angular/router`
- `@ionic/angular`
- `rxjs`

### Optional (for enhanced features)
- `socket.io-client` - For Socket.IO WebSocket support
- `chart.js` - For advanced charting
- `ng2-charts` - Angular wrapper for Chart.js

To install optional dependencies:
```bash
npm install socket.io-client chart.js ng2-charts
```

## Responsive Design

The admin dashboard is fully responsive:
- **Desktop (>768px)**: Table view with sidebar navigation
- **Mobile (<768px)**: Card view with stacked navigation

## Security Considerations

1. **Authentication**: Implement admin guard to protect routes
2. **Authorization**: Verify admin role before allowing access
3. **JWT Tokens**: Store securely and refresh automatically
4. **WebSocket Auth**: Authenticate WebSocket connections with JWT

## Future Enhancements

1. **Chart.js Integration**: Replace CSS charts with Chart.js for advanced visualizations
2. **Socket.IO**: Upgrade to Socket.IO for better WebSocket support
3. **Advanced Filters**: Add more filter options (IP range, user agent, etc.)
4. **Bulk Operations**: Select and export multiple activities
5. **Activity Details**: Modal with full activity details
6. **User Management**: Add user management interface
7. **Audit Trail**: Track admin actions

## Testing

To test the admin dashboard:

1. Start the backend server
2. Navigate to `/admin`
3. Test each feature:
   - View activity logs
   - Apply filters
   - Export data
   - Monitor real-time activities
   - View analytics

## Notes

- The WebSocket service uses native WebSocket API. For production, consider using Socket.IO for better browser compatibility and features.
- Analytics charts use CSS-based visualizations. For production, integrate Chart.js for interactive charts.
- Mock data is provided in the analytics component for demonstration purposes.
- All components are standalone and use Ionic components for consistent UI.

## Support

For issues or questions, refer to:
- [Ionic Documentation](https://ionicframework.com/docs)
- [Angular Documentation](https://angular.io/docs)
- Backend API documentation in `/backend/README.md`
