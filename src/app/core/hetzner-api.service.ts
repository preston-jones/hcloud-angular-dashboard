import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, of, switchMap, map } from 'rxjs';

export interface Server {
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'running' | 'stopped' | 'error';
  priceEur: number;
  // Erweiterte Hetzner-Felder für später
  created?: string;
  server_type?: { name: string; cores: number; memory: number; disk: number; description?: string; };
  datacenter?: { location: { name: string; city: string; country: string; }; };
  country?: string; // Country code for easy access
}

type ServersResponse = { servers: any[] };
type LocationsResponse = { locations: any[] };

@Injectable({ providedIn: 'root' })
export class HetznerApiService {
  private http = inject(HttpClient);

  // State für transformierte Daten
  servers = signal<Server[] | null>(null);
  locations = signal<any[] | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  searchQuery = signal('');

  /** Mock-Modus? (assets/mock vs echte API) */
  private isMockMode(): boolean {
    return !environment.apiBase.startsWith('http') || environment.apiBase.includes('assets');
  }

  /** Set search query from topbar */
  setSearchQuery(query: string) {
    this.searchQuery.set(query);
  }

  /** Auth-Headers für echte API */
  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('HCLOUD_TOKEN');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  /** Load Servers mit Transformation */
  loadServers() {
    this.loading.set(true);
    this.error.set(null);

    const url = this.isMockMode() 
      ? 'assets/mock/servers.json'  // Relativer Pfad für Angular
      : `${environment.apiBase}/servers`;

    const request$ = this.isMockMode()
      ? this.http.get<ServersResponse>(url)
      : this.http.get<ServersResponse>(url, { headers: this.authHeaders() });

    request$.pipe(
      map(response => this.transformServersData(response)),
      catchError((err: HttpErrorResponse) => {
        console.error('Server loading failed:', err);
        
        // Fallback zu Mock wenn konfiguriert und nicht bereits im Mock-Modus
        if (environment.useMockFallback && !this.isMockMode()) {
          console.warn('🔄 Falling back to mock data...');
          return this.http.get<ServersResponse>('assets/mock/servers.json').pipe(
            map(response => this.transformServersData(response)),
            catchError(() => of([]))
          );
        }
        
        this.error.set(err.message || 'Failed to load servers');
        return of([]);
      })
    ).subscribe(servers => {
      this.servers.set(servers);
      this.loading.set(false);
    });
  }

  /** Transformiert Hetzner API Response zu unserem Interface */
  private transformServersData(response: ServersResponse): Server[] {
    const servers = response.servers || [];
    
    return servers.map((server: any) => ({
      id: server.id?.toString() || '',
      name: server.name || 'Unknown',
      type: server.server_type?.name || 'Unknown',
      location: server.datacenter?.location?.name || 'Unknown',
      status: this.mapStatus(server.status),
      priceEur: this.calculatePrice(server.server_type),
      // Zusätzliche Felder für später
      created: server.created,
      server_type: server.server_type,
      datacenter: server.datacenter,
      country: server.datacenter?.location?.country || 'Unknown'
    }));
  }

  /** Status-Mapping */
  private mapStatus(hetznerStatus: string): 'running' | 'stopped' | 'error' {
    switch (hetznerStatus) {
      case 'running': return 'running';
      case 'off': 
      case 'stopped': return 'stopped';
      default: return 'error';
    }
  }

  /** Einfache Preis-Berechnung */
  private calculatePrice(serverType: any): number {
    if (!serverType) return 0;
    const basePrice = 2.0;
    const cpuPrice = (serverType.cores || 1) * 1.5;
    const memPrice = (serverType.memory || 1) * 0.5;
    return +(basePrice + cpuPrice + memPrice).toFixed(2);
  }

  /** Locations laden (für später) */
  loadLocations() {
    const url = this.isMockMode() 
      ? '/assets/mock/locations.json'  // Absoluter Pfad
      : `${environment.apiBase}/locations`;

    const request$ = this.isMockMode()
      ? this.http.get<LocationsResponse>(url)
      : this.http.get<LocationsResponse>(url, { headers: this.authHeaders() });

    request$.pipe(
      catchError((err: HttpErrorResponse) => {
        console.error('Locations loading failed:', err);
        if (environment.useMockFallback && !this.isMockMode()) {
          return this.http.get<LocationsResponse>('/assets/mock/locations.json');
        }
        return of({ locations: [] });
      })
    ).subscribe(res => {
      this.locations.set(res?.locations ?? []);
    });
  }

  /** Debug-Info für UI */
  get isUsingMockData(): boolean {
    return this.isMockMode();
  }

  /** Get country flag (dummy implementation with initials) */
  getCountryFlag(countryCode: string): string {
    if (!countryCode || countryCode === 'Unknown') return '🌍';
    
    // Country flag mapping - can be extended with more countries
    // Note: This is kept in the service rather than component for reusability
    // across different components that might need country flags
    const flagMap: Record<string, string> = {
      'DE': '🇩🇪', // Germany
      'FI': '🇫🇮', // Finland  
      'US': '🇺🇸', // United States
      'UK': '🇬🇧', // United Kingdom
      'FR': '🇫🇷', // France
      'NL': '🇳🇱', // Netherlands
      'SE': '🇸🇪', // Sweden
      'NO': '🇳🇴', // Norway
      'DK': '🇩🇰', // Denmark
      'AT': '🇦🇹', // Austria
      'CH': '🇨🇭', // Switzerland
      'BE': '🇧🇪', // Belgium
      'IT': '🇮🇹', // Italy
      'ES': '🇪🇸', // Spain
      'PL': '🇵🇱', // Poland
      'CZ': '🇨🇿', // Czech Republic
      'SG': '🇸🇬', // Singapore
    };
    
    // Return flag emoji if available, otherwise fallback to country code
    return flagMap[countryCode.toUpperCase()] || countryCode.toUpperCase();
  }

  /** Check if country data is available */
  hasCountryData(server: Server): boolean {
    // Country check is handled here in the service to centralize validation logic
    // This allows consistent behavior across all components using server data
    return !!server.country && server.country !== 'Unknown';
  }
}