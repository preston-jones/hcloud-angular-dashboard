import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, of, map } from 'rxjs';
import { Server, ApiMode, CACHE_KEYS } from './models';
import { DataStorageService } from './data-storage.service';
import { ServerGenerationService } from './server-generation.service';
import { HetznerUtilsService } from './hetzner-utils.service';
import { environment } from './../../environments/environment';

/**
 * Simplified Hetzner Cloud API service
 * Handles HTTP requests and basic state management
 * Uses unified storage for both mock and real API modes
 */
@Injectable({ providedIn: 'root' })
export class HetznerApiService {
  private http = inject(HttpClient);
  private storage = inject(DataStorageService);
  private serverGen = inject(ServerGenerationService);
  private utils = inject(HetznerUtilsService);

  // =============================================================================
  // STATE SIGNALS
  // =============================================================================
  loading = signal(false);
  error = signal<string | null>(null);
  searchQuery = signal('');
  showDemoRestrictionDialog = signal(false);
  mode = signal<ApiMode>(this.getPersistedMode());

  // Data signals - always read from storage for consistency
  servers = signal<Server[]>([]);
  serverTypes = signal<any[]>([]);
  locations = signal<any[]>([]);
  datacenters = signal<any[]>([]);
  images = signal<any[]>([]);
  firewalls = signal<any[]>([]);
  actions = signal<any[]>([]);
  floatingIps = signal<any[]>([]);
  loadBalancers = signal<any[]>([]);
  networks = signal<any[]>([]);
  
  // System status data for dashboard
  endpointStatus = signal<Array<{
    status: number;
    statusText: string;
    endpoint: string;
    method: string;
    date: string;
  }>>([]);

  // =============================================================================
  // COMPUTED PROPERTIES
  // =============================================================================
  myServers = computed(() => {
    return this.servers().filter(s => s.status !== 'available');
  });

  availableServerTypes = computed(() => {
    return this.serverTypes();
  });

  // Get recent endpoint status for dashboard
  getRecentEndpointStatus = computed(() => {
    return this.endpointStatus();
  });

  // =============================================================================
  // CONSTRUCTOR & INITIALIZATION
  // =============================================================================
  constructor() {
    this.loadAllData();
  }

  // =============================================================================
  // DATA LOADING
  // =============================================================================
  /** Load all required data on startup */
  private loadAllData(): void {
    this.loadServers();
    this.loadServerTypes();
    this.loadLocations();
    this.loadDatacenters();
    this.loadImages();
    this.loadFirewalls();
    this.loadActions();
    this.loadFloatingIps();
    this.loadLoadBalancers();
    this.loadNetworks();
  }

  /** Load servers based on current mode */
  loadServers(): void {
    this.loading.set(true);
    this.error.set(null);

    const endpoint = this.mode() === 'mock' 
      ? this.getMockEndpoint('servers')
      : this.getEndpoint('servers');

    this.http.get(endpoint, this.createHttpOptions()).pipe(
      map((response: any) => this.extractResponseData(response, 'servers')),
      map(servers => servers.map((server: any) => ({ ...server, priceEur: this.utils.getServerPrice(server) }))),
      catchError((err: HttpErrorResponse) => {
        this.logApiCall('servers', err, true);
        this.error.set(err.message || 'Failed to load servers');
        return of([]);
      })
    ).subscribe(servers => {
      if (servers.length > 0) {
        this.storage.saveServers(servers);
      }
      this.servers.set(this.storage.getServers());
      this.loading.set(false);
    });
  }

  /** Load server types with automatic fallback */
  loadServerTypes(): void {
    const endpoint = this.getEndpoint('server_types');
    const httpOptions = this.getHttpOptions();

    // Always try proxy first
    this.http.get(endpoint, httpOptions).pipe(
      map((response: any) => this.serverGen.transformServerTypesToServers(response.server_types || [])),
      catchError(() => {
        // On error, try mock data if fallback is enabled
        if (environment.useMockFallback) {
          const mockEndpoint = this.getMockEndpoint('server_types');
          return this.http.get(mockEndpoint).pipe(
            map((response: any) => this.serverGen.transformServerTypesToServers(response.server_types || []))
          );
        }
        return of([]);
      })
    ).subscribe(serverTypes => {
      // Save valid data regardless of source
      if (serverTypes.length > 0) {
        this.storage.saveServerTypes(serverTypes);
      }
      // Always get from storage to ensure consistent data format
      this.serverTypes.set(this.storage.getServerTypes());
    });
  }

