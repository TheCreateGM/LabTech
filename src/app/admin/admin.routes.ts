import { Routes } from '@angular/router';
import { adminGuard } from '../guards/admin.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    children: [
      {
        path: '',
        redirectTo: 'logs',
        pathMatch: 'full'
      },
      {
        path: 'logs',
        loadComponent: () => import('./activity-log-table/activity-log-table.component').then(m => m.ActivityLogTableComponent)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./activity-chart/activity-chart.component').then(m => m.ActivityChartComponent)
      },
      {
        path: 'monitor',
        loadComponent: () => import('./real-time-monitor/real-time-monitor.component').then(m => m.RealTimeMonitorComponent)
      }
    ]
  }
];
