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
      included_traffic?: number;
      price_per_tb_traffic?: { net: string; gross: string; };
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
  public_net?: {
    ipv4?: {
      id: number;
      ip: string;
      blocked: boolean;
      dns_ptr?: string;
    };
    ipv6?: {
      id: number;
      ip: string;
      blocked: boolean;
      dns_ptr?: string[];
    };
    floating_ips?: any[];
    // Traffic data may be nested in public_net in some API responses
    ingoing_traffic?: number;
    outgoing_traffic?: number;
  };
  
  // Traffic properties (may be at root level or nested)
  traffic?: {
    ingoing?: number;
    outgoing?: number;
  };
  included_traffic?: number;
  ingoing_traffic?: number;
  outgoing_traffic?: number;
  
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
  private readonly USER_SERVERS_KEY = 'hetzner_user_servers';

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
    // Clear old cache system on startup, keep user-created servers
    sessionStorage.removeItem(this.MOCK_SERVERS_KEY);
    this.hasLoadedInitialData = false;
    
    this.loadServers();
    this.loadLocations();
  }

  // =============================================================================
  // MODE MANAGEMENT
  // =============================================================================

  setMode(newMode: 'mock' | 'real'): void {
    this.mode.set(newMode);
    // Clear both cache systems when switching modes
    sessionStorage.removeItem(this.MOCK_SERVERS_KEY);
    sessionStorage.removeItem(this.USER_SERVERS_KEY);
    this.hasLoadedInitialData = false;
    this.loadServers();
  }

  /** Check if write operations are allowed (only in mock mode) */
  isWriteMode(): boolean {
    return this.mode() === 'mock';
  }

  /** Check if currently using real API (read-only mode) */
  isReadOnlyMode(): boolean {
    return this.mode() === 'real';
  }

  /** Extract incoming traffic from server (works with both mock and real API) */
  getServerIncomingTraffic(server: Server): number {
    return server.ingoing_traffic || 
           server.public_net?.ingoing_traffic || 
           server.traffic?.ingoing || 
           0;
  }

  /** Extract outgoing traffic from server (works with both mock and real API) */
  getServerOutgoingTraffic(server: Server): number {
    return server.outgoing_traffic || 
           server.public_net?.outgoing_traffic || 
           server.traffic?.outgoing || 
           0;
  }

  /** Format bytes to human readable string */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /** Get server monthly price (works with both mock and real API) */
  getServerPrice(server: Server): number {
    if (server.priceEur) {
      return server.priceEur;
    }
    return this.calculateServerPrice(server);
  }

  /** Get server price formatted as string */
  getServerPriceFormatted(server: Server): string {
    const price = this.getServerPrice(server);
    return price.toFixed(2);
  }

  /** Get server CPU count as string */
  getCpuCount(server: Server): string {
    return server.server_type?.cores ? `${server.server_type.cores}` : '0';
  }

  /** Get server RAM size as string */
  getRamSize(server: Server): string {
    return server.server_type?.memory ? `${server.server_type.memory} GB` : '0 GB';
  }

  /** Get server disk size as string */
  getDiskSize(server: Server): string {
    return server.server_type?.disk ? `${server.server_type.disk} GB` : '0 GB';
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
    // Only clear the old cache system, keep user-created servers
    sessionStorage.removeItem(this.MOCK_SERVERS_KEY);
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
    this.loading.set(true);
    this.error.set(null);

    const endpoint = this.getEndpoint('servers');
    const headers = this.getAuthHeaders();
    const httpOptions = headers.Authorization ? { headers: { ...headers } } : {};

    this.http.get<any>(endpoint, httpOptions).pipe(
      map(response => {
        const servers = response.servers || [];
        // Add computed properties to servers
        return servers.map((server: any) => ({
          ...server,
          priceEur: this.calculateServerPrice(server)
        }));
      }),
      catchError((err: HttpErrorResponse) => {
        this.error.set(err.message || 'Failed to load servers');
        return of([]);
      })
    ).subscribe(servers => {
      // In mock mode, merge with user-created servers from cache
      // In real API mode, just use the servers as-is (read-only)
      if (this.mode() === 'mock') {
        const cachedServers = this.getCachedUserServers();
        const mergedServers = [...servers, ...cachedServers];
        this.servers.set(mergedServers);
      } else {
        // Real API is read-only - just display the servers
        this.servers.set(servers);
      }
      
      this.loading.set(false);
      this.hasLoadedInitialData = true;
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
    // Real API is read-only - show demo restriction dialog
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
      // For new servers, traffic starts at 0 (realistic for newly created servers)
      ingoing_traffic: 0,
      outgoing_traffic: 0,
      // Ensure included_traffic is set from server type pricing
      included_traffic: serverType.included_traffic || this.getIncludedTrafficFromServerType(serverType),
    };

    const currentServers = this.servers() || [];
    const updatedServers = [...currentServers, newServer];
    this.servers.set(updatedServers);
    
    // Use new caching strategy for user-created servers (mock mode only)
    this.saveUserServerToCache(newServer);
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
            server_type: st,
            // Add computed properties for compatibility
            priceEur: parseFloat(price.price_monthly?.gross || this.calculatePrice(st).toString())
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

  /** Calculate price for a server using its pricing data */
  private calculateServerPrice(server: any): number {
    if (!server?.server_type?.prices) return 0;
    
    // Get the server location
    const serverLocation = server.datacenter?.location?.name;
    
    // Find pricing for the server's location
    const pricing = server.server_type.prices.find((p: any) => p.location === serverLocation);
    
    if (pricing?.price_monthly?.gross) {
      return parseFloat(pricing.price_monthly.gross);
    }
    
    // Fallback to calculated price
    return this.calculatePrice(server.server_type);
  }

  /** Get user-created servers from cache (for write operations only) */
  private getCachedUserServers(): Server[] {
    try {
      const cached = sessionStorage.getItem(this.USER_SERVERS_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  /** Save user-created servers to cache */
  private saveUserServerToCache(server: Server): void {
    const userServers = this.getCachedUserServers();
    userServers.push(server);
    sessionStorage.setItem(this.USER_SERVERS_KEY, JSON.stringify(userServers));
  }

  /** Remove user-created server from cache */
  private removeUserServerFromCache(serverId: number): void {
    const userServers = this.getCachedUserServers();
    const filtered = userServers.filter(s => s.id !== serverId);
    sessionStorage.setItem(this.USER_SERVERS_KEY, JSON.stringify(filtered));
  }

  /** Get included traffic from server type pricing */
  private getIncludedTrafficFromServerType(serverType: Server): number {
    if (serverType.server_type?.prices && serverType.server_type.prices.length > 0) {
      // Use the first pricing entry's included traffic as default
      return serverType.server_type.prices[0].included_traffic || 21990232555520;
    }
    // Default fallback (20TB in bytes)
    return 21990232555520;
  }
}