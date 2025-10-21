import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { Preferences } from '@capacitor/preferences';
import { environment } from '../../environments/environment';

/**
 * User interface representing authenticated user data
 */
export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  mfaEnabled?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

/**
 * Login response interface
 */
interface LoginResponse {
  message: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: User;
  mfaRequired?: boolean;
  tempToken?: string;
}

/**
 * Token refresh response interface
 */
interface RefreshResponse {
  message: string;
  accessToken: string;
  expiresIn: number;
}

/**
 * User info response interface
 */
interface UserInfoResponse {
  user: User;
}

/**
 * Authentication service for managing user authentication, JWT tokens, and session state
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl || 'http://localhost:3000/api/v1';
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user';
  private readonly TOKEN_REFRESH_BUFFER = 60; // Refresh token 60 seconds before expiry

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private tokenRefreshTimer: any;

  constructor(private http: HttpClient) {
    this.initializeAuth();
  }

  /**
   * Initialize authentication state from stored tokens
   */
  private async initializeAuth(): Promise<void> {
    try {
      const accessToken = await this.getStoredAccessToken();
      const user = await this.getStoredUser();

      if (accessToken && user) {
        this.currentUserSubject.next(user);
        this.scheduleTokenRefresh();
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      await this.clearStoredAuth();
    }
  }

  /**
   * Login with username and password
   * @param username - User's username
   * @param password - User's password
   * @returns Observable with login response
   */
  public login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, {
      username,
      password
    }).pipe(
      tap(async (response) => {
        if (response.mfaRequired && response.tempToken) {
          // Store temporary token for MFA verification
          await this.storeAccessToken(response.tempToken);
        } else if (response.accessToken && response.refreshToken && response.user) {
          // Store tokens and user data
          await this.storeAccessToken(response.accessToken);
          await this.storeRefreshToken(response.refreshToken);
          await this.storeUser(response.user);
          this.currentUserSubject.next(response.user);
          
          // Schedule automatic token refresh
          this.scheduleTokenRefresh(response.expiresIn);
        }
      }),
      catchError(error => {
        console.error('Login failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Verify MFA code
   * @param code - 6-digit TOTP code
   * @returns Observable with verification response
   */
  public verifyMFA(code: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/mfa/verify`, {
      code
    }).pipe(
      tap(async (response) => {
        if (response.accessToken && response.refreshToken && response.user) {
          await this.storeAccessToken(response.accessToken);
          await this.storeRefreshToken(response.refreshToken);
          await this.storeUser(response.user);
          this.currentUserSubject.next(response.user);
          this.scheduleTokenRefresh(response.expiresIn);
        }
      }),
      catchError(error => {
        console.error('MFA verification failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout current user
   * @returns Observable with logout response
   */
  public logout(): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/logout`, {}).pipe(
      tap(async () => {
        await this.clearStoredAuth();
        this.currentUserSubject.next(null);
        this.cancelTokenRefresh();
      }),
      catchError(async (error) => {
        // Clear local auth even if server request fails
        await this.clearStoredAuth();
        this.currentUserSubject.next(null);
        this.cancelTokenRefresh();
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh access token using refresh token
   * @returns Observable with new access token
   */
  public refreshToken(): Observable<RefreshResponse> {
    return new Observable(observer => {
      this.getStoredRefreshToken().then(refreshToken => {
        if (!refreshToken) {
          observer.error(new Error('No refresh token available'));
          return;
        }

        this.http.post<RefreshResponse>(`${this.API_URL}/auth/refresh`, {
          refreshToken
        }).pipe(
          tap(async (response) => {
            await this.storeAccessToken(response.accessToken);
            this.scheduleTokenRefresh(response.expiresIn);
          }),
          catchError(async (error) => {
            // If refresh fails, clear auth and force re-login
            await this.clearStoredAuth();
            this.currentUserSubject.next(null);
            return throwError(() => error);
          })
        ).subscribe({
          next: (response) => observer.next(response),
          error: (error) => observer.error(error),
          complete: () => observer.complete()
        });
      });
    });
  }

  /**
   * Get current authenticated user information
   * @returns Observable with user data
   */
  public getCurrentUser(): Observable<UserInfoResponse> {
    return this.http.get<UserInfoResponse>(`${this.API_URL}/auth/me`).pipe(
      tap(async (response) => {
        await this.storeUser(response.user);
        this.currentUserSubject.next(response.user);
      }),
      catchError(error => {
        console.error('Failed to get current user:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if user is authenticated
   * @returns True if user has valid access token
   */
  public async isAuthenticated(): Promise<boolean> {
    const accessToken = await this.getStoredAccessToken();
    return !!accessToken;
  }

  /**
   * Check if current user has specific role
   * @param role - Role to check (e.g., 'admin', 'user')
   * @returns True if user has the specified role
   */
  public hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === role;
  }

  /**
   * Get access token for HTTP requests
   * @returns Access token or null
   */
  public async getAccessToken(): Promise<string | null> {
    return this.getStoredAccessToken();
  }

  /**
   * Schedule automatic token refresh before expiry
   * @param expiresIn - Token expiry time in seconds (optional)
   */
  private scheduleTokenRefresh(expiresIn?: number): void {
    this.cancelTokenRefresh();

    // Default to 15 minutes (900 seconds) if not provided
    const expiry = expiresIn || 900;
    
    // Schedule refresh 60 seconds before token expires
    const refreshTime = Math.max(0, (expiry - this.TOKEN_REFRESH_BUFFER)) * 1000;

    this.tokenRefreshTimer = timer(refreshTime).pipe(
      switchMap(() => this.refreshToken())
    ).subscribe({
      next: () => console.log('Token refreshed automatically'),
      error: (error) => console.error('Automatic token refresh failed:', error)
    });
  }

  /**
   * Cancel scheduled token refresh
   */
  private cancelTokenRefresh(): void {
    if (this.tokenRefreshTimer) {
      this.tokenRefreshTimer.unsubscribe();
      this.tokenRefreshTimer = null;
    }
  }

  /**
   * Store access token in secure storage
   */
  private async storeAccessToken(token: string): Promise<void> {
    await Preferences.set({
      key: this.ACCESS_TOKEN_KEY,
      value: token
    });
  }

  /**
   * Store refresh token in secure storage
   */
  private async storeRefreshToken(token: string): Promise<void> {
    await Preferences.set({
      key: this.REFRESH_TOKEN_KEY,
      value: token
    });
  }

  /**
   * Store user data in secure storage
   */
  private async storeUser(user: User): Promise<void> {
    await Preferences.set({
      key: this.USER_KEY,
      value: JSON.stringify(user)
    });
  }

  /**
   * Get stored access token
   */
  private async getStoredAccessToken(): Promise<string | null> {
    const result = await Preferences.get({ key: this.ACCESS_TOKEN_KEY });
    return result.value;
  }

  /**
   * Get stored refresh token
   */
  private async getStoredRefreshToken(): Promise<string | null> {
    const result = await Preferences.get({ key: this.REFRESH_TOKEN_KEY });
    return result.value;
  }

  /**
   * Get stored user data
   */
  private async getStoredUser(): Promise<User | null> {
    const result = await Preferences.get({ key: this.USER_KEY });
    if (result.value) {
      try {
        return JSON.parse(result.value);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Clear all stored authentication data
   */
  private async clearStoredAuth(): Promise<void> {
    await Preferences.remove({ key: this.ACCESS_TOKEN_KEY });
    await Preferences.remove({ key: this.REFRESH_TOKEN_KEY });
    await Preferences.remove({ key: this.USER_KEY });
  }
}
