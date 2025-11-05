import { Injectable, signal } from '@angular/core';
import { Server, CACHE_KEYS } from './models';

/**
 * Unified data storage service for both mock and real API modes
 * Handles session storage operations and data persistence
 */
@Injectable({ providedIn: 'root' })
export class DataStorageService {
  
  // =============================================================================
  // SERVER OPERATIONS
  // =============================================================================

  /** Get all servers from storage */
  getServers(mode?: 'mock' | 'real'): Server[] {
    try {
      // Get API servers (mock or real)
      const apiServers = sessionStorage.getItem(CACHE_KEYS.SERVERS);
      const servers = apiServers ? JSON.parse(apiServers) : [];
      
      // In live/real mode, only return API servers
      if (mode === 'real') {
        return servers;
      }
      
      // In mock mode or when mode is not specified, combine with user-created servers
      const userServers = sessionStorage.getItem('user-servers');
      const userCreatedServers = userServers ? JSON.parse(userServers) : [];
      
      // Combine both arrays, with user-created servers first (most recent)
      return [...userCreatedServers, ...servers];
    } catch {
      return [];
    }
  }

  /** Save servers to storage */
  saveServers(servers: Server[]): void {
    try {
      sessionStorage.setItem(CACHE_KEYS.SERVERS, JSON.stringify(servers));
    } catch (error) {
      console.warn('Failed to save servers to storage:', error);
    }
  }

  /** Add a new server to storage (user-created servers only) */
  addServer(server: Server): void {
    try {
      const userServers = sessionStorage.getItem('user-servers');
      const userCreatedServers = userServers ? JSON.parse(userServers) : [];
      userCreatedServers.push(server);
      sessionStorage.setItem('user-servers', JSON.stringify(userCreatedServers));
    } catch (error) {
      console.warn('Failed to add server to storage:', error);
    }
  }

  /** Update a server in storage (searches both API and user-created servers) */
  updateServer(serverId: number, updates: Partial<Server>): void {
    try {
      // Try to update in API servers first
      const apiServers = sessionStorage.getItem(CACHE_KEYS.SERVERS);
      if (apiServers) {
        const servers = JSON.parse(apiServers);
        const index = servers.findIndex((s: Server) => s.id === serverId);
        if (index !== -1) {
          servers[index] = { ...servers[index], ...updates };
          sessionStorage.setItem(CACHE_KEYS.SERVERS, JSON.stringify(servers));
          return;
        }
      }

      // If not found in API servers, try user-created servers
      const userServers = sessionStorage.getItem('user-servers');
      if (userServers) {
        const userCreatedServers = JSON.parse(userServers);
        const index = userCreatedServers.findIndex((s: Server) => s.id === serverId);
        if (index !== -1) {
          userCreatedServers[index] = { ...userCreatedServers[index], ...updates };
          sessionStorage.setItem('user-servers', JSON.stringify(userCreatedServers));
        }
      }
    } catch (error) {
      console.warn('Failed to update server in storage:', error);
    }
  }

  /** Delete a server from storage (searches both API and user-created servers) */
  deleteServer(serverId: number): void {
    try {
      // Try to delete from API servers first
      const apiServers = sessionStorage.getItem(CACHE_KEYS.SERVERS);
      if (apiServers) {
        const servers = JSON.parse(apiServers);
        const originalLength = servers.length;
        const filtered = servers.filter((s: Server) => s.id !== serverId);
        if (filtered.length !== originalLength) {
          sessionStorage.setItem(CACHE_KEYS.SERVERS, JSON.stringify(filtered));
          return;
        }
      }

      // If not found in API servers, try user-created servers
      const userServers = sessionStorage.getItem('user-servers');
      if (userServers) {
        const userCreatedServers = JSON.parse(userServers);
        const filtered = userCreatedServers.filter((s: Server) => s.id !== serverId);
        sessionStorage.setItem('user-servers', JSON.stringify(filtered));
      }
    } catch (error) {
      console.warn('Failed to delete server from storage:', error);
    }
  }

  // =============================================================================
  // OTHER RESOURCE OPERATIONS
  // =============================================================================

