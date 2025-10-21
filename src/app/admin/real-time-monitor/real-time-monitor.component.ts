import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { WebSocketService, ConnectionStatus } from '../services/websocket.service';
import { ActivityLog } from '../models/activity-log.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-real-time-monitor',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './real-time-monitor.component.html',
  styleUrls: ['./real-time-monitor.component.scss']
})
export class RealTimeMonitorComponent implements OnInit, OnDestroy {
  recentActivities: ActivityLog[] = [];
  maxActivities = 20;
  connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  ConnectionStatus = ConnectionStatus; // Expose enum to template

  private subscriptions: Subscription[] = [];

  constructor(private wsService: WebSocketService) {}

  ngOnInit() {
    // Subscribe to connection status
    this.subscriptions.push(
      this.wsService.getConnectionStatus().subscribe(status => {
        this.connectionStatus = status;
      })
    );

    // Subscribe to new activity events
    this.subscriptions.push(
      this.wsService.on('activity:new').subscribe((activity: ActivityLog) => {
        this.addActivity(activity);
      })
    );

    // Subscribe to batch activity events
    this.subscriptions.push(
      this.wsService.on('activity:batch').subscribe((activities: ActivityLog[]) => {
        activities.forEach(activity => this.addActivity(activity));
      })
    );

    // Connect to WebSocket
    // In a real implementation, get the JWT token from auth service
    const token = localStorage.getItem('access_token') || 'demo-token';
    this.wsService.connect(token);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.wsService.disconnect();
  }

  addActivity(activity: ActivityLog) {
    // Add to beginning of array
    this.recentActivities.unshift(activity);

    // Keep only the latest 20 activities
    if (this.recentActivities.length > this.maxActivities) {
      this.recentActivities = this.recentActivities.slice(0, this.maxActivities);
    }
  }

  reconnect() {
    const token = localStorage.getItem('access_token') || 'demo-token';
    this.wsService.connect(token);
  }

  clearActivities() {
    this.recentActivities = [];
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
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

  getConnectionStatusColor(): string {
    switch (this.connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return 'success';
      case ConnectionStatus.CONNECTING:
        return 'warning';
      case ConnectionStatus.ERROR:
        return 'danger';
      default:
        return 'medium';
    }
  }

  getConnectionStatusIcon(): string {
    switch (this.connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return 'checkmark-circle';
      case ConnectionStatus.CONNECTING:
        return 'sync';
      case ConnectionStatus.ERROR:
        return 'alert-circle';
      default:
        return 'radio-button-off';
    }
  }

  trackByActivityId(index: number, activity: ActivityLog): string {
    return activity.id;
  }
}
