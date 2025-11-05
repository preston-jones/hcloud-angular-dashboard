import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { HetznerApiService } from '../../core/hetzner-api.service';
import { Server, Action } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  private api = inject(HetznerApiService);
  private router = inject(Router);

  // API state
  get loading() { return this.api.loading; }
  get servers() { return this.api.servers; }
  get actions() { return this.api.actions; }
  get firewalls() { return this.api.firewalls; }
  get floatingIps() { return this.api.floatingIps; }
  get loadBalancers() { return this.api.loadBalancers; }
  get networks() { return this.api.networks; }
  get error() { return this.api.error; }
  get isUsingMockData() { return this.api.isUsingMockData(); }

  ngOnInit() {
    // Servers are automatically loaded by the service
  }

  retry(): void {
    this.api.forceReloadServers();
  }

  // Use the service's myServers computed property (non-available servers)
  myServers = computed(() => {
    return this.api.myServers();
  });

  // Calculate totals
  totalCosts = computed(() => {
    const servers = this.myServers();
    return servers.reduce((total, server) => total + this.api.getServerPrice(server), 0);
  });

  totalVCpus = computed(() => {
    const servers = this.myServers();
    return servers.reduce((total, server) => total + (server.server_type?.cores || 0), 0);
  });

  totalMemory = computed(() => {
    const servers = this.myServers();
    return servers.reduce((total, server) => total + (server.server_type?.memory || 0), 0);
  });

  // Calculate total traffic - works with both mock and real API data
  totalIngoingTraffic = computed(() => {
    const servers = this.myServers();
    return servers.reduce((total, server) => total + this.api.getServerIncomingTraffic(server), 0);
  });

  totalOutgoingTraffic = computed(() => {
    const servers = this.myServers();
    return servers.reduce((total, server) => total + this.api.getServerOutgoingTraffic(server), 0);
  });

  // Resource totals (works for both mock and real API modes)
  totalLoadBalancers = computed(() => {
    // Try dedicated API first, fall back to server-attached load balancers
    const loadBalancers = this.loadBalancers();
    if (loadBalancers && loadBalancers.length > 0) {
      return loadBalancers.length;
    }
    
    // Fallback: count unique load balancers attached to servers
    const servers = this.myServers();
    const loadBalancerIds = new Set<number>();
    servers.forEach(server => {
      server.load_balancers?.forEach((lb: any) => {
        loadBalancerIds.add(lb.id || lb);
      });
    });
    return loadBalancerIds.size;
  });

  totalPrimaryIPs = computed(() => {
    // Count servers with primary IPv4 addresses
    const servers = this.myServers();
    return servers.filter(server => {
      const ipv4 = server.public_net?.ipv4;
      return ipv4 && typeof ipv4 === 'object' && 'id' in ipv4;
    }).length;
  });

  totalFloatingIPs = computed(() => {
    // Try dedicated API first, fall back to server-attached floating IPs
    const floatingIps = this.floatingIps();
    if (floatingIps && floatingIps.length > 0) {
      return floatingIps.length;
    }
    
    // Fallback: count unique floating IPs attached to servers
    const servers = this.myServers();
    const floatingIpIds = new Set<number>();
    servers.forEach(server => {
      server.public_net?.floating_ips?.forEach((fip: any) => {
        floatingIpIds.add(fip.id || fip);
      });
    });
    return floatingIpIds.size;
  });

  totalVolumes = computed(() => {
    // Count unique volumes attached to servers
    const servers = this.myServers();
    const volumeIds = new Set<number>();
    servers.forEach(server => {
      server.volumes?.forEach((volume: any) => {
        volumeIds.add(volume.id || volume);
      });
    });
    return volumeIds.size;
  });

  totalNetworks = computed(() => {
    // Try dedicated API first, fall back to server-attached networks
    const networks = this.networks();
    if (networks && networks.length > 0) {
      return networks.length;
    }
    
    // Fallback: count unique networks attached to servers
    const servers = this.myServers();
    const networkIds = new Set<number>();
    servers.forEach(server => {
      server.private_net?.forEach((network: any) => {
        networkIds.add(network.network || network.id || network);
      });
    });
    return networkIds.size;
  });

  totalFirewalls = computed(() => {
    // Try dedicated API first, fall back to server-attached firewalls
    const firewalls = this.firewalls();
    if (firewalls && firewalls.length > 0) {
      return firewalls.length;
    }
    
    // Fallback: count unique firewalls attached to servers
    const servers = this.myServers();
    const firewallIds = new Set<number>();
    servers.forEach(server => {
      server.public_net?.firewalls?.forEach((fw: any) => {
        firewallIds.add(fw.id || fw);
      });
    });
    return firewallIds.size;
  });

  totalBuckets = computed(() => {
    // Buckets are not directly attached to servers in Hetzner Cloud
    // This would require a separate API call in real implementation
    return 0;
  });

  // IPv6 addresses count
  totalIPv6Addresses = computed(() => {
    const servers = this.myServers();
    return servers.filter(server => {
      const ipv6 = server.public_net?.ipv6;
      return ipv6 && typeof ipv6 === 'object' && 'id' in ipv6;
    }).length;
  });

  // Protected servers count
  totalProtectedServers = computed(() => {
    const servers = this.myServers();
    return servers.filter(server => server.protection?.delete === true).length;
  });

  // Servers by datacenter location
  serversByLocation = computed(() => {
    const servers = this.myServers();
    const locationCounts: Record<string, number> = {};
    servers.forEach(server => {
      const location = server.datacenter?.location?.name || 'unknown';
      locationCounts[location] = (locationCounts[location] || 0) + 1;
    });
    return locationCounts;
  });

  // Total disk space across all servers
  totalDiskSpace = computed(() => {
    const servers = this.myServers();
    return servers.reduce((total, server) => total + (server.primary_disk_size || 0), 0);
  });

  // Recent actions
  recentActions = computed(() => {
    return this.api.getRecentActions();
  });

  // Get endpoint status for system status table
  getEndpointStatus = computed(() => {
    return this.api.getRecentEndpointStatus();
  });

  // Helper for status styling
  getStatusClass(status: number): string {
    if (status >= 200 && status < 300) {
      return 'text-green-600';
    } else if (status >= 400) {
      return 'text-red-600';
    }
    return 'text-yellow-600';
  }

  getStatusDot(status: number): string {
    if (status >= 200 && status < 300) {
      return '🟢';
    } else if (status >= 400) {
      return '🔴';
    }
    return '🟡';
  }

  getStatusText(status: number): string {
    if (status >= 200 && status < 300) {
      return 'OK';
    } else if (status >= 400 && status < 500) {
      return 'Client Error';
    } else if (status >= 500) {
      return 'Server Error';
    } else if (status >= 300 && status < 400) {
      return 'Redirect';
    }
    return 'Unknown';
  }

  formatStatusDate(dateString: string): string {
    return this.api.formatActionDate(dateString);
  }

  getSystemStatusTitle(): string {
    return this.api.mode() === 'mock' ? 'System Status (Demo)' : 'System Status';
  }

  // Format bytes to human readable
  formatBytes(bytes: number): string {
    return this.api.formatBytes(bytes);
  }

  // Navigation
  viewServerDetails(server: Server) {
    this.router.navigate(['/my-servers', server.id]);
  }

  goToMyServers() {
    this.router.navigate(['/my-servers']);
  }

  // TrackBy
  trackRow = (_: number, s: Server) => s.id;

  // Country helpers
  getCountryFlag(server: Server): string {
    return this.api.getCountryFlag(server.datacenter?.location?.country || '');
  }

  hasCountryData(server: Server): boolean {
    return !!server.datacenter?.location?.country && server.datacenter?.location?.country !== 'Unknown';
  }

  getLocationWithFlag(server: Server): string {
    const city: string = server.datacenter?.location?.city || server.datacenter?.location?.name || 'Unknown';
    if (this.hasCountryData(server)) {
      return `${this.getCountryFlag(server)} ${city}`;
    }
    return city;
  }

  // Price helper
  getServerPrice(server: Server): string {
    return this.api.getServerPriceFormatted(server);
  }

  // Hardware specs helpers
  getCpuCount(server: Server): string {
    return this.api.getCpuCount(server);
  }

  getRamSize(server: Server): string {
    return this.api.getRamSize(server);
  }

  getDiskSize(server: Server): string {
    return this.api.getDiskSize(server);
  }

  // Skeleton rows
  skeletonRows = Array.from({ length: 3 });

  // Action helpers
  getActionDisplay(command: string) {
    return this.api.getActionDisplay(command);
  }

  formatActionDate(dateString: string): string {
    return this.api.formatActionDate(dateString);
  }

  trackAction = (_: number, action: Action) => action.id;

  // Additional data helpers
  getTotalDiskSpaceFormatted(): string {
    return `${this.totalDiskSpace()} GB`;
  }

  getLocationBreakdown(): string {
    const locations = this.serversByLocation();
    const entries = Object.entries(locations);
    if (entries.length === 0) return 'No servers';
    if (entries.length === 1) return `${entries[0][1]} in ${entries[0][0]}`;
    return `${entries.length} locations`;
  }

  getProtectionStatus(): string {
    const total = this.myServers().length;
    const protected_ = this.totalProtectedServers();
    return `${protected_}/${total} protected`;
  }

  // Debug helper for development (can be removed in production)
  getDataSources() {
    if (!this.isUsingMockData) return null;
    
    return {
      mode: this.api.getCurrentMode(),
      resourceAvailability: this.api.getResourceAvailability(),
      serverCount: this.myServers().length,
      resourceCounts: {
        loadBalancers: this.totalLoadBalancers(),
        firewalls: this.totalFirewalls(),
        floatingIps: this.totalFloatingIPs(),
        networks: this.totalNetworks(),
        primaryIps: this.totalPrimaryIPs(),
        volumes: this.totalVolumes()
      }
    };
  }
}