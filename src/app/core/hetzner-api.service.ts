import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, of, map } from 'rxjs';

// Constants
const REAL_BASE = 'https://api.hetzner.cloud/v1';
const MOCK_BASE = '/assets/mock';

// Helper functions for dynamic mode switching
const getMode = () => (localStorage.getItem('hz.mode') ?? 'mock');
const apiBase = () => (getMode() === 'real' ? REAL_BASE : MOCK_BASE);
const authHdr = () => {
  const t = localStorage.getItem('hz.token');
  return getMode() === 'real' && t ? { Authorization: `Bearer ${t}` } : {};
};

export interface Server {
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'running' | 'stopped' | 'error';
  priceEur: number;
  vcpus: number;
  ram: number;
  ssd: number;
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
    return getMode() === 'mock';
  }

  /** Set search query from topbar */
  setSearchQuery(query: string) {
    this.searchQuery.set(query);
  }

  /** Load Servers mit dynamischer Mode-Erkennung */
  loadServers() {
    this.loading.set(true);
    this.error.set(null);

    // Dynamic endpoint based on mode - Beispiel-GET wie beschrieben
    const endpoint = apiBase() + (getMode() === 'real' ? '/servers' : '/servers.json');
    const headers = authHdr();

    // Use proper headers object - fix for TypeScript
    const httpOptions = headers.Authorization ? { headers: new HttpHeaders(headers) } : {};

    console.log('Loading servers in mode:', getMode(), 'from endpoint:', endpoint);

    this.http.get<any>(endpoint, httpOptions).pipe(
      map(response => {
        console.log('Raw API response:', response);
        // Handle both mock format and real API format
        // Both mock and real API have { servers: [...] } structure
        const serverList = response.servers || response;
        console.log('Extracted server list:', serverList);
        return this.transformServersData(serverList);
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('Server loading failed:', err);
        this.error.set(err.message || 'Failed to load servers');
        return of([]);
      })
    ).subscribe(servers => {
      console.log('Transformed servers:', servers);
      this.servers.set(servers);
      this.loading.set(false);
    });
  }

  /** Transformiert Hetzner API Response zu unserem Interface */
  private transformServersData(serverList: any[]): Server[] {
    if (!Array.isArray(serverList)) {
      return [];
    }
    
    return serverList.map((s: any) => {
      // Both mock and real API use the same structure now
      return {
        id: s.id?.toString?.() ?? s.id,
        name: s.name || 'Unknown',
        type: s.server_type?.name || 'Unknown',                 // Same field for both
        location: s.datacenter?.location?.name || 'Unknown',    // Same field for both
        status: s.status === 'off' ? 'stopped' : s.status,      // Map 'off' → 'stopped'
        priceEur: this.calculatePrice(s.server_type),            // Calculate price from server_type
        vcpus: s.server_type?.cores || 0,
        ram: s.server_type?.memory || 0,
        ssd: s.server_type?.disk || 0,
        // Zusätzliche Felder
        created: s.created,
        server_type: s.server_type,
        datacenter: s.datacenter,
        country: s.datacenter?.location?.country || 'Unknown'
      };
    });
  }

  /** Einfache Preis-Berechnung basierend auf server_type */
  private calculatePrice(serverType: any): number {
    if (!serverType) return 0;
    const basePrice = 2.0;
    const cpuPrice = (serverType.cores || 1) * 1.5;
    const memPrice = (serverType.memory || 1) * 0.5;
    return +(basePrice + cpuPrice + memPrice).toFixed(2);
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

  /** Locations laden (für später) */
  loadLocations() {
    const endpoint = apiBase() + (getMode() === 'real' ? '/locations' : '/locations.json');
    const headers = authHdr();

    // Use proper headers object - fix for TypeScript
    const httpOptions = headers.Authorization ? { headers: new HttpHeaders(headers) } : {};

    this.http.get<LocationsResponse>(endpoint, httpOptions).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error('Locations loading failed:', err);
        return of({ locations: [] });
      })
    ).subscribe(res => {
      this.locations.set(res?.locations ?? []);
    });
  }

  /** Debug-Info für UI */
  get isUsingMockData(): boolean {
    return getMode() === 'mock';
  }

  /** Get current mode for UI */
  get currentMode(): string {
    return getMode();
  }

  /** Get current token for UI */
  get currentToken(): string {
    return localStorage.getItem('hz.token') || '';
  }

  /** Set mode and reload */
  setMode(mode: 'mock' | 'real'): void {
    console.log('Setting mode to:', mode);
    const currentMode = getMode();
    localStorage.setItem('hz.mode', mode);
    console.log('Mode changed from', currentMode, 'to', mode);
    // Automatically reload servers when mode changes
    this.loadServers();
  }

  /** Set token */
  setToken(token: string): void {
    localStorage.setItem('hz.token', token);
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