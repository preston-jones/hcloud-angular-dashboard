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

  // =============================================================================
  // COMPUTED PROPERTIES
  // =============================================================================
  myServers = computed(() => {
    return this.servers().filter(s => s.status !== 'available');
  });

  availableServerTypes = computed(() => {
    return this.serverTypes();
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

  /** Load servers with automatic fallback */
  loadServers(): void {
    this.loading.set(true);
    this.error.set(null);

    const endpoint = this.getEndpoint('servers');
    const httpOptions = this.getHttpOptions();

    // Always try proxy first
    this.http.get(endpoint, httpOptions).pipe(
      map((response: any) => response.servers || []),
      map(servers => servers.map((server: any) => ({ ...server, priceEur: this.calculatePrice(server) }))),
      catchError((err: HttpErrorResponse) => {
        // On error, try mock data if fallback is enabled
        if (environment.useMockFallback) {
          const mockEndpoint = this.getMockEndpoint('servers');
          return this.http.get(mockEndpoint).pipe(
            map((response: any) => response.servers || []),
            map(servers => servers.map((server: any) => ({ ...server, priceEur: this.calculatePrice(server) })))
          );
        }
        this.error.set(err.message || 'Failed to load servers');
        return of([]);
      })
    ).subscribe(servers => {
      // Save valid data regardless of source
      if (servers.length > 0) {
        this.storage.saveServers(servers);
      }
      // Always get from storage to ensure consistent data format
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

  /** Load resources with automatic fallback */
  private loadResource(resource: string, signal: any, storageMethod: string): void {
    const endpoint = this.getEndpoint(resource);
    const httpOptions = this.getHttpOptions();

    // Always try proxy first
    this.http.get(endpoint, httpOptions).pipe(
      map((response: any) => response[resource] || []),
      catchError(() => {
        // On error, try mock data if fallback is enabled
        if (environment.useMockFallback) {
          const mockEndpoint = this.getMockEndpoint(resource);
          return this.http.get(mockEndpoint).pipe(
            map((response: any) => response[resource] || [])
          );
        }
        return of([]);
      })
    ).subscribe(data => {
      // Save the data regardless of source
      if (data.length > 0) {
        (this.storage as Record<string, any>)[`save${storageMethod}`](data);
      }
      // Always get from storage to ensure consistent data format
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
    const headers = this.getAuthHeaders();
    return headers.Authorization ? { headers } : {};
  }

  /** Get authentication headers */
  private getAuthHeaders(): any {
    const token = sessionStorage.getItem(CACHE_KEYS.TOKEN);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /** Calculate server price */
  private calculatePrice(server: any): number {
    const memory = server.server_type?.memory || 4;
    const cores = server.server_type?.cores || 2;
    return Math.round((memory * 0.75 + cores * 1.5) * 100) / 100;
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

  setToken(token: string): void {
    sessionStorage.setItem(CACHE_KEYS.TOKEN, token);
  }

  getToken(): string {
    return sessionStorage.getItem(CACHE_KEYS.TOKEN) || '';
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