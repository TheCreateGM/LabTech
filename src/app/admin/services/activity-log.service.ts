import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActivityLogResponse, ActivityLogFilters } from '../models/activity-log.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ActivityLogService {
  private apiUrl = `${environment.apiUrl || 'http://localhost:3000'}/api/v1/activities`;

  constructor(private http: HttpClient) {}

  getActivityLogs(filters?: ActivityLogFilters): Observable<ActivityLogResponse> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.userId) params = params.set('userId', filters.userId);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.action) params = params.set('action', filters.action);
      if (filters.resourcePath) params = params.set('resourcePath', filters.resourcePath);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<ActivityLogResponse>(this.apiUrl, { params });
  }

  getActivityById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  exportActivities(format: 'csv' | 'json', filters?: ActivityLogFilters): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    
    if (filters) {
      if (filters.userId) params = params.set('userId', filters.userId);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.action) params = params.set('action', filters.action);
      if (filters.resourcePath) params = params.set('resourcePath', filters.resourcePath);
    }

    return this.http.get(`${this.apiUrl}/export`, { 
      params, 
      responseType: 'blob' 
    });
  }

  getActivityStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }
}
