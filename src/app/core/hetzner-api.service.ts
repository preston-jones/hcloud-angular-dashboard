import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, of, map } from 'rxjs';

export interface Server {
  id: number;
  name: string;
  status: 'running' | 'stopped' | 'error' | 'available';
  created?: string;
  server_type?: { 
    id: number;
    name: string; 
    cores: number; 
    memory: number; 
    disk: number; 
    description?: string;
    cpu_type?: string;
    storage_type?: string;
    architecture?: string;
    prices?: Array<{
      location: string;
      price_hourly: { net: string; gross: string; };
      price_monthly: { net: string; gross: string; };
    }>;
  };
  datacenter?: { 
    id: number;
    name: string;
    location: { 
      id: number;
      name: string; 
      city: string; 
      country: string; 
      description: string;
      latitude: number;
      longitude: number;
    }; 
  };
  
  // Computed properties for compatibility
  type?: string;
  location?: string;
  priceEur?: number;
  vcpus?: number;
  ram?: number;
  ssd?: number;
  country?: string;
}

/**
 * Service for managing Hetzner Cloud servers with support for both mock and real API modes
 */
@Injectable({ providedIn: 'root' })
export class HetznerApiService {
  private http = inject(HttpClient);
  private hasLoadedInitialData = false;
  private readonly MOCK_SERVERS_KEY = 'hetzner_mock_servers';

  // =============================================================================
  // STATE SIGNALS
  // =============================================================================

  servers = signal<Server[] | null>(null);
  serverTypes = signal<Server[] | null>(null);
  locations = signal<any[] | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  searchQuery = signal('');
  showDemoRestrictionDialog = signal(false);
  mode = signal<'mock' | 'real'>('mock');
  
  // =============================================================================
  // COMPUTED PROPERTIES
  // =============================================================================

  myServers = computed(() => {
    const allServers = this.servers();
    return allServers?.filter(s => s.status !== 'available') || [];
  });

  availableServerTypes = computed(() => {
    const types = this.serverTypes();
    return types?.filter(s => s.status === 'available') || [];
  });

  // =============================================================================
  // CONSTRUCTOR
  // =============================================================================

  constructor() {
    this.loadServers();
    this.loadLocations();
  }

  // =============================================================================
  // MODE MANAGEMENT
  // =============================================================================

  setMode(newMode: 'mock' | 'real'): void {
    this.mode.set(newMode);
    sessionStorage.removeItem(this.MOCK_SERVERS_KEY);
    this.hasLoadedInitialData = false;
    this.loadServers();
  }

  getCurrentMode(): 'mock' | 'real' {
    return this.mode();
  }

