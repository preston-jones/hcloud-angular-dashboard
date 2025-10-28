import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, of, map } from 'rxjs';

// Constants
const REAL_BASE = 'https://api.hetzner.cloud/v1';
const MOCK_BASE = '/assets/mock';

// Helper functions for API mode and token management
const getMode = () => (sessionStorage.getItem('hz.mode') ?? 'mock');
const apiBase = () => getMode() === 'mock' ? 'assets/mock' : 'https://api.hetzner.cloud/v1';
const authHdr = () => {
  const t = sessionStorage.getItem('hz.token');
  return t ? { 'Authorization': `Bearer ${t}` } : {};
};

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
  
  // Demo restriction dialog
  showDemoRestrictionDialog = signal(false);
  
  // Separate storage for user-created servers (simulated)
  private userCreatedServers = signal<Server[]>([]);
  
  // Combined servers for My Servers page 
  myServers = computed(() => {
    if (getMode() === 'mock') {
      // In mock mode: base servers.json + user-created servers 
      const baseAndUserServers = this.servers()?.filter(s => s.status !== 'available') || [];
      return baseAndUserServers;
    } else {
      // In API mode: only real API servers (read-only, no user-created servers)
      const realServers = this.servers()?.filter(s => s.status !== 'available') || [];
      return realServers;
    }
  });

  constructor() {
    // Load user-created servers on service initialization
    this.initializeUserServers();
  }

  /** Mock-Modus? (assets/mock vs echte API) */
  private isMockMode(): boolean {
    return getMode() === 'mock';
  }

  /** Set search query from topbar */
  setSearchQuery(query: string) {
    this.searchQuery.set(query);
  }

  /** Show demo restriction dialog */
  private showDemoRestriction(): void {
    this.showDemoRestrictionDialog.set(true);
  }

  /** Close demo restriction dialog */
  closeDemoRestrictionDialog(): void {
    this.showDemoRestrictionDialog.set(false);
  }

  /** Load Servers mit dynamischer Mode-Erkennung (with fallback to server types) */
  loadServers() {
    this.loading.set(true);
    this.error.set(null);

    if (getMode() === 'mock') {
      // Load mock servers
      const endpoint = apiBase() + '/servers.json';
      this.http.get<any>(endpoint).pipe(
        map(response => {
          console.log('Mock API response:', response);
          const serverList = response.servers || response;
          return this.transformServersData(serverList);
        }),
        catchError((err: HttpErrorResponse) => {
          console.error('Mock server loading failed:', err);
          this.error.set(err.message || 'Failed to load mock servers');
          return of([]);
        })
      ).subscribe(servers => {
        console.log('Mock servers loaded:', servers);
        this.servers.set(servers);
        this.loading.set(false);
      });
    } else {
      // For real API, first try actual servers, then fallback to server types
      const serverEndpoint = apiBase() + '/servers';
      const headers = authHdr();
      const httpOptions = headers.Authorization ? { headers: new HttpHeaders(headers) } : {};

      this.http.get<any>(serverEndpoint, httpOptions).pipe(
        map(response => {
          console.log('Real API servers response:', response);
          const serverList = response.servers || [];
          if (serverList.length > 0) {
            return this.transformServersData(serverList);
          } else {
            // No actual servers, load server types as available options
            return this.loadServerTypesFromAPI();
          }
        }),
        catchError((err: HttpErrorResponse) => {
          console.error('Real server loading failed, trying server types:', err);
          // If servers endpoint fails, try server types
          return this.loadServerTypesFromAPI();
        })
      ).subscribe(servers => {
        if (servers instanceof Promise) {
          servers.then(serverTypes => {
            console.log('Server types loaded:', serverTypes);
            this.servers.set(serverTypes);
            this.loading.set(false);
          });
        } else {
          console.log('Real servers loaded:', servers);
          this.servers.set(servers);
          this.loading.set(false);
        }
      });
    }
  }

  /** Load only actual servers (no fallback to server types) */
  loadActualServers() {
    this.loading.set(true);
    this.error.set(null);

    console.log('Loading actual servers, mode:', getMode(), 'token:', !!sessionStorage.getItem('hz.token'));

    if (getMode() === 'mock') {
      // In mock mode: Load base servers.json + add user-created servers (simulating API behavior)
      const endpoint = apiBase() + '/servers.json';
      this.http.get<any>(endpoint).pipe(
        map(response => {
          console.log('Mock API response (base servers.json):', response);
          const baseServerList = response.servers || [];
          const baseServers = this.transformServersData(baseServerList);
          
          // Combine base servers with user-created servers (like API mode does)
          const userServers = this.userCreatedServers();
          const combinedServers = [...baseServers, ...userServers];
          
          console.log('Combined servers (base + user-created):', {
            base: baseServers.length,
            userCreated: userServers.length,
            total: combinedServers.length
          });
          
          return combinedServers;
        }),
        catchError((err: HttpErrorResponse) => {
          console.error('Mock server loading failed:', err);
          this.error.set(err.message || 'Failed to load mock servers');
          return of([]);
        })
      ).subscribe(servers => {
        console.log('Mock servers loaded (total):', servers.length);
        this.servers.set(servers);
        this.loading.set(false);
      });
    } else {
      // For real API, only load actual servers (no fallback)
      const serverEndpoint = apiBase() + '/servers';
      const headers = authHdr();
      const httpOptions = headers.Authorization ? { headers: new HttpHeaders(headers) } : {};

      console.log('🔍 API Debug Info:');
      console.log('- Mode:', getMode());
      console.log('- Endpoint:', serverEndpoint);
      console.log('- Token available:', !!sessionStorage.getItem('hz.token'));
      console.log('- Headers:', headers);
      console.log('- HTTP Options:', httpOptions);

      this.http.get<any>(serverEndpoint, httpOptions).pipe(
        map(response => {
          console.log('Real API servers response:', response);
          const serverList = response.servers || [];
          return this.transformServersData(serverList);
        }),
        catchError((err: HttpErrorResponse) => {
          console.error('Real server loading failed:', err);
          this.error.set(err.message || 'Failed to load actual servers');
          return of([]);
        })
      ).subscribe(servers => {
        console.log('Actual servers loaded:', servers);
        this.servers.set(servers);
        this.loading.set(false);
      });
    }
  }

  /** Load only server types (for Server List page) */
  loadServerTypes(): void {
    this.loading.set(true);
    this.error.set(null);

    console.log('Loading server types, mode:', getMode(), 'token:', !!sessionStorage.getItem('hz.token'));

    if (getMode() === 'mock') {
      // For mock mode, load server types from server_types.json
      const endpoint = apiBase() + '/server_types.json';
      this.http.get<any>(endpoint).pipe(
        map(response => {
          console.log('Mock API response for server types:', response);
          const serverTypes = response.server_types || [];
          return this.transformServerTypesToServers(serverTypes);
        }),
        catchError((err: HttpErrorResponse) => {
          console.error('Mock server types loading failed:', err);
          this.error.set(err.message || 'Failed to load mock server types');
          return of([]);
        })
      ).subscribe(servers => {
        console.log('Mock server types loaded:', servers);
        this.servers.set(servers);
        this.loading.set(false);
      });
    } else {
      // For real API, load server types directly
      this.loadServerTypesFromAPI().then(serverTypes => {
        console.log('Server types loaded:', serverTypes);
        this.servers.set(serverTypes);
        this.loading.set(false);
      }).catch(err => {
        console.error('Server types loading failed:', err);
        this.error.set('Failed to load server types');
        this.servers.set([]);
        this.loading.set(false);
      });
    }
  }

  /** Load server types when no actual servers exist */
  private loadServerTypesFromAPI(): Promise<Server[]> {
    const endpoint = apiBase() + '/server_types';
    const headers = authHdr();
    const httpOptions = headers.Authorization ? { headers: new HttpHeaders(headers) } : {};

    console.log('Loading server types from API:', endpoint);
    console.log('Auth headers:', headers);

    return this.http.get<any>(endpoint, httpOptions).pipe(
      map(response => {
        console.log('Server types response:', response);
        const serverTypes = response.server_types || [];
        return this.transformServerTypesToServers(serverTypes);
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('Server types loading failed:', err);
        console.error('Response status:', err.status);
        console.error('Response message:', err.message);
        if (err.status === 401) {
          this.error.set('Authentication failed. Please check your API token.');
        } else {
          this.error.set(err.message || 'Failed to load server types');
        }
        return of([]);
      })
    ).toPromise().then(result => result || []);
  }

  /** Transform server types into server-like objects for display */
  private transformServerTypesToServers(serverTypes: any[]): Server[] {
    const servers: Server[] = [];
    
    // Take first 5 server types to avoid too many entries
    serverTypes.slice(0, 5).forEach((st: any) => {
      // Create separate entries for each location with pricing
      st.prices?.forEach((price: any, index: number) => {
        // Limit to 3 locations per server type to keep list manageable
        if (index < 3) {
          const locationInfo = st.locations?.find((loc: any) => loc.name === price.location);
          
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
            // Additional fields
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
    
    return servers.sort((a, b) => a.priceEur - b.priceEur); // Sort by price
  }

  /** Get city name for location code */
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

  /** Get country code for location */
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
  private mapStatus(hetznerStatus: string): 'running' | 'stopped' | 'error' | 'available' {
    switch (hetznerStatus) {
      case 'running': return 'running';
      case 'off': 
      case 'stopped': return 'stopped';
      case 'available': return 'available';
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
    return sessionStorage.getItem('hz.token') || '';
  }

  /** Set mode and reload */
  setMode(mode: 'mock' | 'real'): void {
    console.log('Setting mode to:', mode);
    const currentMode = getMode();
    sessionStorage.setItem('hz.mode', mode);
    console.log('Mode changed from', currentMode, 'to', mode);
    // Automatically reload actual servers when mode changes
    this.loadActualServers();
  }

  /** Set token */
  setToken(token: string): void {
    sessionStorage.setItem('hz.token', token);
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

  /** Add a server type as a user-created server (mock mode only) */
  createServerFromType(serverType: Server): void {
    if (getMode() !== 'mock') {
      this.showDemoRestriction();
      return;
    }

    // Generate a unique ID for the created server
    const createdId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create a new server based on the server type but with running status
    const newServer: Server = {
      ...serverType,
      id: createdId,
      name: `${serverType.type}-${Date.now()}`, // Generate a unique name
      status: 'running', // Simulate as running
      created: new Date().toISOString(),
    };

    // Add to user-created servers
    const current = this.userCreatedServers();
    this.userCreatedServers.set([...current, newServer]);
    
    // Save to sessionStorage for persistence
    this.saveUserCreatedServers();
  }

  /** Get user-created servers - from sessionStorage (mock mode only) */
  private loadUserCreatedServers(): void {
    try {
      const saved = sessionStorage.getItem('hz.userServers');
      if (saved) {
        const servers = JSON.parse(saved) as Server[];
        this.userCreatedServers.set(servers);
      } else {
        this.userCreatedServers.set([]);
      }
    } catch (error) {
      console.error('Failed to load user-created servers:', error);
      this.userCreatedServers.set([]);
    }
  }

  /** Save user-created servers to sessionStorage (mock mode only) */
  private saveUserCreatedServers(): void {
    try {
      sessionStorage.setItem('hz.userServers', JSON.stringify(this.userCreatedServers()));
    } catch (error) {
      console.error('Failed to save user-created servers:', error);
    }
  }

  /** Initialize user-created servers on service start */
  initializeUserServers(): void {
    this.loadUserCreatedServers();
  }

  /** Update server status (mock mode only) */
  updateServerStatus(serverId: string, newStatus: 'running' | 'stopped' | 'error' | 'available'): void {
    if (getMode() !== 'mock') {
      this.showDemoRestriction();
      return;
    }

    // Update in real servers array (for mock mode)
    const currentServers = this.servers();
    if (currentServers) {
      const updatedServers = currentServers.map(server => 
        server.id === serverId ? { ...server, status: newStatus } : server
      );
      this.servers.set(updatedServers);
    }

    // Update in user-created servers array
    const currentUserServers = this.userCreatedServers();
    const updatedUserServers = currentUserServers.map(server => 
      server.id === serverId ? { ...server, status: newStatus } : server
    );
    this.userCreatedServers.set(updatedUserServers);
    this.saveUserCreatedServers();
  }

  /** Delete server (mock mode only) */
  deleteServer(serverId: string): void {
    if (getMode() !== 'mock') {
      this.showDemoRestriction();
      return;
    }

    // Only remove from user-created servers (real servers can't be deleted from UI)
    const currentUserServers = this.userCreatedServers();
    const filteredUserServers = currentUserServers.filter(server => server.id !== serverId);
    this.userCreatedServers.set(filteredUserServers);
    this.saveUserCreatedServers();

    // Note: In mock mode, we only manage user-created servers
  }

  /** Reboot server (mock mode only) */
  rebootServer(serverId: string): void {
    if (getMode() !== 'mock') {
      this.showDemoRestriction();
      return;
    }
    
    // In mock mode, simulate reboot by briefly changing status
    console.log('Rebooting server:', serverId);
    // Could add reboot simulation logic here if needed
  }
}