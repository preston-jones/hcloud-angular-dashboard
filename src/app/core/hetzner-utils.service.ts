import { Injectable } from '@angular/core';
import { Server, Action } from './models';

/**
 * Utility service for data formatting and display helpers
 * Contains all the formatting, calculation and display methods
 */
@Injectable({ providedIn: 'root' })
export class HetznerUtilsService {

  // =============================================================================
  // SERVER UTILITY METHODS
  // =============================================================================

  /** Get server price as number */
  getServerPrice(server: Server): number {
    return server.priceEur || this.calculateServerPrice(server);
  }

  /** Get formatted server price */
  getServerPriceFormatted(server: Server): string {
    return this.getServerPrice(server).toFixed(2);
  }

  /** Calculate server price from specs */
  private calculateServerPrice(server: Server): number {
    const memory = server.server_type?.memory || 4;
    const cores = server.server_type?.cores || 2;
    return Math.round((memory * 0.75 + cores * 1.5) * 100) / 100;
  }

  /** Get server incoming traffic */
  getServerIncomingTraffic(server: Server): number {
    return server.ingoing_traffic || 0;
  }

  /** Get server outgoing traffic */
  getServerOutgoingTraffic(server: Server): number {
    return server.outgoing_traffic || 0;
  }

  /** Get CPU count display */
  getCpuCount(server: Server): string {
    const cores = server.server_type?.cores || 1;
    return `${cores} vCPU${cores > 1 ? 's' : ''}`;
  }

  /** Get RAM size display */
  getRamSize(server: Server): string {
    const memory = server.server_type?.memory || 1;
    return `${memory} GB`;
  }

  /** Get disk size display */
  getDiskSize(server: Server): string {
    const disk = server.primary_disk_size || server.server_type?.disk || 20;
    return `${disk} GB SSD`;
  }

  /** Get server architecture */
  getArchitecture(server: Server): string {
    return server.server_type?.architecture || 'x86';
  }

  /** Get network zone */
  getNetworkZone(server: Server): string {
    return server.datacenter?.location?.network_zone || 'eu-central';
  }

  /** Get public IP address */
  getPublicIP(server: Server): string {
    const ipv4 = server.public_net?.ipv4;
    if (ipv4 && typeof ipv4 === 'object' && 'ip' in ipv4) {
      return ipv4.ip;
    }
    return 'Not assigned';
  }

  /** Get created time ago display */
  getCreatedTimeAgo(server: Server): string {
    if (!server.created) return 'Unknown';
    
    const now = new Date();
    const created = new Date(server.created);
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return '1 month ago';
    if (diffMonths < 12) return `${diffMonths} months ago`;
    
    const diffYears = Math.floor(diffDays / 365);
    return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
  }

  // =============================================================================
  // LOCATION & COUNTRY HELPERS
  // =============================================================================

  /** Get country flag emoji */
  getCountryFlag(countryCode: string): string {
    if (!countryCode || countryCode === 'Unknown') return '🌍';
    
    const flagMap: Record<string, string> = {
      'DE': '🇩🇪', 'FI': '🇫🇮', 'US': '🇺🇸', 'UK': '🇬🇧', 'FR': '🇫🇷',
      'NL': '🇳🇱', 'SG': '🇸🇬', 'AU': '🇦🇺', 'JP': '🇯🇵', 'IN': '🇮🇳'
    };
    
    return flagMap[countryCode.toUpperCase()] || '🌍';
  }

  /** Get location with flag display */
  getLocationWithFlag(server: Server): string {
    const city = server.datacenter?.location?.city || 
                 server.datacenter?.location?.name || 'Unknown';
    const country = server.datacenter?.location?.country;
    
    if (country && country !== 'Unknown') {
      return `${this.getCountryFlag(country)} ${city}`;
    }
    
    return city;
  }

  // =============================================================================
  // ACTION HELPERS
  // =============================================================================

  /** Get action display information */
  getActionDisplay(command: string): { icon: string; label: string } {
    const actionMap: Record<string, { icon: string; label: string }> = {
      'create_server': { icon: '🖥️', label: 'Server erstellt' },
      'start_server': { icon: '▶️', label: 'Server gestartet' },
      'stop_server': { icon: '⏹️', label: 'Server gestoppt' },
      'reboot_server': { icon: '🔄', label: 'Server neu gestartet' },
      'delete_server': { icon: '🗑️', label: 'Server gelöscht' },
      'resize_server': { icon: '📊', label: 'Server skaliert' },
      'change_protection': { icon: '🛡️', label: 'Schutz geändert' },
      'enable_rescue': { icon: '🚑', label: 'Rescue aktiviert' },
      'disable_rescue': { icon: '✅', label: 'Rescue deaktiviert' },
      'create_image': { icon: '💿', label: 'Image erstellt' },
      'rebuild_server': { icon: '🔨', label: 'Server neu aufgebaut' }
    };

    return actionMap[command] || { icon: '⚙️', label: 'Aktion ausgeführt' };
  }

  /** Format action date */
  formatActionDate(dateString: string): string {
    if (!dateString) return 'Unbekannt';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMinutes < 1) return 'gerade eben';
    if (diffMinutes < 60) return `vor ${diffMinutes} Min`;
    if (diffHours < 24) return `vor ${diffHours} Std`;
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    
    return date.toLocaleDateString('de-DE');
  }

  /** Get recent actions (mock implementation) */
  getRecentActions(): Action[] {
    // This would typically come from the API service
    // For now, return empty array - to be implemented with proper action loading
    return [];
  }

  // =============================================================================
  // FORMAT HELPERS
  // =============================================================================

  /** Format bytes to human readable */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // =============================================================================
  // RESOURCE AVAILABILITY (DEBUG HELPER)
  // =============================================================================

  /** Get resource availability for debugging */
  getResourceAvailability(): Record<string, boolean> {
    return {
      servers: true,
      serverTypes: true,
      locations: true,
      datacenters: true,
      images: true,
      firewalls: true,
      actions: true,
      floatingIps: true,
      loadBalancers: true,
      networks: true
    };
  }
}