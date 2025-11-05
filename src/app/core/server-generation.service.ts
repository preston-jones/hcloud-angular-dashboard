import { Injectable, inject } from '@angular/core';
import { Server } from './models';
import { DataStorageService } from './data-storage.service';

/**
 * Service for generating and transforming server data
 * Handles server creation, ID generation, and data manipulation
 */
@Injectable({ providedIn: 'root' })
export class ServerGenerationService {
  private storage = inject(DataStorageService);

  // =============================================================================
  // SERVER CREATION
  // =============================================================================

  /** Create a new server from server type configuration */
  createServer(serverType: any, customName?: string, config?: any): Server {
    const serverId = this.generateServerId();
    
    const server: Server = {
      id: serverId,
      name: customName || this.generateServerName(serverType),
      status: 'running',
      server_type: serverType.server_type || this.getDefaultServerType(),
      datacenter: this.selectDatacenter(serverType),
      image: this.selectImage(),
      iso: null,
      primary_disk_size: serverType.server_type?.disk || 40,
      labels: {},
      protection: { delete: false, rebuild: false },
      backup_window: config?.enableBackups ? (config.backupWindow || '22-02') : null,
      rescue_enabled: false,
      locked: false,
      placement_group: null,
      public_net: this.generatePublicNet(serverId, config),
      private_net: [],
      load_balancers: [],
      volumes: [],
      included_traffic: serverType.included_traffic || 21990232555520, // 20TB
      ingoing_traffic: 0,
      outgoing_traffic: 0,
      created: new Date().toISOString(),
      priceEur: this.calculateServerPrice(serverType)
    };

    // Save to storage
    this.storage.addServer(server);
    
    return server;
  }

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  /** Generate unique server ID using timestamp */
  private generateServerId(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  /** Generate server name */
  private generateServerName(serverType: any): string {
    const memory = serverType.server_type?.memory || 8;
    const instanceNumber = Math.floor(Math.random() * 999) + 1;
    return `server-${memory}gb-${instanceNumber}`;
  }

  /** Get default server type configuration */
  private getDefaultServerType(): any {
    return {
      id: 114,
      name: 'cx23',
      architecture: 'x86',
      cores: 2,
      cpu_type: 'shared',
      category: 'cost_optimized',
      deprecated: false,
      description: 'CX 23',
      disk: 40,
      memory: 4,
      prices: [],
      storage_type: 'local',
      locations: []
    };
  }

  /** Select appropriate datacenter */
  private selectDatacenter(serverType: any): any {
    if (serverType.datacenter) {
      return serverType.datacenter;
    }

    // Return default datacenter
    return {
      id: 1,
      description: 'Helsinki virtual DC 1',
      name: 'hel1-dc1',
      location: {
        id: 1,
        name: 'hel1',
        description: 'Helsinki DC 1',
        country: 'FI',
        city: 'Helsinki',
        latitude: 60.169857,
        longitude: 24.938379,
        network_zone: 'eu-central'
      },
      server_types: {
        available: [114],
        available_for_migration: [114],
        supported: [114]
      }
    };
  }

  /** Select appropriate image */
  private selectImage(): any {
    return {
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
      protection: { delete: false },
      rapid_deploy: true,
      status: 'available',
      created: '2024-04-25T13:26:27Z',
      deleted: null
    };
  }

  /** Generate public networking configuration */
  private generatePublicNet(serverId: number, config?: any): any {
    return {
      firewalls: config?.selectedFirewalls?.map((id: number) => ({
        id: id,
        status: 'applied' as const
      })) || [],
      floating_ips: [],
      ipv4: config?.enableIPv4 !== false ? {
        id: serverId + 1000,
        ip: this.generateRandomIP(),
        blocked: false,
        dns_ptr: `static.${this.generateRandomIP().split('.').reverse().join('.')}.clients.your-server.de`
      } : null,
      ipv6: config?.enableIPv6 !== false ? {
        id: serverId + 2000,
        ip: this.generateRandomIPv6(),
        blocked: false,
        dns_ptr: []
      } : null
    };
  }

  /** Generate random IPv4 address */
  private generateRandomIP(): string {
    const segments = [
      Math.floor(Math.random() * 255) + 1,
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255)
    ];
    return segments.join('.');
  }

  /** Generate random IPv6 address */
  private generateRandomIPv6(): string {
    const segments = Array.from({ length: 8 }, () => 
      Math.floor(Math.random() * 65536).toString(16).padStart(4, '0')
    );
    return segments.join(':');
  }

  /** Calculate server price */
  private calculateServerPrice(serverType: any): number {
    const memory = serverType.server_type?.memory || 4;
    const cores = serverType.server_type?.cores || 2;
    return Math.round((memory * 0.75 + cores * 1.5) * 100) / 100;
  }

  // =============================================================================
  // DATA TRANSFORMATION
  // =============================================================================

  /** Transform server types from API response to server format */
  transformServerTypesToServers(serverTypes: any[]): any[] {
    return serverTypes.map((st, index) => {
      const baseServer = {
        id: 10000 + index,
        name: `${st.name}-template`,
        status: 'available' as const,
        server_type: st,
        datacenter: null,
        image: null,
        iso: null,
        primary_disk_size: st.disk,
        labels: {},
        protection: { delete: false, rebuild: false },
        backup_window: null,
        rescue_enabled: false,
        locked: false,
        placement_group: null,
        public_net: { firewalls: [], floating_ips: [], ipv4: null, ipv6: null },
        private_net: [],
        load_balancers: [],
        volumes: [],
        included_traffic: 21990232555520,
        ingoing_traffic: 0,
        outgoing_traffic: 0,
        created: new Date().toISOString(),
        priceEur: this.calculateServerPrice({ server_type: st })
      };

      return baseServer;
    });
  }
}