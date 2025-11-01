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
  serverTypes = signal<any[] | null>(null);
  locations = signal<any[] | null>(null);
  datacenters = signal<any[] | null>(null);
  images = signal<any[] | null>(null);
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
    return types || [];
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
    this.loadServerTypes();
    this.loadLocations();
    this.loadDatacenters();
    this.loadImages();
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
    return server.ingoing_traffic || 0;
  }

  /** Extract outgoing traffic from server (works with both mock and real API) */
  getServerOutgoingTraffic(server: Server): number {
    return server.outgoing_traffic || 0;
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

  /** Load datacenters from current mode (mock or real API) */
  loadDatacenters() {
    const endpoint = this.getEndpoint('datacenters');
    const headers = this.getAuthHeaders();
    const httpOptions = headers.Authorization ? { headers: { ...headers } } : {};

    this.http.get<any>(endpoint, httpOptions).pipe(
      catchError((err: HttpErrorResponse) => {
        return of({ datacenters: [] });
      })
    ).subscribe(res => {
      this.datacenters.set(res?.datacenters ?? []);
    });
  }

  /** Load images from current mode (mock or real API) */
  loadImages() {
    const endpoint = this.getEndpoint('images');
    const headers = this.getAuthHeaders();
    const httpOptions = headers.Authorization ? { headers: { ...headers } } : {};

    this.http.get<any>(endpoint, httpOptions).pipe(
      catchError((err: HttpErrorResponse) => {
        return of({ images: [] });
      })
    ).subscribe(res => {
      this.images.set(res?.images ?? []);
    });
  }

  // =============================================================================
  // SERVER OPERATIONS (MOCK MODE ONLY)
  // =============================================================================

  /** Create a new server from a server type configuration */
  createServerFromType(serverType: Server, customName?: string): void {
    if (!this.checkWritePermission()) return;

    const createdId = Date.now() + Math.floor(Math.random() * 1000);
    
    // Select datacenter from loaded datacenters that supports this server type
    let datacenterToUse = serverType.datacenter;
    
    if (!datacenterToUse) {
      const availableDatacenters = this.datacenters() || [];
      const serverTypeId = serverType.server_type?.id;
      
      // Find datacenters that support this server type
      const supportingDatacenters = availableDatacenters.filter(dc => 
        dc.server_types?.available?.includes(serverTypeId) || 
        dc.server_types?.supported?.includes(serverTypeId)
      );
      
      if (supportingDatacenters.length > 0) {
        // Pick a random supporting datacenter
        datacenterToUse = supportingDatacenters[Math.floor(Math.random() * supportingDatacenters.length)];
      } else if (availableDatacenters.length > 0) {
        // Fallback to any available datacenter
        datacenterToUse = availableDatacenters[Math.floor(Math.random() * availableDatacenters.length)];
      }
    }
    
    // If still no datacenter, create a default one based on available locations
    if (!datacenterToUse) {
      const availableLocations = this.locations() || [];
      const defaultLocation = availableLocations.find(l => l.name === 'hel1') || availableLocations[0];
      if (defaultLocation) {
        datacenterToUse = {
          id: defaultLocation.id,
          description: `${defaultLocation.city} virtual DC 1`,
          name: `${defaultLocation.name}-dc1`,
          location: defaultLocation,
          server_types: {
            available: [serverType.server_type?.id || 114],
            available_for_migration: [serverType.server_type?.id || 114],
            supported: [serverType.server_type?.id || 114]
          }
        };
      }
    }
    
    // Select an appropriate image from loaded images
    let imageToUse = serverType.image;
    
    if (!imageToUse) {
      const availableImages = this.images() || [];
      // Prefer Ubuntu LTS system images
      const systemImages = availableImages.filter(img => 
        img.type === 'system' && 
        img.status === 'available' && 
        (img.name?.includes('ubuntu') || img.os_flavor === 'ubuntu')
      );
      
      if (systemImages.length > 0) {
        // Prefer latest Ubuntu LTS
        const ubuntuLTS = systemImages.find(img => img.name?.includes('24.04')) || 
                          systemImages.find(img => img.name?.includes('22.04')) || 
                          systemImages[0];
        imageToUse = ubuntuLTS;
      } else if (availableImages.length > 0) {
        // Fallback to any available system image
        const fallbackImage = availableImages.find(img => img.type === 'system' && img.status === 'available') || 
                              availableImages[0];
        imageToUse = fallbackImage;
      }
    }
    
    // Fallback image if none available
    if (!imageToUse) {
      imageToUse = {
        id: 161547269,
        type: 'system',
        name: 'ubuntu-24.04',
        architecture: 'x86',
        bound_to: null,
        created_from: null,
        deprecated: null,
        description: 'Ubuntu 24.04',
        disk_size: 5,
        image_size: null,
        labels: {},
        os_flavor: 'ubuntu',
        os_version: '24.04',
        protection: {
          delete: false
        },
        rapid_deploy: true,
        status: 'available',
        created: '2024-04-25T13:26:27Z',
        deleted: null
      };
    }
    
    // Generate fallback server name (only used if no custom name provided)
    const generateFallbackName = (serverType: Server, datacenter: any): string => {
      const memory = serverType.server_type?.memory || 8;
      const locationName = datacenter?.location?.name || datacenter?.name || 'hel1';
      const instanceNumber = Math.floor(Math.random() * 999) + 1;
      
      return `server-${memory}gb-${locationName}-${instanceNumber}`;
    };
    
    const serverName = customName || generateFallbackName(serverType, datacenterToUse);
    
    // Create comprehensive server structure matching API format
    const newServer: Server = {
      id: createdId,
      name: serverName,
      status: 'running',
      server_type: serverType.server_type || {
        id: 114,
        name: 'cx23',
        architecture: 'x86',
        cores: 2,
        cpu_type: 'shared',
        category: 'cost_optimized',
        deprecated: false,
        deprecation: null,
        description: 'CX 23',
        disk: 40,
        memory: 4,
        prices: [],
        storage_type: 'local',
        locations: []
      },
      datacenter: datacenterToUse!,
      image: imageToUse,
      iso: null,
      primary_disk_size: serverType.server_type?.disk || 40,
      labels: {},
      protection: {
        delete: false,
        rebuild: false
      },
      backup_window: null,
      rescue_enabled: false,
      locked: false,
      placement_group: null,
      public_net: {
        firewalls: [
          {
            id: 10142013,
            status: 'applied'
          }
        ],
        floating_ips: [],
        ipv4: {
          id: createdId + 1000,
          ip: this.generateRandomIP(),
          blocked: false,
          dns_ptr: `static.${this.generateRandomIP().split('.').reverse().join('.')}.clients.your-server.de`
        },
        ipv6: {
          id: createdId + 2000,
          ip: '2a01:4f9:c012:b0db::/64',
          blocked: false,
          dns_ptr: []
        }
      },
      private_net: [],
      load_balancers: [],
      volumes: [],
      included_traffic: serverType.included_traffic || this.getIncludedTrafficFromServerType(serverType),
      ingoing_traffic: 0,
      outgoing_traffic: 0,
      created: new Date().toISOString(),
      
      // Add computed properties for backward compatibility
      priceEur: this.calculateServerPrice(serverType)
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
        server.id === serverId ? { 
          ...server, 
          protection: { 
            delete: isProtected,
            rebuild: server.protection?.rebuild || false
          } 
        } : server
      );
      this.servers.set(updatedServers);
      
      // Update only user-created servers in cache, not static mock data
      const userServers = this.getCachedUserServers();
      const updatedUserServers = userServers.map(server => 
        server.id === serverId ? { 
          ...server, 
          protection: { 
            delete: isProtected,
            rebuild: server.protection?.rebuild || false
          } 
        } : server
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
    
    serverTypes.slice(0, 20).forEach((st: any, index: number) => {
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
    const randomIP = this.generateRandomIP();
    return {
      id: Date.now() + index * 1000 + priceIndex,
      name: `${serverType.name.toUpperCase()} - ${serverType.description}`,
      status: 'available',
      server_type: serverType,
      datacenter: {
        id: 1,
        description: 'Falkenstein 1 virtual DC 2',
        location: {
          id: 1,
          name: 'fsn1',
          description: 'Falkenstein DC Park 1',
          city: 'Falkenstein',
          country: 'DE',
          latitude: 50.47612,
          longitude: 12.370071,
          network_zone: 'eu-central'
        },
        name: 'fsn1-dc2',
        server_types: {
          available: [serverType.id],
          available_for_migration: [serverType.id],
          supported: [serverType.id]
        }
      },
      image: {
        id: 161547269,
        type: 'system',
        name: 'ubuntu-24.04',
        architecture: 'x86',
        bound_to: null,
        created_from: null,
        deprecated: null,
        description: 'Ubuntu 24.04',
        disk_size: 5,
        image_size: null,
        labels: {},
        os_flavor: 'ubuntu',
        os_version: '24.04',
        protection: {
          delete: false
        },
        rapid_deploy: true,
        status: 'available',
        created: '2024-04-25T13:26:27Z',
        deleted: null
      },
      iso: null,
      primary_disk_size: serverType.disk || 40,
      labels: {},
      protection: {
        delete: false,
        rebuild: false
      },
      backup_window: null,
      rescue_enabled: false,
      locked: false,
      placement_group: null,
      public_net: {
        firewalls: [],
        floating_ips: [],
        ipv4: {
          id: Date.now() + index * 1000 + priceIndex + 1000,
          ip: randomIP,
          blocked: false,
          dns_ptr: `static.${randomIP.split('.').reverse().join('.')}.clients.your-server.de`
        },
        ipv6: {
          id: Date.now() + index * 1000 + priceIndex + 2000,
          ip: '2a01:4f9:c012:b0db::/64',
          blocked: false,
          dns_ptr: []
        }
      },
      private_net: [],
      load_balancers: [],
      volumes: [],
      included_traffic: price.included_traffic || DEFAULT_INCLUDED_TRAFFIC,
      ingoing_traffic: 0,
      outgoing_traffic: 0,
      created: new Date().toISOString(),
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
  calculateServerPrice(server: Server): number {
    if (!server.server_type?.prices) return 0;
    
    const serverLocation = server.datacenter?.location?.name || server.location;
    
    // Find pricing for the server's location
    const pricing = server.server_type.prices.find((p: any) => p.location === serverLocation);
    
    if (pricing?.price_monthly?.gross) {
      return parseFloat(pricing.price_monthly.gross);
    }
    
    // Fallback to first available pricing if exact location not found
    const firstPricing = server.server_type.prices[0];
    if (firstPricing?.price_monthly?.gross) {
      return parseFloat(firstPricing.price_monthly.gross);
    }
    
    return 0;
  }

  /** Check if a server type is available in any location */
  isServerTypeAvailable(server: Server): boolean {
    if (!server.server_type?.prices) return true; // Default to available if no pricing info
    
    // Check if any location has availability (missing available field means available by default)
    return server.server_type.prices.some((price: any) => price.available !== false);
  }

  /** Get available locations for a server type */
  getAvailableLocations(server: Server): string[] {
    if (!server.server_type?.prices) return [];
    
    return server.server_type.prices
      .filter((price: any) => price.available !== false)
      .map((price: any) => price.location);
  }

  /** Get sold out locations for a server type */
  getSoldOutLocations(server: Server): string[] {
    if (!server.server_type?.prices) return [];
    
    return server.server_type.prices
      .filter((price: any) => price.available === false)
      .map((price: any) => price.location);
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

  /** Generate a random IP address for mock servers */
  private generateRandomIP(): string {
    const octet1 = Math.floor(Math.random() * 223) + 1; // 1-223 (avoid reserved ranges)
    const octet2 = Math.floor(Math.random() * 255);
    const octet3 = Math.floor(Math.random() * 255);
    const octet4 = Math.floor(Math.random() * 254) + 1; // 1-254 (avoid .0 and .255)
    return `${octet1}.${octet2}.${octet3}.${octet4}`;
  }
}