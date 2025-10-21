export interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  action: 'read' | 'write' | 'delete' | 'open' | 'download';
  resourceType: 'file' | 'folder' | 'page';
  resourcePath: string;
  metadata?: Record<string, any>;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

export interface ActivityLogResponse {
  data: ActivityLog[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ActivityLogFilters {
  userId?: string;
  startDate?: string;
  endDate?: string;
  action?: string;
  resourcePath?: string;
  page?: number;
  limit?: number;
}

export type SortField = 'timestamp' | 'username' | 'action';
export type SortDirection = 'asc' | 'desc';
