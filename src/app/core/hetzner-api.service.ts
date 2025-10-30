import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, of, map } from 'rxjs';
import { Server, ApiMode, CACHE_KEYS, DEFAULT_INCLUDED_TRAFFIC, ServerProtection } from './models';

/**
 * Service for managing Hetzner Cloud servers with support for both mock and real API modes
 */
@Injectable({ providedIn: 'root' })
export class HetznerApiService {
  private http = inject(HttpClient);
  private hasLoadedInitialData = false;

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
  mode = signal<ApiMode>(this.getPersistedMode());
  
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
  // MODE PERSISTENCE
  // =============================================================================

  /** Get persisted mode from localStorage */
  private getPersistedMode(): ApiMode {
    try {
      const saved = localStorage.getItem(CACHE_KEYS.MODE);
      return (saved === 'real') ? 'real' : 'mock';
    } catch {
      return 'mock';
    }
  }

  /** Persist mode to localStorage */
  private persistMode(mode: ApiMode): void {
    try {
      localStorage.setItem(CACHE_KEYS.MODE, mode);
    } catch {
      // localStorage might not be available
    }
  }

  // =============================================================================
  // CONSTRUCTOR
  // =============================================================================

  constructor() {
    // Clear old cache system on startup, keep user-created servers
    sessionStorage.removeItem(CACHE_KEYS.MOCK_SERVERS);
    this.hasLoadedInitialData = false;
    
    this.loadServers();
    this.loadLocations();
  }

  // =============================================================================
  // MODE MANAGEMENT
  // =============================================================================

