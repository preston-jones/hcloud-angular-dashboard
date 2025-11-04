import { Injectable, computed } from '@angular/core';
import { ServerArchitecture, BackupWindow } from '../../../core/models';

/**
 * Service for data mappings, lookups, and static configurations
 */
@Injectable({
  providedIn: 'root'
})
export class DataMappingService {

  // ============================================================================
  // BACKUP WINDOW DEFINITIONS
  // ============================================================================
  backupWindows = computed((): BackupWindow[] => [
    { value: '22-02', label: '22:00 - 02:00 UTC (Late Night)' },
    { value: '02-06', label: '02:00 - 06:00 UTC (Early Morning)' },
    { value: '06-10', label: '06:00 - 10:00 UTC (Morning)' },
    { value: '10-14', label: '10:00 - 14:00 UTC (Midday)' },
    { value: '14-18', label: '14:00 - 18:00 UTC (Afternoon)' },
    { value: '18-22', label: '18:00 - 22:00 UTC (Evening)' }
  ]);

  // ============================================================================
  // LOCATION MAPPINGS
  // ============================================================================
  getLocationDisplayName(locationCode: string): string {
    const locationMap: Record<string, string> = {
      'fsn1': 'Falkenstein, Germany',
      'nbg1': 'Nürnberg, Germany',
      'hel1': 'Helsinki, Finland',
      'ash': 'Ashburn, USA',
      'hil': 'Hillsboro, USA',
      'sin': 'Singapore, Singapore'
    };
    return locationMap[locationCode] || locationCode;
  }

  getLocationFlag(locationCode: string): string {
    const flagMap: Record<string, string> = {
      'fsn1': '🇩🇪',
      'nbg1': '🇩🇪',
      'hel1': '🇫🇮',
      'ash': '🇺🇸',
      'hil': '🇺🇸',
      'sin': '🇸🇬'
    };
    return flagMap[locationCode] || '🌍';
  }

  // ============================================================================
  // IMAGE MAPPINGS
  // ============================================================================
  getImageDisplayName(imageCode: string): string {
    const imageMap: Record<string, string> = {
      'ubuntu': 'Ubuntu 22.04 LTS',
      'fedora': 'Fedora 38',
      'debian': 'Debian 12',
      'centos': 'CentOS Stream 9',
      'docker': 'Docker on Ubuntu 22.04'
    };
    return imageMap[imageCode] || imageCode;
  }

  // ============================================================================
  // ARCHITECTURE MAPPINGS
  // ============================================================================
  matchesArchitectureCategory(category: string | undefined, architecture: ServerArchitecture): boolean {
    switch (architecture) {
      case 'cost-optimized':
        return category === 'cost_optimized';
      case 'regular-performance':
        return category === 'regular_purpose';
      case 'general-purpose':
        return category === 'general_purpose';
      default:
        return false;
    }
  }

  matchesCpuArchitecture(arch: string | undefined, cpuArch: string): boolean {
    if (cpuArch === 'x86') {
      return arch === 'x86';
    } else if (cpuArch === 'arm64') {
      return arch === 'arm';
    }
    return false;
  }

  getArchitectureDisplayName(arch: string, cpuArch: string): string {
    const archName = this.getArchitectureName(arch);
    const cpuName = cpuArch === 'x86' ? 'x86' : 'Arm64';
    
    return archName ? `${archName} (${cpuName})` : '';
  }

  private getArchitectureName(arch: string): string {
    switch (arch) {
      case 'cost-optimized': return 'Cost-Optimized';
      case 'regular-performance': return 'Regular Performance';
      case 'general-purpose': return 'General Purpose';
      default: return arch;
    }
  }

  // ============================================================================
  // BACKUP WINDOW UTILITIES
  // ============================================================================
  getBackupWindowLabel(selectedWindow: string): string {
    const windows = this.backupWindows();
    return windows.find(w => w.value === selectedWindow)?.label || '';
  }

  // ============================================================================
  // CPU ARCHITECTURE AUTO-SETTING
  // ============================================================================
  autoSetCpuArchitecture(architecture: ServerArchitecture): 'x86' | 'arm64' {
    if (architecture === 'regular-performance' || architecture === 'general-purpose') {
      return 'x86';
    }
    return 'x86'; // Default fallback
  }

