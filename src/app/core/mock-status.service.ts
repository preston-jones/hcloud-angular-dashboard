import { Injectable, signal } from '@angular/core';

export interface MockStatus {
  status: number;
  statusText: string;
  endpoint: string;
  method: string;
  date: string;
  latencyMs: number;
  source: 'mock';
}

@Injectable({
  providedIn: 'root'
})
export class MockStatusService {
  private readonly statusHistory = signal<MockStatus[]>([]);

  private ok = [200, 204];
  private clientErr = [403, 429];
  private serverErr = [500];

  async generateBatch(): Promise<MockStatus[]> {
    try {
      const response = await fetch('/assets/mock/endpoint-map.json');
      const map = await response.json();
      const now = Date.now();

      const statuses = map.endpoints.map((e: any, i: number) => {
        const r = Math.random();
        const status =
          r < e.weight * 0.85 ? this.pick(this.ok) :
          r < e.weight * 0.95 ? this.pick(this.clientErr) :
                                this.pick(this.serverErr);

        const statusText = this.getStatusText(status);
        const latencyMs = this.getLatencyFor(status);

        return {
          status,
          statusText,
          endpoint: e.path,
          method: e.method,
          date: new Date(now - i * 800).toISOString(),
          latencyMs,
          source: 'mock' as const
        };
      });

      // Keep only the last 10 entries
      this.statusHistory.set(statuses.slice(0, 10));
      return statuses.slice(0, 10);
    } catch (error) {
      console.warn('Failed to load endpoint map, using fallback data');
      return this.getFallbackStatuses();
    }
  }

  getStatusHistory(): MockStatus[] {
    return this.statusHistory();
  }

  private pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private getStatusText(code: number): string {
    const statusTexts: Record<number, string> = {
      200: 'OK',
      204: 'No Content',
      403: 'Forbidden',
      429: 'Too Many Requests',
      500: 'Server Error'
    };
    return statusTexts[code] ?? 'Unknown';
  }

  private getLatencyFor(code: number): number {
    const base = code >= 500 ? 220 : code >= 400 ? 120 : 48;
    return Math.round(base + Math.random() * base);
  }

  private getFallbackStatuses(): MockStatus[] {
    const fallbackEndpoints = [
      { path: '/servers', method: 'GET' },
      { path: '/locations', method: 'GET' },
      { path: '/images', method: 'GET' },
      { path: '/networks', method: 'GET' },
      { path: '/load_balancers', method: 'GET' }
    ];

    const now = Date.now();
    return fallbackEndpoints.map((e, i) => ({
      status: 200,
      statusText: 'OK',
      endpoint: e.path,
      method: e.method,
      date: new Date(now - i * 800).toISOString(),
      latencyMs: 48 + Math.round(Math.random() * 48),
      source: 'mock' as const
    }));
  }
}