  setMode(newMode: ApiMode): void {
    this.mode.set(newMode);
    this.persistMode(newMode);  // Persist the mode setting
    // Clear both cache systems when switching modes
    sessionStorage.removeItem(CACHE_KEYS.MOCK_SERVERS);
    sessionStorage.removeItem(CACHE_KEYS.USER_SERVERS);
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

  // =============================================================================
  // PUBLIC API METHODS
  // =============================================================================

  /** Manually retry loading data (useful for error recovery) */
  retry(): void {
    this.loadServers();
    this.loadServerTypes();
    this.loadLocations();
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
    // Clear old cache system but preserve user-created servers
    sessionStorage.removeItem(CACHE_KEYS.MOCK_SERVERS);
    this.hasLoadedInitialData = false;
    this.loadServers();
  }

  // =============================================================================
  // TOKEN MANAGEMENT
  // =============================================================================

  setToken(token: string): void {
    sessionStorage.setItem(CACHE_KEYS.TOKEN, token);
  }

  getToken(): string {
    return sessionStorage.getItem(CACHE_KEYS.TOKEN) || '';
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
    const token = sessionStorage.getItem(CACHE_KEYS.TOKEN);
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // =============================================================================
  // DATA LOADING METHODS
  // =============================================================================

  /** Load servers from current mode (mock or real API) */
  loadServers(): void {
    this.setLoadingState(true);
    
    const { endpoint, httpOptions } = this.prepareServerRequest();
    
    this.http.get<any>(endpoint, httpOptions).pipe(
      map(response => this.processServerResponse(response)),
      catchError((err: HttpErrorResponse) => this.handleServerError(err))
    ).subscribe(servers => {
      this.finalizeServerLoad(servers);
    });
  }

  private setLoadingState(loading: boolean): void {
    this.loading.set(loading);
    this.error.set(null);
  }

  private prepareServerRequest(): { endpoint: string, httpOptions: any } {
    const endpoint = this.getEndpoint('servers');
    const headers = this.getAuthHeaders();
    const httpOptions = headers.Authorization ? { headers: { ...headers } } : {};
    return { endpoint, httpOptions };
  }

  private processServerResponse(response: any): any[] {
    const servers = response.servers || [];
    return servers.map((server: any) => ({
      ...server,
      priceEur: this.calculateServerPrice(server)
    }));
  }

  private handleServerError(err: HttpErrorResponse) {
    const errorMessage = err.message || 'Failed to load servers';
    console.warn('Server loading failed:', errorMessage);
    this.error.set(errorMessage);
    return of([]);
  }

  private finalizeServerLoad(servers: any[]): void {
    if (this.mode() === 'mock') {
      const cachedServers = this.getCachedUserServers();
      const mergedServers = [...servers, ...cachedServers];
      this.servers.set(mergedServers);
    } else {
      this.servers.set(servers);
    }
    
    this.loading.set(false);
    this.hasLoadedInitialData = true;
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
  createServerFromType(serverType: Server, customName?: string): void {
    if (!this.checkWritePermission()) return;

    const createdId = Date.now() + Math.floor(Math.random() * 1000);
    
    // Use datacenter from serverType if available, otherwise pick from existing servers
    let datacenterToUse = serverType.datacenter;
    
    if (!datacenterToUse) {
      // If serverType doesn't have datacenter, pick one from existing servers
      const existingServers = this.servers() || [];
      const serversWithDatacenters = existingServers.filter(s => s.datacenter);
      if (serversWithDatacenters.length > 0) {
        const randomExistingServer = serversWithDatacenters[Math.floor(Math.random() * serversWithDatacenters.length)];
        datacenterToUse = randomExistingServer.datacenter;
      }
    }
    
    // If still no datacenter, fall back to default location
    if (!datacenterToUse) {
      const availableLocations = this.locations() || [];
      const defaultLocation = availableLocations.find(l => l.name === 'hel1') || availableLocations[0];
      if (defaultLocation) {
        datacenterToUse = {
          id: defaultLocation.id,
          name: defaultLocation.name,
          location: defaultLocation
        };
      }
    }
    
    // Generate fallback server name (only used if no custom name provided)
    const generateFallbackName = (serverType: Server, datacenter: any): string => {
      const memory = serverType.server_type?.memory || 8;
      const locationName = datacenter?.location?.name || datacenter?.name || 'hel1';
      const instanceNumber = Math.floor(Math.random() * 999) + 1;
      
      return `server-${memory}gb-${locationName}-${instanceNumber}`;
    };
    
    const serverName = customName || generateFallbackName(serverType, datacenterToUse);
    
    const newServer: Server = {
      ...serverType,
      id: createdId,
      name: serverName,
      status: 'running',
      created: new Date().toISOString(),
      ingoing_traffic: 0,
      outgoing_traffic: 0,
      included_traffic: serverType.included_traffic || this.getIncludedTrafficFromServerType(serverType),
      datacenter: datacenterToUse,
    };

    this.addServerToState(newServer);
  }

  /** Update server status */
  updateServerStatus(serverId: number, newStatus: 'running' | 'stopped' | 'error' | 'available'): void {
    if (!this.checkWritePermission()) return;

    const currentServers = this.servers();
    if (currentServers) {
      const updatedServers = currentServers.map(server => 
        server.id === serverId ? { ...server, status: newStatus } : server
      );
      this.servers.set(updatedServers);
      
      // Update only user-created servers in cache, not static mock data
      const userServers = this.getCachedUserServers();
      const updatedUserServers = userServers.map(server => 
        server.id === serverId ? { ...server, status: newStatus } : server
      );
      sessionStorage.setItem(CACHE_KEYS.USER_SERVERS, JSON.stringify(updatedUserServers));
    }
  }

  /** Update server protection status */
  updateServerProtection(serverId: number, isProtected: boolean): void {
    if (!this.checkWritePermission()) return;

    const currentServers = this.servers();
    if (currentServers) {
      const updatedServers = currentServers.map(server => 
        server.id === serverId ? { ...server, protection: { delete: isProtected } } : server
      );
      this.servers.set(updatedServers);
      
      // Update only user-created servers in cache, not static mock data
      const userServers = this.getCachedUserServers();
      const updatedUserServers = userServers.map(server => 
        server.id === serverId ? { ...server, protection: { delete: isProtected } } : server
      );
      sessionStorage.setItem(CACHE_KEYS.USER_SERVERS, JSON.stringify(updatedUserServers));
    }
  }

  /** Delete a server */
  deleteServer(serverId: number): void {
    if (!this.checkWritePermission()) return;

    const currentServers = this.servers();
    if (currentServers) {
      // Check if server is protected from deletion
      const serverToDelete = currentServers.find(server => server.id === serverId);
      if (serverToDelete?.protection?.delete) {
        console.warn(`Cannot delete server ${serverToDelete.name}: Server is protected from deletion`);
        // You could show an error dialog here
        return;
      }

      const filteredServers = currentServers.filter(server => server.id !== serverId);
      this.servers.set(filteredServers);
      
      // Remove from user-created servers only, preserve static mock data
      this.removeUserServerFromCache(serverId);
    }
  }

  /** Reboot a server */
  rebootServer(serverId: number): void {
    if (!this.checkWritePermission()) return;
    // In real implementation, this would make an API call
  }

  private checkWritePermission(): boolean {
    if (this.mode() !== 'mock') {
      this.showDemoRestrictionDialog.set(true);
      return false;
    }
    return true;
  }

  private addServerToState(newServer: Server): void {
    const currentServers = this.servers() || [];
    const updatedServers = [...currentServers, newServer];
    this.servers.set(updatedServers);
    this.saveUserServerToCache(newServer);
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
      const serverVariants = this.createServerVariants(st, index);
      servers.push(...serverVariants);
    });
    
    return servers;
  }

  private createServerVariants(serverType: any, index: number): Server[] {
    const variants: Server[] = [];
    
    serverType.prices?.forEach((price: any, priceIndex: number) => {
      if (priceIndex < 3) {
        variants.push(this.createAvailableServer(serverType, price, index, priceIndex));
      }
    });
    
    return variants;
  }

  private createAvailableServer(serverType: any, price: any, index: number, priceIndex: number): Server {
    return {
      id: Date.now() + index * 1000 + priceIndex,
      name: `${serverType.name.toUpperCase()} - ${serverType.description}`,
      status: 'available',
      created: new Date().toISOString(),
      server_type: serverType,
      priceEur: parseFloat(price.price_monthly?.gross || this.calculatePrice(serverType).toString())
    };
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
      const cached = sessionStorage.getItem(CACHE_KEYS.USER_SERVERS);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  /** Save user-created servers to cache */
  private saveUserServerToCache(server: Server): void {
    const userServers = this.getCachedUserServers();
    userServers.push(server);
    sessionStorage.setItem(CACHE_KEYS.USER_SERVERS, JSON.stringify(userServers));
  }

  /** Remove user-created server from cache */
  private removeUserServerFromCache(serverId: number): void {
    const userServers = this.getCachedUserServers();
    const filtered = userServers.filter(s => s.id !== serverId);
    sessionStorage.setItem(CACHE_KEYS.USER_SERVERS, JSON.stringify(filtered));
  }

  /** Get included traffic from server type pricing */
  private getIncludedTrafficFromServerType(serverType: Server): number {
    if (serverType.server_type?.prices && serverType.server_type.prices.length > 0) {
      // Use the first pricing entry's included traffic as default
      return serverType.server_type.prices[0].included_traffic || DEFAULT_INCLUDED_TRAFFIC;
    }
    // Default fallback (20TB in bytes)
    return DEFAULT_INCLUDED_TRAFFIC;
  }
}