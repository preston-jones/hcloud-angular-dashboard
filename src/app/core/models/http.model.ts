/**
 * HTTP and API response types
 */

import { HttpResponse } from '@angular/common/http';

/**
 * Generic API response structure from Hetzner Cloud API
 */
export interface HetznerApiResponse<T> {
  [key: string]: T[] | any;
  meta?: {
    pagination?: {
      page: number;
      per_page: number;
      previous_page: number | null;
      next_page: number | null;
      last_page: number;
      total_entries: number;
    };
  };
}

/**
 * HTTP response types
 */
export type ApiHttpResponse<T> = HttpResponse<HetznerApiResponse<T>>;

/**
 * HTTP options for API requests
 */
export interface HttpOptions {
  observe?: 'body' | 'response';
  headers?: Record<string, string>;
}

/**
 * Server update partial type
 */
export type ServerUpdate = Partial<Pick<
  import('./server.model').Server,
  'name' | 'status' | 'protection' | 'labels' | 'backup_window'
>>;