  /** Get server types from storage */
  getServerTypes(): any[] {
    try {
      const cached = sessionStorage.getItem(CACHE_KEYS.SERVER_TYPES);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  /** Save server types to storage */
  saveServerTypes(serverTypes: any[]): void {
    try {
      sessionStorage.setItem(CACHE_KEYS.SERVER_TYPES, JSON.stringify(serverTypes));
    } catch (error) {
      console.warn('Failed to save server types to storage:', error);
    }
  }

  /** Get locations from storage */
  getLocations(): any[] {
    try {
      const cached = sessionStorage.getItem(CACHE_KEYS.LOCATIONS);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  /** Save locations to storage */
  saveLocations(locations: any[]): void {
    try {
      sessionStorage.setItem(CACHE_KEYS.LOCATIONS, JSON.stringify(locations));
    } catch (error) {
      console.warn('Failed to save locations to storage:', error);
    }
  }

  /** Get actions from storage */
  getActions(): any[] {
    try {
      const cached = sessionStorage.getItem(CACHE_KEYS.ACTIONS);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  /** Save actions to storage */
  saveActions(actions: any[]): void {
    try {
      sessionStorage.setItem(CACHE_KEYS.ACTIONS, JSON.stringify(actions));
    } catch (error) {
      console.warn('Failed to save actions to storage:', error);
    }
  }

  /** Get datacenters from storage */
  getDatacenters(): any[] {
    try {
      const cached = sessionStorage.getItem(CACHE_KEYS.DATACENTERS);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  /** Save datacenters to storage */
  saveDatacenters(datacenters: any[]): void {
    try {
      sessionStorage.setItem(CACHE_KEYS.DATACENTERS, JSON.stringify(datacenters));
    } catch (error) {
      console.warn('Failed to save datacenters to storage:', error);
    }
  }

  /** Get images from storage */
  getImages(): any[] {
    try {
      const cached = sessionStorage.getItem(CACHE_KEYS.IMAGES);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  /** Save images to storage */
  saveImages(images: any[]): void {
    try {
      sessionStorage.setItem(CACHE_KEYS.IMAGES, JSON.stringify(images));
    } catch (error) {
      console.warn('Failed to save images to storage:', error);
    }
  }

  /** Get firewalls from storage */
  getFirewalls(): any[] {
    try {
      const cached = sessionStorage.getItem(CACHE_KEYS.FIREWALLS);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  /** Save firewalls to storage */
  saveFirewalls(firewalls: any[]): void {
    try {
      sessionStorage.setItem(CACHE_KEYS.FIREWALLS, JSON.stringify(firewalls));
    } catch (error) {
      console.warn('Failed to save firewalls to storage:', error);
    }
  }

  /** Get floating IPs from storage */
  getFloatingIps(): any[] {
    try {
      const cached = sessionStorage.getItem(CACHE_KEYS.FLOATING_IPS);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  /** Save floating IPs to storage */
  saveFloatingIps(floatingIps: any[]): void {
    try {
      sessionStorage.setItem(CACHE_KEYS.FLOATING_IPS, JSON.stringify(floatingIps));
    } catch (error) {
      console.warn('Failed to save floating IPs to storage:', error);
    }
  }

  /** Get load balancers from storage */
  getLoadBalancers(): any[] {
    try {
      const cached = sessionStorage.getItem(CACHE_KEYS.LOAD_BALANCERS);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  /** Save load balancers to storage */
  saveLoadBalancers(loadBalancers: any[]): void {
    try {
      sessionStorage.setItem(CACHE_KEYS.LOAD_BALANCERS, JSON.stringify(loadBalancers));
    } catch (error) {
      console.warn('Failed to save load balancers to storage:', error);
    }
  }

  /** Get networks from storage */
  getNetworks(): any[] {
    try {
      const cached = sessionStorage.getItem(CACHE_KEYS.NETWORKS);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  /** Save networks to storage */
  saveNetworks(networks: any[]): void {
    try {
      sessionStorage.setItem(CACHE_KEYS.NETWORKS, JSON.stringify(networks));
    } catch (error) {
      console.warn('Failed to save networks to storage:', error);
    }
  }

  // =============================================================================
  // UTILITY OPERATIONS
  // =============================================================================

  /** Clear all storage data */
  clearAll(): void {
    try {
      Object.values(CACHE_KEYS).forEach(key => {
        sessionStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Failed to clear storage:', error);
    }
  }

  /** Check if storage has data for a specific resource */
  hasData(resource: keyof typeof CACHE_KEYS): boolean {
    try {
      const key = CACHE_KEYS[resource];
      const data = sessionStorage.getItem(key);
      return data !== null && data !== '[]' && data !== 'null';
    } catch {
      return false;
    }
  }

  /** Get storage size in bytes */
  getStorageSize(): number {
    try {
      let size = 0;
      Object.values(CACHE_KEYS).forEach(key => {
        const data = sessionStorage.getItem(key);
        if (data) {
          size += data.length;
        }
      });
      return size;
    } catch {
      return 0;
    }
  }
}