  // ============================================================================
  // IMAGE OBJECT HANDLING
  // ============================================================================
  getImageObjectForType(imageType: string): any {
    const imageMap: Record<string, any> = {
      'ubuntu-20.04': { id: 67794396, type: 'system', name: 'ubuntu-20.04', architecture: 'x86', os_flavor: 'ubuntu', os_version: '20.04' },
      'ubuntu-22.04': { id: 103908130, type: 'system', name: 'ubuntu-22.04', architecture: 'x86', os_flavor: 'ubuntu', os_version: '22.04' },
      'ubuntu-24.04': { id: 161547269, type: 'system', name: 'ubuntu-24.04', architecture: 'x86', os_flavor: 'ubuntu', os_version: '24.04' },
      'debian-11': { id: 54290940, type: 'system', name: 'debian-11', architecture: 'x86', os_flavor: 'debian', os_version: '11' },
      'debian-12': { id: 114690389, type: 'system', name: 'debian-12', architecture: 'x86', os_flavor: 'debian', os_version: '12' },
      'centos-stream-8': { id: 67794395, type: 'system', name: 'centos-stream-8', architecture: 'x86', os_flavor: 'centos', os_version: '8' },
      'centos-stream-9': { id: 101908253, type: 'system', name: 'centos-stream-9', architecture: 'x86', os_flavor: 'centos', os_version: '9' },
      'rocky-8': { id: 103908144, type: 'system', name: 'rocky-8', architecture: 'x86', os_flavor: 'rocky', os_version: '8' },
      'rocky-9': { id: 103908145, type: 'system', name: 'rocky-9', architecture: 'x86', os_flavor: 'rocky', os_version: '9' },
      'fedora-38': { id: 114690387, type: 'system', name: 'fedora-38', architecture: 'x86', os_flavor: 'fedora', os_version: '38' },
      'fedora-39': { id: 137392072, type: 'system', name: 'fedora-39', architecture: 'x86', os_flavor: 'fedora', os_version: '39' },
      'alma-8': { id: 103908249, type: 'system', name: 'alma-8', architecture: 'x86', os_flavor: 'alma', os_version: '8' },
      'alma-9': { id: 103908251, type: 'system', name: 'alma-9', architecture: 'x86', os_flavor: 'alma', os_version: '9' },
      'docker-ce': { id: 61167741, type: 'app', name: 'docker-ce', architecture: 'x86', os_flavor: 'ubuntu', os_version: '20.04' }
    };

    return imageMap[imageType] || this.getDefaultImage();
  }

  // ============================================================================
  // DEFAULT OBJECTS
  // ============================================================================
  getDefaultServerType(): any {
    return {
      id: 1, name: 'cx11', architecture: 'cost-optimized', cores: 1, cpu_type: 'shared', category: 'basic',
      deprecated: false, deprecation: null, description: 'CX11', disk: 25, memory: 4,
      prices: [{ location: 'fsn1', price_hourly: { net: '0.0040000000', gross: '0.0047600000' },
        price_monthly: { net: '2.6900000000', gross: '3.2011000000' }, included_traffic: 21990232555520,
        price_per_tb_traffic: { net: '1.0000000000', gross: '1.1900000000' } }],
      storage_type: 'local', locations: []
    };
  }

  getDefaultDatacenter(): any {
    return {
      id: 1, description: 'Falkenstein DC Park 1',
      location: { id: 1, name: 'fsn1', description: 'Falkenstein DC Park 1', city: 'Falkenstein',
        country: 'DE', latitude: 50.47612, longitude: 12.370071, network_zone: 'eu-central' },
      name: 'fsn1-dc14',
      server_types: { available: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21], 
        available_for_migration: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21],
        supported: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21] }
    };
  }

  getDefaultImage(): any {
    return {
      id: 67794396, type: 'system', name: 'ubuntu-20.04', architecture: 'x86', bound_to: null,
      created_from: null, deprecated: null, description: 'Ubuntu 20.04 Server', disk_size: 5,
      image_size: null, labels: {}, os_flavor: 'ubuntu', os_version: '20.04',
      protection: { delete: false }, rapid_deploy: true, status: 'available',
      created: '2021-01-30T00:00:00+00:00', deleted: null
    };
  }
}