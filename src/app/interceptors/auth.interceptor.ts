import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { from } from 'rxjs';

/**
 * HTTP interceptor to attach JWT tokens to outgoing requests
 * and handle token refresh on 401 errors
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Skip adding token for auth endpoints to avoid circular dependencies
  if (req.url.includes('/auth/login') || 
      req.url.includes('/auth/register') || 
      req.url.includes('/auth/refresh')) {
    return next(req);
  }

  // Get access token and add to request
  return from(authService.getAccessToken()).pipe(
    switchMap(token => {
      // Clone request and add authorization header if token exists
      const authReq = token
        ? req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          })
        : req;

      return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          // If 401 error and not already a refresh request, try to refresh token
          if (error.status === 401 && !req.url.includes('/auth/refresh')) {
            return authService.refreshToken().pipe(
              switchMap(() => {
                // Retry original request with new token
                return from(authService.getAccessToken()).pipe(
                  switchMap(newToken => {
                    const retryReq = newToken
                      ? req.clone({
                          setHeaders: {
                            Authorization: `Bearer ${newToken}`
                          }
                        })
                      : req;
                    return next(retryReq);
                  })
                );
              }),
              catchError(refreshError => {
                // If refresh fails, logout user
                authService.logout().subscribe();
                return throwError(() => refreshError);
              })
            );
          }

          return throwError(() => error);
        })
      );
    })
  );
};