  /** Load resources based on current mode */
  private loadResource(resource: string, signal: any, storageMethod: string): void {
    const endpoint = this.mode() === 'mock' 
      ? this.getMockEndpoint(resource)
      : this.getEndpoint(resource);

    this.http.get(endpoint, this.createHttpOptions()).pipe(
      map((response: any) => this.extractResponseData(response, resource)),
      catchError((err: HttpErrorResponse) => {
        this.logApiCall(resource, err, true);
        console.warn(`Failed to load ${resource}:`, err.message);
        return of([]);
      })
    ).subscribe(data => {
      if (data.length > 0) {
        (this.storage as Record<string, any>)[`save${storageMethod}`](data);
      }
      signal.set((this.storage as Record<string, any>)[`get${storageMethod}`]());
    });
  }

  loadLocations(): void { this.loadResource('locations', this.locations, 'Locations'); }
  loadDatacenters(): void { this.loadResource('datacenters', this.datacenters, 'Datacenters'); }
  loadImages(): void { this.loadResource('images', this.images, 'Images'); }
  loadFirewalls(): void { this.loadResource('firewalls', this.firewalls, 'Firewalls'); }
  loadActions(): void { this.loadResource('actions', this.actions, 'Actions'); }
  loadFloatingIps(): void { this.loadResource('floating_ips', this.floatingIps, 'FloatingIps'); }
  loadLoadBalancers(): void { this.loadResource('load_balancers', this.loadBalancers, 'LoadBalancers'); }
  loadNetworks(): void { this.loadResource('networks', this.networks, 'Networks'); }

  // =============================================================================
  // SERVER OPERATIONS
  // =============================================================================
  /** Create server from type */
  createServerFromType(serverType: Server, customName?: string, config?: any): void {
    if (!this.checkWritePermission()) return;

    const newServer = this.serverGen.createServer(serverType, customName, config);
    
    // Refresh servers from storage
    this.servers.set(this.storage.getServers());
  }

  /** Update server status */
  updateServerStatus(serverId: number, newStatus: 'running' | 'stopped' | 'error'): void {
    if (!this.checkWritePermission()) return;
    
    this.storage.updateServer(serverId, { status: newStatus });
    this.servers.set(this.storage.getServers());
  }

  /** Update server protection */
  updateServerProtection(serverId: number, enabled: boolean): void {
    if (!this.checkWritePermission()) return;
    
    this.storage.updateServer(serverId, { protection: { delete: enabled, rebuild: false } });
    this.servers.set(this.storage.getServers());
  }

