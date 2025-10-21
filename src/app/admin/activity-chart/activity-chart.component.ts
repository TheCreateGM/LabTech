import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivityLogService } from '../services/activity-log.service';

interface ActivityStats {
  totalActivities: number;
  actionBreakdown: { action: string; count: number; percentage: number }[];
  topUsers: { username: string; count: number }[];
  topFiles: { path: string; count: number }[];
  activitiesOverTime: { date: string; count: number }[];
}

@Component({
  selector: 'app-activity-chart',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './activity-chart.component.html',
  styleUrls: ['./activity-chart.component.scss']
})
export class ActivityChartComponent implements OnInit {
  stats: ActivityStats | null = null;
  isLoading = false;
  dateRangeForm: FormGroup;

  constructor(
    private activityLogService: ActivityLogService,
    private fb: FormBuilder
  ) {
    this.dateRangeForm = this.fb.group({
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.isLoading = true;
    
    this.activityLogService.getActivityStats().subscribe({
      next: (data) => {
        this.stats = this.processStats(data);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.isLoading = false;
        // Use mock data for demonstration
        this.stats = this.getMockStats();
      }
    });
  }

  processStats(data: any): ActivityStats {
    // Process the raw stats data
    const total = data.totalActivities || 0;
    
    const actionBreakdown = Object.entries(data.actionBreakdown || {}).map(([action, count]: [string, any]) => ({
      action,
      count: count as number,
      percentage: total > 0 ? ((count as number) / total) * 100 : 0
    }));

    return {
      totalActivities: total,
      actionBreakdown,
      topUsers: data.topUsers || [],
      topFiles: data.topFiles || [],
      activitiesOverTime: data.activitiesOverTime || []
    };
  }

  getMockStats(): ActivityStats {
    return {
      totalActivities: 1250,
      actionBreakdown: [
        { action: 'read', count: 500, percentage: 40 },
        { action: 'write', count: 375, percentage: 30 },
        { action: 'open', count: 250, percentage: 20 },
        { action: 'download', count: 100, percentage: 8 },
        { action: 'delete', count: 25, percentage: 2 }
      ],
      topUsers: [
        { username: 'john.doe', count: 320 },
        { username: 'jane.smith', count: 280 },
        { username: 'bob.wilson', count: 210 },
        { username: 'alice.brown', count: 180 },
        { username: 'charlie.davis', count: 150 }
      ],
      topFiles: [
        { path: '/src/app/main.ts', count: 145 },
        { path: '/src/components/header.tsx', count: 120 },
        { path: '/config/database.json', count: 98 },
        { path: '/docs/README.md', count: 87 },
        { path: '/tests/unit/auth.test.ts', count: 76 }
      ],
      activitiesOverTime: [
        { date: '2024-10-15', count: 180 },
        { date: '2024-10-16', count: 220 },
        { date: '2024-10-17', count: 195 },
        { date: '2024-10-18', count: 240 },
        { date: '2024-10-19', count: 210 },
        { date: '2024-10-20', count: 205 }
      ]
    };
  }

  applyDateRange() {
    // In a real implementation, pass date range to API
    this.loadStats();
  }

  clearDateRange() {
    this.dateRangeForm.reset();
    this.loadStats();
  }

  getActionColor(action: string): string {
    const colors: Record<string, string> = {
      'read': 'primary',
      'write': 'success',
      'delete': 'danger',
      'open': 'secondary',
      'download': 'tertiary'
    };
    return colors[action] || 'medium';
  }

  getMaxCount(items: { count: number }[]): number {
    return Math.max(...items.map(item => item.count), 1);
  }

  getBarWidth(count: number, max: number): number {
    return (count / max) * 100;
  }
}
