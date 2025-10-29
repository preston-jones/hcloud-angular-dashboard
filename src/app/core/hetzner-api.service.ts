import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, of, map } from 'rxjs';

export interface Server {
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'running' | 'stopped' | 'error' | 'available';
  priceEur: number;
  vcpus: number;
  ram: number;
  ssd: number;
  created?: string;
  server_type?: { name: string; cores: number; memory: number; disk: number; description?: string; };
  datacenter?: { location: { name: string; city: string; country: string; }; };
  country?: string;
}

@Injectable({ providedIn: 'root' })
export class HetznerApiService {
  private http = inject(HttpClient);

  // State signals
  servers = signal<Server[] | null>(null);              // Actual user servers
  serverTypes = signal<Server[] | null>(null);          // Available server configurations
  locations = signal<any[] | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  searchQuery = signal('');
  showDemoRestrictionDialog = signal(false);
  
  // Mode management
  mode = signal<'mock' | 'real'>('mock');
  
  // Computed properties
  myServers = computed(() => {
    const allServers = this.servers();
    const filteredServers = allServers?.filter(s => s.status !== 'available') || [];
    console.log('🔄 myServers computed - All servers:', allServers?.length, 'My servers:', filteredServers.length);
    return filteredServers;
  });

  // Available server types for creation
  availableServerTypes = computed(() => {
    const types = this.serverTypes();
    return types?.filter(s => s.status === 'available') || [];
  });

  // Mode and URL helpers
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

  // Mode management methods
  setMode(newMode: 'mock' | 'real'): void {
    console.log('Setting mode to:', newMode);
    this.mode.set(newMode);
    
    // Clear persisted mock data when switching modes
    sessionStorage.removeItem(this.MOCK_SERVERS_KEY);
    this.hasLoadedInitialData = false;
    
    this.loadServers(); // Reload data with new mode
  }

  /** Force reload servers (useful for error retry) */
  forceReloadServers(): void {
    this.hasLoadedInitialData = false;
    this.loadServers();
  }

  getCurrentMode(): 'mock' | 'real' {
    return this.mode();
  }

  isUsingMockData(): boolean {
    return this.mode() === 'mock';
  }

  // Token management
  setToken(token: string): void {
    sessionStorage.setItem('hz.token', token);
  }

  getToken(): string {
    return sessionStorage.getItem('hz.token') || '';
  }

  // Basic methods
  setSearchQuery(query: string) {
    this.searchQuery.set(query);
  }

  closeDemoRestrictionDialog(): void {
    this.showDemoRestrictionDialog.set(false);
  }

  /** Load servers from current mode (mock or real API) */
  constructor() {
    console.log('🚀 HetznerApiService constructor called - V2.0 with sessionStorage');
    this.loadServers();
    this.loadLocations();
    
    // Make debug method available globally for testing
    (window as any).debugHetznerService = () => this.debugServerState();
  }

  private hasLoadedInitialData = false;
  private readonly MOCK_SERVERS_KEY = 'hetzner_mock_servers';

