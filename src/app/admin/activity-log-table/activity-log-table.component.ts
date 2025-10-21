import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonInfiniteScroll, ModalController, Platform, ToastController } from '@ionic/angular';
import { ActivityLogService } from '../services/activity-log.service';
import { ActivityLog, SortField, SortDirection } from '../models/activity-log.interface';
import { ActivityFilterComponent } from '../activity-filter/activity-filter.component';
import { ExportDialogComponent } from '../export-dialog/export-dialog.component';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { OfflineService } from '../services/offline.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-activity-log-table',
  standalone: true,
  imports: [CommonModule, IonicModule, ActivityFilterComponent],
  templateUrl: './activity-log-table.component.html',
  styleUrls: ['./activity-log-table.component.scss']
})
export class ActivityLogTableComponent implements OnInit, OnDestroy {
  @ViewChild(IonInfiniteScroll) infiniteScroll!: IonInfiniteScroll;

  activityLogs: ActivityLog[] = [];
  isLoading = false;
  isMobile = false;
  isOnline = true;
  hasMore = true;
  currentPage = 1;
  pageSize = 50;
  
  sortField: SortField = 'timestamp';
  sortDirection: SortDirection = 'desc';
  
  filters: any = {};
  showFilters = false;
  
  private networkSubscription?: Subscription;

  constructor(
    private activityLogService: ActivityLogService,
    private modalCtrl: ModalController,
    private platform: Platform,
    private offlineService: OfflineService,
    private toastCtrl: ToastController
  ) {
    this.isMobile = this.platform.width() < 768;
  }

  ngOnInit() {
    // Subscribe to network status changes
    this.networkSubscription = this.offlineService.isOnline$.subscribe(async (isOnline) => {
      this.isOnline = isOnline;
      
      if (isOnline) {
        // Back online - show toast and reload data
        await this.showToast('Back online! Syncing data...', 'success');
        this.loadActivityLogs();
      } else {
        // Offline - show toast and load cached data
        await this.showToast('You are offline. Showing cached data.', 'warning');
        this.loadCachedData();
      }
    });
    
    // Initial load
    this.loadActivityLogs();
  }
  
  ngOnDestroy() {
    // Unsubscribe from network status
    if (this.networkSubscription) {
      this.networkSubscription.unsubscribe();
    }
  }
  
  /**
   * Load cached activity logs when offline
   */
  private loadCachedData() {
    const cachedLogs = this.offlineService.getCachedActivityLogs();
    if (cachedLogs.length > 0) {
      this.activityLogs = cachedLogs;
      this.hasMore = false; // No pagination for cached data
    } else {
      this.activityLogs = [];
    }
  }
  
  /**
   * Show toast message
   */
  private async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      color,
      icon: color === 'success' ? 'checkmark-circle' : color === 'warning' ? 'warning' : 'alert-circle'
    });
    await toast.present();
  }

  loadActivityLogs(event?: any) {
    if (this.isLoading) return;
    
    // If offline, load cached data
    if (!this.isOnline) {
      this.loadCachedData();
      if (event) {
        event.target.complete();
      }
      return;
    }
    
    this.isLoading = true;
    
    const requestFilters = {
      ...this.filters,
      page: this.currentPage,
      limit: this.pageSize
    };

    this.activityLogService.getActivityLogs(requestFilters).subscribe({
      next: (response) => {
        if (this.currentPage === 1) {
          this.activityLogs = response.data;
          // Cache the first page of data for offline viewing
          this.offlineService.cacheActivityLogs(response.data);
        } else {
          this.activityLogs = [...this.activityLogs, ...response.data];
        }
        
        this.hasMore = response.hasMore;
        this.isLoading = false;
        
        if (event) {
          event.target.complete();
        }
      },
      error: (error) => {
        console.error('Error loading activity logs:', error);
        this.isLoading = false;
        if (event) {
          event.target.complete();
        }
      }
    });
  }

  loadMore(event: any) {
    if (this.hasMore) {
      this.currentPage++;
      this.loadActivityLogs(event);
    } else {
      event.target.complete();
    }
  }

  doRefresh(event: any) {
    this.currentPage = 1;
    this.activityLogs = [];
    this.hasMore = true;
    this.loadActivityLogs();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  async sortBy(field: SortField) {
    // Add haptic feedback on mobile
    if (this.isMobile && this.platform.is('capacitor')) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
    
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'desc';
    }
    
    this.activityLogs.sort((a, b) => {
      let aValue: any = a[field];
      let bValue: any = b[field];
      
      if (field === 'timestamp') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (this.sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }

  getSortIcon(field: SortField): string {
    if (this.sortField !== field) return 'swap-vertical-outline';
    return this.sortDirection === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline';
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  onFiltersApplied(filters: any) {
    // If offline, queue the filter action
    if (!this.isOnline) {
      this.offlineService.queueAction({
        type: 'filter',
        data: filters
      });
      this.showToast('Filter will be applied when back online', 'warning');
      return;
    }
    
    this.filters = filters;
    this.currentPage = 1;
    this.activityLogs = [];
    this.hasMore = true;
    this.loadActivityLogs();
  }

  onFiltersClear() {
    // If offline, queue the clear action
    if (!this.isOnline) {
      this.offlineService.queueAction({
        type: 'filter',
        data: {}
      });
      this.showToast('Filters will be cleared when back online', 'warning');
      return;
    }
    
    this.filters = {};
    this.currentPage = 1;
    this.activityLogs = [];
    this.hasMore = true;
    this.loadActivityLogs();
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

  async openExportDialog() {
    // Check if offline
    if (!this.isOnline) {
      await this.showToast('Export is not available offline', 'warning');
      return;
    }
    
    // Add haptic feedback on mobile
    if (this.isMobile && this.platform.is('capacitor')) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
    
    const modal = await this.modalCtrl.create({
      component: ExportDialogComponent
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.success) {
      // Add success haptic feedback
      if (this.isMobile && this.platform.is('capacitor')) {
        await Haptics.notification({ type: 'success' as any });
      }
      console.log('Export completed successfully');
    }
  }
}