  isUsingMockData(): boolean {
    return this.mode() === 'mock';
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  setSearchQuery(query: string) {
    this.searchQuery.set(query);
  }

  closeDemoRestrictionDialog(): void {
    this.showDemoRestrictionDialog.set(false);
  }

  forceReloadServers(): void {
    this.hasLoadedInitialData = false;
    this.loadServers();
  }

  // =============================================================================
  // TOKEN MANAGEMENT
  // =============================================================================

  setToken(token: string): void {
    sessionStorage.setItem('hz.token', token);
  }

  getToken(): string {
    return sessionStorage.getItem('hz.token') || '';
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private getEndpoint(path: string): string {
    if (this.mode() === 'mock') {
      return `/assets/mock/${path}.json`;
    } else {
      return `https://api.hetzner.cloud/v1/${path}`;
    }
  }

  private getAuthHeaders() {
    const token = sessionStorage.getItem('hz.token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // =============================================================================
  // DATA LOADING METHODS
  // =============================================================================

  /** Load servers from current mode (mock or real API) */
  loadServers(): void {
    // In mock mode, check if we have persisted changes first
    if (this.mode() === 'mock') {
      const persistedServers = sessionStorage.getItem(this.MOCK_SERVERS_KEY);
      if (persistedServers) {
        try {
          const servers = JSON.parse(persistedServers);
          this.servers.set(servers);
          this.hasLoadedInitialData = true;
          return;
        } catch (error) {
          // Silently fall back to loading from JSON if parsing fails
        }
      }
    }

    this.loading.set(true);
    this.error.set(null);

    const endpoint = this.getEndpoint('servers');
    const headers = this.getAuthHeaders();
    const httpOptions = headers.Authorization ? { headers: { ...headers } } : {};

    this.http.get<any>(endpoint, httpOptions).pipe(
      map(response => response.servers || []),
      catchError((err: HttpErrorResponse) => {
        this.error.set(err.message || 'Failed to load servers');
        return of([]);
      })
    ).subscribe(servers => {
      this.servers.set(servers);
      this.loading.set(false);
      
      // In mock mode, persist the initial data
      if (this.mode() === 'mock' && !this.hasLoadedInitialData) {
        sessionStorage.setItem(this.MOCK_SERVERS_KEY, JSON.stringify(servers));
        this.hasLoadedInitialData = true;
      }
    });
  }

  /** Load server types (available configurations) from current mode */
  loadServerTypes(): void {
    this.loading.set(true);
    this.error.set(null);

    const endpoint = this.getEndpoint('server_types');
    const headers = this.getAuthHeaders();
    const httpOptions = headers.Authorization ? { headers: { ...headers } } : {};

    this.http.get<any>(endpoint, httpOptions).pipe(
      map(response => {
        const serverTypes = response.server_types || [];
        return this.transformServerTypesToServers(serverTypes);
      }),
      catchError((err: HttpErrorResponse) => {
        this.error.set(err.message || 'Failed to load server types');
        return of([]);
      })
    ).subscribe(servers => {
      this.serverTypes.set(servers);
      this.loading.set(false);
    });
  }

  /** Load locations from current mode (mock or real API) */
  loadLocations() {
    const endpoint = this.getEndpoint('locations');
    const headers = this.getAuthHeaders();
    const httpOptions = headers.Authorization ? { headers: { ...headers } } : {};

    this.http.get<any>(endpoint, httpOptions).pipe(
      catchError((err: HttpErrorResponse) => {
        return of({ locations: [] });
      })
    ).subscribe(res => {
      this.locations.set(res?.locations ?? []);
    });
  }

  // =============================================================================
  // SERVER OPERATIONS (MOCK MODE ONLY)
  // =============================================================================

  /** Create a new server from a server type configuration */
  createServerFromType(serverType: Server): void {
    if (this.mode() !== 'mock') {
      this.showDemoRestrictionDialog.set(true);
      return;
    }

    const createdId = Date.now() + Math.floor(Math.random() * 1000);
    
    const newServer: Server = {
      ...serverType,
      id: createdId,
      name: `${serverType.type}-${Date.now()}`,
      status: 'running',
      created: new Date().toISOString(),
    };

    const currentServers = this.servers() || [];
    const updatedServers = [...currentServers, newServer];
    this.servers.set(updatedServers);
    
    // Persist changes to sessionStorage in mock mode
    sessionStorage.setItem(this.MOCK_SERVERS_KEY, JSON.stringify(updatedServers));
  }

  /** Update server status */
  updateServerStatus(serverId: number, newStatus: 'running' | 'stopped' | 'error' | 'available'): void {
    if (this.mode() !== 'mock') {
      this.showDemoRestrictionDialog.set(true);
      return;
    }

    const currentServers = this.servers();
    if (currentServers) {
      const updatedServers = currentServers.map(server => 
        server.id === serverId ? { ...server, status: newStatus } : server
      );
      this.servers.set(updatedServers);
      
      // Persist status changes to sessionStorage in mock mode
      sessionStorage.setItem(this.MOCK_SERVERS_KEY, JSON.stringify(updatedServers));
    }
  }

  /** Delete a server */
  deleteServer(serverId: number): void {
    if (this.mode() !== 'mock') {
      this.showDemoRestrictionDialog.set(true);
      return;
    }

    const currentServers = this.servers();
    if (currentServers) {
      const filteredServers = currentServers.filter(server => server.id !== serverId);
      this.servers.set(filteredServers);
      
      // Persist changes to sessionStorage in mock mode
      sessionStorage.setItem(this.MOCK_SERVERS_KEY, JSON.stringify(filteredServers));
    }
  }

  /** Reboot a server */
  rebootServer(serverId: number): void {
    if (this.mode() !== 'mock') {
      this.showDemoRestrictionDialog.set(true);
      return;
    }
    // In real implementation, this would make an API call
  }

  // =============================================================================
  // UTILITY METHODS FOR UI
  // =============================================================================

  /** Get country flag emoji for a country code */
  getCountryFlag(countryCode: string): string {
    if (!countryCode || countryCode === 'Unknown') return '🌍';
    
    const flagMap: Record<string, string> = {
      'DE': '🇩🇪', 'FI': '🇫🇮', 'US': '🇺🇸', 'UK': '🇬🇧', 'FR': '🇫🇷',
      'NL': '🇳🇱', 'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰', 'AT': '🇦🇹',
      'CH': '🇨🇭', 'BE': '🇧🇪', 'IT': '🇮🇹', 'ES': '🇪🇸', 'PL': '🇵🇱',
      'CZ': '🇨🇿', 'SG': '🇸🇬'
    };
    
    return flagMap[countryCode.toUpperCase()] || countryCode.toUpperCase();
  }

  /** Check if server has country data */
  hasCountryData(server: Server): boolean {
    return !!server.datacenter?.location?.country && server.datacenter.location.country !== 'Unknown';
  }

  // =============================================================================
  // PRIVATE TRANSFORMATION METHODS
  // =============================================================================

  /** Transform server types API response to Server interface */
  private transformServerTypesToServers(serverTypes: any[]): Server[] {
    const servers: Server[] = [];
    
    serverTypes.slice(0, 5).forEach((st: any, index: number) => {
      st.prices?.forEach((price: any, priceIndex: number) => {
        if (priceIndex < 3) {
          servers.push({
            id: Date.now() + index * 1000 + priceIndex,
            name: `${st.name.toUpperCase()} - ${st.description}`,
            status: 'available',
            created: new Date().toISOString(),
            server_type: st
          });
        }
      });
    });
    
    return servers;
  }

  /** Calculate price for a server type */
  private calculatePrice(serverType: any): number {
    if (!serverType) return 0;
    const basePrice = 2.0;
    const cpuPrice = (serverType.cores || 1) * 1.5;
    const memPrice = (serverType.memory || 1) * 0.5;
    return +(basePrice + cpuPrice + memPrice).toFixed(2);
  }
}