  /** Load servers from current mode (mock or real API) */
  loadServers(): void {
    console.log('🔄 loadServers called - hasLoadedInitialData:', this.hasLoadedInitialData, 'mode:', this.mode());
    
    // In mock mode, check if we have persisted changes first
    if (this.mode() === 'mock') {
      const persistedServers = sessionStorage.getItem(this.MOCK_SERVERS_KEY);
      if (persistedServers) {
        console.log('� Loading persisted mock servers from sessionStorage');
        try {
          const servers = JSON.parse(persistedServers);
          this.servers.set(servers);
          this.hasLoadedInitialData = true;
          return;
        } catch (error) {
          console.warn('Failed to parse persisted servers, loading from JSON');
        }
      }
    }

    console.log('🔄 Loading servers from API/JSON');
    this.loading.set(true);
    this.error.set(null);

    const endpoint = this.getEndpoint('servers');
    const headers = this.getAuthHeaders();
    const httpOptions = headers.Authorization ? { headers: { ...headers } } : {};

    console.log(`Loading servers from ${this.mode()} mode:`, endpoint);

    this.http.get<any>(endpoint, httpOptions).pipe(
      map(response => {
        console.log('API response:', response);
        const servers = response.servers || [];
        return servers;
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('Servers loading failed:', err);
        this.error.set(err.message || 'Failed to load servers');
        return of([]);
      })
    ).subscribe(servers => {
      console.log('Servers loaded:', servers.length);
      this.servers.set(servers);
      this.loading.set(false);
      
      // In mock mode, persist the initial data
      if (this.mode() === 'mock' && !this.hasLoadedInitialData) {
        sessionStorage.setItem(this.MOCK_SERVERS_KEY, JSON.stringify(servers));
        this.hasLoadedInitialData = true;
        console.log('✅ Persisted initial mock servers to sessionStorage');
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

    console.log(`Loading server types from ${this.mode()} mode:`, endpoint);

    this.http.get<any>(endpoint, httpOptions).pipe(
      map(response => {
        console.log('Server types response:', response);
        const serverTypes = response.server_types || [];
        return this.transformServerTypesToServers(serverTypes);
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('Server types loading failed:', err);
        this.error.set(err.message || 'Failed to load server types');
        return of([]);
      })
    ).subscribe(servers => {
      console.log('Server types loaded:', servers.length);
      this.serverTypes.set(servers);  // Use separate signal!
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
        console.error('Locations loading failed:', err);
        return of({ locations: [] });
      })
    ).subscribe(res => {
      this.locations.set(res?.locations ?? []);
    });
  }

  // Server operations (mock only)
  createServerFromType(serverType: Server): void {
    if (this.mode() !== 'mock') {
      this.showDemoRestrictionDialog.set(true);
      return;
    }

    const createdId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
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
    console.log('✅ Server created and persisted to sessionStorage:', newServer);
  }

  updateServerStatus(serverId: string, newStatus: 'running' | 'stopped' | 'error' | 'available'): void {
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
      console.log('Server status updated:', serverId, newStatus);
    }
  }

  deleteServer(serverId: string): void {
    console.log('🗑️ Delete server called:', serverId, 'Mode:', this.mode());
    
    if (this.mode() !== 'mock') {
      console.log('❌ Delete blocked - not in mock mode');
      this.showDemoRestrictionDialog.set(true);
      return;
    }

    const currentServers = this.servers();
    console.log('📋 Current servers before delete:', currentServers?.length);
    console.log('📋 Server IDs before delete:', currentServers?.map(s => s.id));
    
    if (currentServers) {
      const serverToDelete = currentServers.find(s => s.id === serverId);
      console.log('🎯 Server to delete found:', serverToDelete ? 'YES' : 'NO', serverToDelete?.name);
      
      const filteredServers = currentServers.filter(server => server.id !== serverId);
      console.log('📋 Servers after filter:', filteredServers.length);
      console.log('📋 Server IDs after filter:', filteredServers.map(s => s.id));
      
      this.servers.set(filteredServers);
      
      // Persist changes to sessionStorage in mock mode
      sessionStorage.setItem(this.MOCK_SERVERS_KEY, JSON.stringify(filteredServers));
      console.log('💾💾💾 SERVER DELETED AND SAVED TO SESSIONSTORAGE 💾💾💾:', serverId);
      
      // Force myServers to recompute
      const myServersAfterDelete = this.myServers();
      console.log('👥 My servers after delete:', myServersAfterDelete.length);
    } else {
      console.log('❌ No servers found to delete from');
    }
  }

  // Debug method - can be called from browser console
  debugServerState() {
    console.log('🐛 DEBUG - Service State:');
    console.log('Mode:', this.mode());
    console.log('Total servers:', this.servers()?.length || 0);
    console.log('My servers:', this.myServers().length);
    console.log('Server IDs:', this.servers()?.map(s => s.id) || []);
    return {
      mode: this.mode(),
      totalServers: this.servers()?.length || 0,
      myServers: this.myServers().length,
      serverIds: this.servers()?.map(s => s.id) || []
    };
  }

  rebootServer(serverId: string): void {
    if (this.mode() !== 'mock') {
      this.showDemoRestrictionDialog.set(true);
      return;
    }
    
    console.log('Rebooting server:', serverId);
  }

  // Utility methods
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

  hasCountryData(server: Server): boolean {
    return !!server.country && server.country !== 'Unknown';
  }

  // Helper methods for data transformation
  private transformServerTypesToServers(serverTypes: any[]): Server[] {
    const servers: Server[] = [];
    
    serverTypes.slice(0, 5).forEach((st: any) => {
      st.prices?.forEach((price: any, index: number) => {
        if (index < 3) {
          servers.push({
            id: `${st.name}-${price.location}`,
            name: `${st.name.toUpperCase()} - ${st.description}`,
            type: st.name,
            location: price.location.toUpperCase(),
            status: 'available' as any,
            priceEur: parseFloat(price.price_monthly.net),
            vcpus: st.cores || 0,
            ram: st.memory || 0,
            ssd: st.disk || 0,
            created: new Date().toISOString(),
            server_type: st,
            datacenter: { 
              location: { 
                name: price.location, 
                city: this.getLocationCity(price.location), 
                country: this.getLocationCountry(price.location) 
              } 
            },
            country: this.getLocationCountry(price.location)
          });
        }
      });
    });
    
    return servers.sort((a, b) => a.priceEur - b.priceEur);
  }

  private transformServersData(serverList: any[]): Server[] {
    if (!Array.isArray(serverList)) {
      return [];
    }
    
    return serverList.map((s: any) => ({
      id: s.id?.toString?.() ?? s.id,
      name: s.name || 'Unknown',
      type: s.server_type?.name || 'Unknown',
      location: s.datacenter?.location?.name || 'Unknown',
      status: s.status === 'off' ? 'stopped' : s.status,
      priceEur: this.calculatePrice(s.server_type),
      vcpus: s.server_type?.cores || 0,
      ram: s.server_type?.memory || 0,
      ssd: s.server_type?.disk || 0,
      created: s.created,
      server_type: s.server_type,
      datacenter: s.datacenter,
      country: s.datacenter?.location?.country || 'Unknown'
    }));
  }

  private calculatePrice(serverType: any): number {
    if (!serverType) return 0;
    const basePrice = 2.0;
    const cpuPrice = (serverType.cores || 1) * 1.5;
    const memPrice = (serverType.memory || 1) * 0.5;
    return +(basePrice + cpuPrice + memPrice).toFixed(2);
  }

  private getLocationCity(locationCode: string): string {
    const locationMap: Record<string, string> = {
      'fsn1': 'Falkenstein',
      'nbg1': 'Nuremberg', 
      'hel1': 'Helsinki',
      'ash': 'Ashburn',
      'hil': 'Hillsboro',
      'sin': 'Singapore'
    };
    return locationMap[locationCode] || locationCode;
  }

  private getLocationCountry(locationCode: string): string {
    const countryMap: Record<string, string> = {
      'fsn1': 'DE',
      'nbg1': 'DE', 
      'hel1': 'FI',
      'ash': 'US',
      'hil': 'US',
      'sin': 'SG'
    };
    return countryMap[locationCode] || 'Unknown';
  }
}