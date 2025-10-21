import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { filter, Subscription } from 'rxjs';
import { ActivityTrackingService } from './services/activity-tracking.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private trackingService = inject(ActivityTrackingService);
  private routerSubscription?: Subscription;

  constructor() {}

  async ngOnInit() {
    // Initialize activity tracking
    await this.trackingService.initializeTracking();

    // Subscribe to router events to track navigation
    this.routerSubscription = this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe((event: any) => {
        this.trackNavigation(event);
      });
  }

  ngOnDestroy() {
    // Clean up subscription
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }

    // Stop auto-flush timer
    this.trackingService.stopAutoFlush();
  }

  /**
   * Track navigation events
   */
  private async trackNavigation(event: NavigationEnd) {
    try {
      // Extract route parameters and query params from URL
      const url = event.urlAfterRedirects || event.url;
      const urlTree = this.router.parseUrl(url);
      const primarySegment = urlTree.root.children['primary'];
      
      // Build metadata object
      const metadata: Record<string, any> = {
        previousUrl: event.url !== event.urlAfterRedirects ? event.url : undefined,
        navigationId: event.id,
        timestamp: new Date().toISOString()
      };

      // Extract query parameters
      if (Object.keys(urlTree.queryParams).length > 0) {
        metadata['queryParams'] = urlTree.queryParams;
      }

      // Extract route parameters (path segments)
      if (primarySegment) {
        const segments = primarySegment.segments.map(s => s.path);
        if (segments.length > 0) {
          metadata['routeSegments'] = segments;
        }
      }

      // Track the page view
      await this.trackingService.trackPageView(url, metadata);
    } catch (error) {
      console.error('Failed to track navigation:', error);
    }
  }
}