  /** Delete server */
  deleteServer(serverId: number): void {
    if (!this.checkWritePermission()) return;
    
    this.storage.deleteServer(serverId);
    this.servers.set(this.storage.getServers());
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================
  /** Check if operation is allowed in current mode */
  private checkWritePermission(): boolean {
    if (this.mode() !== 'mock') {
      this.showDemoRestrictionDialog.set(true);
      return false;
    }
    return true;
  }

  /** Get API endpoint */
  private getEndpoint(path: string): string {
    return `${environment.apiBase}/${path}`;
  }

  /** Get mock data endpoint */
  private getMockEndpoint(path: string): string {
    return `/assets/mock/${path}.json`;
  }

  /** Get HTTP options with auth headers */
  private getHttpOptions(): any {
    // In real mode with proxy, no auth headers needed - proxy handles authentication
    return {};
  }

  // =============================================================================
  // HTTP REQUEST HELPERS
  // =============================================================================
  
  /** Create HTTP options based on current mode */
  private createHttpOptions(): any {
    if (this.mode() === 'mock') {
      return {};
    }
    
    return {
      ...this.getHttpOptions(),
      observe: 'response' as const
    };
  }

  /** Extract data from HTTP response based on mode */
  private extractResponseData(response: any, resourceKey: string): any[] {
    if (this.mode() === 'mock') {
      return response[resourceKey] || [];
    }
    
    // Log headers in real mode for debugging
    if (response.headers) {
      this.logApiCall(resourceKey, response);
    }
    
    return response.body?.[resourceKey] || [];
  }

  /** Log API call information (only in development/real mode) */
  private logApiCall(endpoint: string, response: any, isError: boolean = false): void {
    if (this.mode() !== 'real') return;
    
    const headers: Record<string, string> = {};
    if (response.headers?.keys) {
      response.headers.keys().forEach((key: string) => {
        headers[key] = response.headers.get(key);
      });
    }

    // Store endpoint status for dashboard
    const statusEntry = {
      status: response.status || 0,
      statusText: response.statusText || 'Unknown',
      endpoint: `/${endpoint}`,
      method: 'GET',
      date: new Date().toISOString()
    };

    const currentStatus = this.endpointStatus();
    this.endpointStatus.set([statusEntry, ...currentStatus.slice(0, 9)]); // Keep last 10 entries

    const logData = {
      endpoint,
      status: response.status,
      url: response.url,
      headers
    };

    console.log(isError ? `❌ ${endpoint}:` : `✅ ${endpoint}:`, logData);
  }

  /** Get persisted mode from localStorage */
  private getPersistedMode(): ApiMode {
    try {
      const saved = localStorage.getItem(CACHE_KEYS.MODE);
      return (saved === 'real') ? 'real' : 'mock';
    } catch {
      return 'mock';
    }
  }

  // =============================================================================
  // PUBLIC API METHODS (for component compatibility)
  // =============================================================================
  setMode(mode: ApiMode): void {
    this.mode.set(mode);
    localStorage.setItem(CACHE_KEYS.MODE, mode);
    this.loadAllData();
  }

  forceReloadServers(): void {
    this.loadServers();
  }

  retry(): void {
    this.loadAllData();
  }

  isServerTypeAvailable(server: any): boolean {
    // Simple availability check - in real implementation this would check datacenter availability
    return server && server.server_type && !server.server_type.deprecated;
  }

  dismissDemoRestrictionDialog(): void {
    this.showDemoRestrictionDialog.set(false);
  }

  closeDemoRestrictionDialog(): void {
    this.dismissDemoRestrictionDialog();
  }

  isUsingMockData(): boolean {
    return this.mode() === 'mock';
  }

  getCurrentMode(): ApiMode {
    return this.mode();
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  // =============================================================================
  // DELEGATED UTILITY METHODS (for component compatibility)
  // =============================================================================
  getServerPrice = (server: Server) => this.utils.getServerPrice(server);
  getServerPriceFormatted = (server: Server) => this.utils.getServerPriceFormatted(server);
  getServerIncomingTraffic = (server: Server) => this.utils.getServerIncomingTraffic(server);
  getServerOutgoingTraffic = (server: Server) => this.utils.getServerOutgoingTraffic(server);
  getCpuCount = (server: Server) => this.utils.getCpuCount(server);
  getRamSize = (server: Server) => this.utils.getRamSize(server);
  getDiskSize = (server: Server) => this.utils.getDiskSize(server);
  getArchitecture = (server: Server) => this.utils.getArchitecture(server);
  getNetworkZone = (server: Server) => this.utils.getNetworkZone(server);
  getPublicIP = (server: Server) => this.utils.getPublicIP(server);
  getCreatedTimeAgo = (server: Server) => this.utils.getCreatedTimeAgo(server);
  getCountryFlag = (countryCode: string) => this.utils.getCountryFlag(countryCode);
  getLocationWithFlag = (server: Server) => this.utils.getLocationWithFlag(server);
  getActionDisplay = (command: string) => this.utils.getActionDisplay(command);
  formatActionDate = (dateString: string) => this.utils.formatActionDate(dateString);
  formatBytes = (bytes: number) => this.utils.formatBytes(bytes);

  /** Get resource availability for debugging */
  getResourceAvailability(): Record<string, boolean> {
    return {
      servers: this.servers().length > 0,
      serverTypes: this.serverTypes().length > 0,
      locations: this.locations().length > 0,
      datacenters: this.datacenters().length > 0,
      images: this.images().length > 0,
      firewalls: this.firewalls().length > 0,
      actions: this.actions().length > 0,
      floatingIps: this.floatingIps().length > 0,
      loadBalancers: this.loadBalancers().length > 0,
      networks: this.networks().length > 0
    };
  }

  /** Get recent actions */
  getRecentActions(): any[] {
    const actions = this.actions();
    return actions
      .sort((a, b) => new Date(b.started || b.finished || '').getTime() - new Date(a.started || a.finished || '').getTime())
      .slice(0, 10); // Get latest 10 actions
  }
}