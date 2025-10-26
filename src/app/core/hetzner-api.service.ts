import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, of, switchMap } from 'rxjs';

type ServersResponse = { servers: any[] };
type LocationsResponse = { locations: any[] };

@Injectable({ providedIn: 'root' })
export class HetznerApiService {
  private http = inject(HttpClient);

  servers   = signal<any[] | null>(null);
  locations = signal<any[] | null>(null);
  loading   = signal(false);
  error     = signal<string | null>(null);

  /** Falls apiBase mit http(s) beginnt => echte API; sonst Assets/Mock */
  private isRealApi(): boolean {
    return /^https?:\/\//.test(environment.apiBase);
  }

  /** Optional: Token aus z.B. localStorage lesen (niemals committen!) */
  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('HCLOUD_TOKEN'); // oder via Interceptor/Backend-Proxy
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  /** Generische Loader-Funktion mit Fallback-Logik */
  private loadWithFallback<T>(path: string) {
    const usingRealApi = this.isRealApi();
    const realUrl  = usingRealApi ? `${environment.apiBase}${path}` : null;
    const mockUrl  = `assets/mock${path}.json`;

    this.loading.set(true);
    this.error.set(null);

    const primary$ = usingRealApi
      ? this.http.get<T>(realUrl!, { headers: this.authHeaders() })
      : this.http.get<T>(mockUrl);

    return primary$.pipe(
      catchError((err: HttpErrorResponse) => {
        // Bei 0/401/403/5xx oder Netzwerkfehlern auf Mock fallen (wenn erlaubt)
        const shouldFallback =
          environment.useMockFallback &&
          (err.status === 0 || err.status === 401 || err.status === 403 || (err.status >= 500));

        if (shouldFallback) {
          return this.http.get<T>(mockUrl);
        }
        this.error.set(err.message || 'Request failed');
        return of(null as unknown as T);
      }),
      switchMap(res => of(res))
    );
  }

  /** Public APIs */
  loadServers() {
    this.loadWithFallback<ServersResponse>('/servers').subscribe(res => {
      this.servers.set(res?.servers ?? []);
      this.loading.set(false);
    });
  }

  loadLocations() {
    this.loadWithFallback<LocationsResponse>('/locations').subscribe(res => {
      this.locations.set(res?.locations ?? []);
      this.loading.set(false);
    });
  }
}