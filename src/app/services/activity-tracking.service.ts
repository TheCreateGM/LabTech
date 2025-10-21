import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, firstValueFrom, of } from 'rxjs';

export type AccessAction = 'read' | 'write' | 'delete' | 'open' | 'download';
export type ResourceType = 'file' | 'folder' | 'page';

export interface ActivityEvent {
  userId?: string;
  action: string;
  resourceType: ResourceType;
  resourcePath: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

interface QueuedActivity extends ActivityEvent {
  id: string;
  retryCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityTrackingService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/activities`;
  private readonly DB_NAME = 'ActivityTrackingDB';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'activityQueue';
  private readonly MAX_QUEUE_SIZE = 50;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds
  private readonly MAX_RETRY_COUNT = 3;

  private db: IDBDatabase | null = null;
  private flushTimer: any = null;
  private isInitialized = false;

  constructor() {}

  /**
   * Initialize the tracking service and IndexedDB
   */
  async initializeTracking(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.initializeIndexedDB();
      this.startAutoFlush();
      this.isInitialized = true;
      console.log('Activity tracking initialized successfully');
    } catch (error) {
      console.error('Failed to initialize activity tracking:', error);
    }
  }

  /**
   * Initialize IndexedDB for offline queue storage
   */
  private initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const objectStore = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('retryCount', 'retryCount', { unique: false });
        }
      };
    });
  }

  /**
   * Track a page view event
   */
  async trackPageView(route: string, metadata?: Record<string, any>): Promise<void> {
    const event: ActivityEvent = {
      action: 'page_view',
      resourceType: 'page',
      resourcePath: route,
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight
      },
      timestamp: new Date().toISOString()
    };

    await this.queueActivity(event);
  }

  /**
   * Track a file access event
   */
  async trackFileAccess(filePath: string, action: AccessAction): Promise<void> {
    const event: ActivityEvent = {
      action,
      resourceType: 'file',
      resourcePath: filePath,
      metadata: {
        userAgent: navigator.userAgent
      },
      timestamp: new Date().toISOString()
    };

    await this.queueActivity(event);
  }

  /**
   * Track a generic user action
   */
  async trackUserAction(action: string, details: Record<string, any>): Promise<void> {
    const event: ActivityEvent = {
      action,
      resourceType: details['resourceType'] || 'page',
      resourcePath: details['resourcePath'] || window.location.pathname,
      metadata: {
        ...details,
        userAgent: navigator.userAgent
      },
      timestamp: new Date().toISOString()
    };

    await this.queueActivity(event);
  }

  /**
   * Add activity to queue
   */
  private async queueActivity(event: ActivityEvent): Promise<void> {
    if (!this.db) {
      console.warn('IndexedDB not initialized, attempting to initialize...');
      await this.initializeTracking();
      if (!this.db) {
        console.error('Failed to initialize IndexedDB, activity not queued');
        return;
      }
    }

    const queuedActivity: QueuedActivity = {
      ...event,
      id: this.generateId(),
      retryCount: 0
    };

    try {
      await this.addToQueue(queuedActivity);
      
      // Check if we should flush immediately
      const queueSize = await this.getQueueSize();
      if (queueSize >= this.MAX_QUEUE_SIZE) {
        await this.flushQueue();
      }
    } catch (error) {
      console.error('Failed to queue activity:', error);
    }
  }

  /**
   * Add activity to IndexedDB queue
   */
  private addToQueue(activity: QueuedActivity): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.add(activity);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get current queue size
   */
  private getQueueSize(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all queued activities
   */
  private getAllQueuedActivities(): Promise<QueuedActivity[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove activity from queue
   */
  private removeFromQueue(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update activity retry count
   */
  private updateRetryCount(activity: QueuedActivity): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      activity.retryCount++;
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(activity);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Flush queue - send all queued activities to backend
   */
  async flushQueue(): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      const activities = await this.getAllQueuedActivities();
      
      if (activities.length === 0) {
        return;
      }

      console.log(`Flushing ${activities.length} queued activities...`);

      for (const activity of activities) {
        try {
          // Remove id and retryCount before sending to API
          const { id, retryCount, ...activityData } = activity;
          
          await firstValueFrom(
            this.http.post(this.API_URL, activityData).pipe(
              catchError((error: HttpErrorResponse) => {
                console.error('Failed to send activity:', error);
                return of(null);
              })
            )
          );

          // Successfully sent, remove from queue
          await this.removeFromQueue(id);
        } catch (error) {
          console.error('Error processing activity:', error);
          
          // Increment retry count
          if (activity.retryCount < this.MAX_RETRY_COUNT) {
            await this.updateRetryCount(activity);
          } else {
            // Max retries reached, remove from queue
            console.warn(`Max retries reached for activity ${activity.id}, removing from queue`);
            await this.removeFromQueue(activity.id);
          }
        }
      }

      console.log('Queue flush completed');
    } catch (error) {
      console.error('Failed to flush queue:', error);
    }
  }

  /**
   * Start automatic queue flushing
   */
  private startAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flushQueue();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Stop automatic queue flushing
   */
  stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Generate unique ID for queued activities
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all queued activities (for testing/debugging)
   */
  async clearQueue(): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('Activity queue cleared');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{ size: number; oldestTimestamp?: string }> {
    if (!this.db) {
      return { size: 0 };
    }

    try {
      const activities = await this.getAllQueuedActivities();
      const size = activities.length;
      
      if (size === 0) {
        return { size };
      }

      const oldestTimestamp = activities.reduce((oldest, activity) => {
        return activity.timestamp < oldest ? activity.timestamp : oldest;
      }, activities[0].timestamp);

      return { size, oldestTimestamp };
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      return { size: 0 };
    }
  }
}
