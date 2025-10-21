import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ActivityTrackingService } from '../services/activity-tracking.service';

/**
 * HTTP Interceptor to track API calls
 * Captures request metadata including URL, method, duration, and status code
 * Excludes tracking API calls to prevent infinite loops
 */
export const trackingInterceptor: HttpInterceptorFn = (req, next) => {
  const trackingService = inject(ActivityTrackingService);
  
  // Exclude tracking API calls from being tracked (prevent infinite loop)
  const isTrackingApiCall = req.url.includes('/activities') || req.url.includes('/api/v1/activities');
  
  if (isTrackingApiCall) {
    return next(req);
  }

  const startTime = Date.now();
  const method = req.method;
  const url = req.url;

  return next(req).pipe(
    tap(event => {
      // Only track successful responses
      if (event instanceof HttpResponse) {
        const duration = Date.now() - startTime;
        const status = event.status;

        // Track the API call asynchronously (don't block the response)
        trackingService.trackUserAction('api_call', {
          resourceType: 'page',
          resourcePath: url,
          method,
          duration,
          status,
          success: true
        }).catch(error => {
          // Silently fail - don't disrupt the application
          console.warn('Failed to track API call:', error);
        });
      }
    }),
    catchError((error: HttpErrorResponse) => {
      // Track failed API calls
      const duration = Date.now() - startTime;
      const status = error.status;

      trackingService.trackUserAction('api_call_error', {
        resourceType: 'page',
        resourcePath: url,
        method,
        duration,
        status,
        success: false,
        errorMessage: error.message
      }).catch(trackError => {
        // Silently fail - don't disrupt the application
        console.warn('Failed to track API call error:', trackError);
      });

      // Re-throw the error to maintain normal error handling
      return throwError(() => error);
    })
  );
};
