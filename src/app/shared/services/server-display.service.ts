import { Injectable, inject } from '@angular/core';
import { Server } from '../../core/models';
import { HetznerApiService } from '../../core/hetzner-api.service';

@Injectable({
  providedIn: 'root'
})
export class ServerDisplayService {
  private api = inject(HetznerApiService);

  // Get the monthly price for a server
  getServerPrice(server: Server): string {
    return this.api.getServerPriceFormatted(server);
  }

  // Get server type display name
  getServerType(server: Server): string {
    return server.server_type.name || 'Unknown';
  }

  // Hardware specs helpers
  getCpuCount(server: Server): string {
    return server.server_type.cores ? `${server.server_type.cores}` : '0';
  }

  getRamSize(server: Server): string {
    return server.server_type.memory ? `${server.server_type.memory} GB` : '0 GB';
  }

  getDiskSize(server: Server): string {
    return server.server_type.disk ? `${server.server_type.disk} GB` : '0 GB';
  }

  // Get server architecture
  getArchitecture(server: Server): string {
    return server.server_type.architecture || 'x86';
  }

  // Get network zone
  getNetworkZone(server: Server): string {
    return server.datacenter.location.network_zone || 'unknown';
  }

  // Get public IP address
  getPublicIP(server: Server): string {
    return server.public_net.ipv4.ip || 'No IP';
  }

  // Get creation time in German format
  getCreatedTimeAgo(server: Server): string {
    if (!server.created) return 'Unbekannt';
    
    const createdDate = new Date(server.created);
    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();
    
    // Convert to different time units
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `vor ${diffDays} ${diffDays === 1 ? 'Tag' : 'Tage'}`;
    } else if (diffHours > 0) {
      const remainingMinutes = diffMinutes % 60;
      if (remainingMinutes > 0) {
        return `vor ${diffHours} ${diffHours === 1 ? 'Stunde' : 'Stunden'} ${remainingMinutes} ${remainingMinutes === 1 ? 'Minute' : 'Minuten'}`;
      } else {
        return `vor ${diffHours} ${diffHours === 1 ? 'Stunde' : 'Stunden'}`;
      }
    } else if (diffMinutes > 0) {
      return `vor ${diffMinutes} ${diffMinutes === 1 ? 'Minute' : 'Minuten'}`;
    } else {
      return 'gerade eben';
    }
  }

  // Location helpers
  getLocationWithFlag(server: Server): string {
    const city: string = server.datacenter.location.city || server.datacenter.location.name || 'Unknown';
    if (server.datacenter.location.country) {
      const flag = this.api.getCountryFlag(server.datacenter.location.country);
      return `${flag} ${city}`;
    }
    return city;
  }
}