import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Network } from '@capacitor/network';
import { ActivityLog } from '../models/activity-log.interface';

/**
 * Offline service for managing network connectivity and caching
 */
@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private readonly CACHE_KEY = 'admin_activity_logs_cache';
  private readonly QUEUE_KEY = 'admin_pending_actions_queue';
  private readonly MAX_CACHED_LOGS = 100;

  private isOnlineSubject = new BehaviorSubject<boolean>(true);
  public isOnline$ = this.isOnlineSubject.asObservable();

  constructor() {
    this.initializeNetworkListener();
  }

  /**
   * Initialize network status listener
   */
  private async initializeNetworkListener(): Promise<void> {
    // Get initial network status
    const status = await Network.getStatus();
    this.isOnlineSubject.next(status.connected);

    // Listen for network status changes
    Network.addListener('networkStatusChange', (status) => {
      this.isOnlineSubject.next(status.connected);
      
      // If back online, process queued actions
      if (status.connected) {
        this.processQueuedActions();
      }
    });
  }

  /**
   * Get current network status
   */
  public async getNetworkStatus(): Promise<boolean> {
    const status = await Network.getStatus();
    return status.connected;
  }

  /**
   * Cache activity logs for offline viewing
   * @param logs - Activity logs to cache
   */
  public async cacheActivityLogs(logs: ActivityLog[]): Promise<void> {
    try {
      // Keep only the most recent logs
      const logsToCache = logs.slice(0, this.MAX_CACHED_LOGS);
      
      // Store in IndexedDB (using localStorage as fallback for simplicity)
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(logsToCache));
    } catch (error) {
      console.error('Failed to cache activity logs:', error);
    }
  }

  /**
   * Get cached activity logs
   * @returns Cached activity logs or empty array
   */
  public getCachedActivityLogs(): ActivityLog[] {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Failed to retrieve cached activity logs:', error);
    }
    return [];
  }

  /**
   * Queue an action to be performed when back online
   * @param action - Action to queue
   */
  public queueAction(action: PendingAction): void {
    try {
      const queue = this.getActionQueue();
      queue.push({
        ...action,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to queue action:', error);
    }
  }

  /**
   * Get queued actions
   * @returns Array of pending actions
   */
  private getActionQueue(): PendingAction[] {
    try {
      const queue = localStorage.getItem(this.QUEUE_KEY);
      if (queue) {
        return JSON.parse(queue);
      }
    } catch (error) {
      console.error('Failed to retrieve action queue:', error);
    }
    return [];
  }

  /**
   * Process queued actions when back online
   */
  private async processQueuedActions(): Promise<void> {
    const queue = this.getActionQueue();
    
    if (queue.length === 0) {
      return;
    }

    console.log(`Processing ${queue.length} queued actions...`);

    // Process each action
    for (const action of queue) {
      try {
        await this.executeAction(action);
      } catch (error) {
        console.error('Failed to execute queued action:', error);
      }
    }

    // Clear the queue
    localStorage.removeItem(this.QUEUE_KEY);
  }

  /**
   * Execute a queued action
   * @param action - Action to execute
   */
  private async executeAction(action: PendingAction): Promise<void> {
    // This would call the appropriate service method based on action type
    console.log('Executing action:', action);
    
    // Implementation would depend on the specific action type
    // For now, just log it
  }

  /**
   * Clear all cached data
   */
  public clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
    localStorage.removeItem(this.QUEUE_KEY);
  }

  /**
   * Get cache size information
   */
  public getCacheInfo(): { cachedLogs: number; queuedActions: number } {
    const logs = this.getCachedActivityLogs();
    const queue = this.getActionQueue();
    
    return {
      cachedLogs: logs.length,
      queuedActions: queue.length
    };
  }
}

/**
 * Interface for pending actions
 */
export interface PendingAction {
  type: 'filter' | 'export' | 'sort';
  data: any;
  timestamp?: string;
}
