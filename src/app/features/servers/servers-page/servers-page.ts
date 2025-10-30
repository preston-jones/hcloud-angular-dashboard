import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HetznerApiService, Server } from '../../../core/hetzner-api.service';

@Component({
  selector: 'app-servers-page',
  standalone: true,
  imports: [NgClass],
  templateUrl: './servers-page.html',
  styleUrls: ['./servers-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServersPage implements OnInit {
  private api = inject(HetznerApiService);
  private router = inject(Router);

  // UI state
  status = signal<'all' | 'running' | 'stopped'>('all');
  
  // Selection state for server creation
  selectedServerId = signal<number | null>(null);
  
  // Sorting state
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc' | 'none'>('none');

      // Get data from service
  servers = this.api.availableServerTypes;  // Use server types for creation page
  locations = this.api.locations;
  loading = this.api.loading;
  error = this.api.error;
  searchQuery = this.api.searchQuery;
  get isUsingMockData() { return this.api.isUsingMockData(); }

  ngOnInit() {
    // Load server types (available configurations) for this page
    this.api.loadServerTypes();
  }

  retry(): void {
    this.api.loadServerTypes();
  }

  // Only show available server types (not actual servers)
  availableServers = computed(() => {
    const serverTypes = this.servers() || [];  // Now reading from serverTypes signal
    return serverTypes.filter(s => s.status === 'available');
  });

  // Gefilterter View for available servers
  view = computed(() => {
    const serverList = this.availableServers();
    if (!serverList) return [];
    
    const term = this.searchQuery().toLowerCase();
    
    // Filter first - remove status filter since all are 'available'
    const filtered = serverList.filter(s => {
      const matchesQuery =
        s.name.toLowerCase().includes(term) ||
        (s.server_type?.name || '').toLowerCase().includes(term) ||
        (s.datacenter?.location?.name || '').toLowerCase().includes(term);
      return matchesQuery;
    });

    // Then apply sorting
    return this.sortServers(filtered);
  });

  // Handlers
  onStatusChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.status.set(select.value as 'all' | 'running' | 'stopped');
  }

  // Sorting handler
  onSort(column: string) {
    const currentColumn = this.sortColumn();
    const currentDirection = this.sortDirection();

    if (currentColumn === column) {
      // Cycle through: none -> asc -> desc -> none
      switch (currentDirection) {
        case 'none':
          this.sortDirection.set('asc');
          break;
        case 'asc':
          this.sortDirection.set('desc');
          break;
        case 'desc':
          this.sortColumn.set(null);
          this.sortDirection.set('none');
          break;
      }
    } else {
      // New column, start with ascending
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  // Get sort value for a server based on column
  private getSortValue(server: Server, column: string): any {
    switch (column) {
      case 'name':
        return server.name.toLowerCase();
      case 'type':
        return (server.server_type?.name || '').toLowerCase();
      case 'vcpus':
        return server.server_type?.cores || 0;
      case 'ram':
        return server.server_type?.memory || 0;
      case 'ssd':
        return server.server_type?.disk || 0;
      case 'location':
        return this.getCleanCityName(server).toLowerCase();
      case 'status':
        return server.status;
      case 'price':
        return server.priceEur;
      default:
        return '';
    }
  }

  // Sort servers array
  private sortServers(servers: Server[]): Server[] {
    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (!column || direction === 'none') {
      return servers;
    }

    return [...servers].sort((a, b) => {
      const aValue = this.getSortValue(a, column);
      const bValue = this.getSortValue(b, column);

      let comparison = 0;
      
      if (aValue < bValue) {
        comparison = -1;
      } else if (aValue > bValue) {
        comparison = 1;
      }

      return direction === 'asc' ? comparison : -comparison;
    });
  }

  // Selection methods
  selectServer(server: Server): void {
    this.selectedServerId.set(server.id);
  }

  isSelected(server: Server): boolean {
    return this.selectedServerId() === server.id;
  }

  hasSelection(): boolean {
    return this.selectedServerId() !== null;
  }

  getSelectedServer(): Server | null {
    const selectedId = this.selectedServerId();
    if (!selectedId) return null;
    
    const servers = this.availableServers();
    return servers.find(s => s.id === selectedId) || null;
  }

  createSelectedServer(): void {
    const selected = this.getSelectedServer();
    if (selected) {
      this.api.createServerFromType(selected);
      
      // Only navigate back if we're in mock mode (actual creation happened)
      if (this.api.getCurrentMode() === 'mock') {
        // Navigate back to my servers
        this.router.navigate(['/my-servers']);
      }
      // In API mode, the demo dialog will show and user stays on the current page
    }
  }

  // TrackBy
  trackRow = (_: number, s: Server) => s.id;

  // Country helpers
  getCountryFlag(server: Server): string {
    return this.api.getCountryFlag(server.datacenter?.location?.country || '');
  }

  hasCountryData(server: Server): boolean {
    return !!server.datacenter?.location?.country && server.datacenter.location.country !== 'Unknown';
  }

  getLocationWithFlag(server: Server): string {
    const city = server.datacenter?.location?.city || server.datacenter?.location?.name || 'Unknown';
    if (this.hasCountryData(server)) {
      return `${this.getCountryFlag(server)} ${city}`;
    }
    return city;
  }

  // Helper to get clean city name (removes state abbreviations)
  getCleanCityName(server: Server): string {
    // For server types (available servers), show "All Locations" since they can be deployed anywhere
    if (!server.datacenter) {
      return 'All Locations';
    }
    
    // For actual server instances, show the city
    const fullCity = server.datacenter?.location?.city || server.datacenter?.location?.name || 'Unknown';
    // Remove state abbreviations like ", VA", ", OR", etc.
    return fullCity.replace(/,\s*[A-Z]{2}$/, '');
  }

  // Hardware specs helpers - using structured data only
  getCpuCount(server: Server): string {
    return server.server_type?.cores ? `${server.server_type.cores}` : '0';
  }

  getRamSize(server: Server): string {
    return server.server_type?.memory ? `${server.server_type.memory} GB` : '0 GB';
  }

  getDiskSize(server: Server): string {
    return server.server_type?.disk ? `${server.server_type.disk} GB` : '0 GB';
  }

  getHardwareSpecs(server: Server): string {
    return `${this.getCpuCount(server)} vCPU • ${this.getRamSize(server)} • ${this.getDiskSize(server)} SSD`;
  }

  // Für Skeleton-Schleifen
  skeletonRows = Array.from({ length: 6 });

  // Get sort indicator for column header
  getSortIndicator(column: string): string {
    if (this.sortColumn() !== column) {
      return '▲▼'; // Default: both arrows when not sorted
    }
    
    switch (this.sortDirection()) {
      case 'asc':
        return '▲'; // Ascending arrow only
      case 'desc':
        return '▼'; // Descending arrow only
      default:
        return '▲▼'; // Default: both arrows
    }
  }

  // Check if up arrow should be visible
  showUpArrow(column: string): boolean {
    if (this.sortColumn() !== column) {
      return true; // Show both arrows when not sorted
    }
    return this.sortDirection() === 'asc' || this.sortDirection() === 'none';
  }

  // Check if down arrow should be visible
  showDownArrow(column: string): boolean {
    if (this.sortColumn() !== column) {
      return true; // Show both arrows when not sorted
    }
    return this.sortDirection() === 'desc' || this.sortDirection() === 'none';
  }

  // Check if column is currently being sorted
  isColumnSorted(column: string): boolean {
    return this.sortColumn() === column && this.sortDirection() !== 'none';
  }
}
