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
  
  // Sorting state
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc' | 'none'>('none');

  // API state von Service
  get loading() { return this.api.loading; }
  get servers() { return this.api.servers; }
  get error() { return this.api.error; }
  get isUsingMockData() { return this.api.isUsingMockData; }
  get searchQuery() { return this.api.searchQuery; }

  ngOnInit() {
    // Server beim Laden der Komponente laden
    this.api.loadServers();
  }

  retry(): void {
    this.api.loadServers();
  }

  // Gefilterter View
  view = computed(() => {
    const serverList = this.servers();
    if (!serverList) return [];
    
    const term = this.searchQuery().toLowerCase();
    const st = this.status();
    
    // Filter first
    const filtered = serverList.filter(s => {
      const matchesQuery =
        s.name.toLowerCase().includes(term) ||
        s.type.toLowerCase().includes(term) ||
        s.location.toLowerCase().includes(term);
      const matchesStatus = st === 'all' || s.status === st;
      return matchesQuery && matchesStatus;
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
        return server.type.toLowerCase();
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

  // Navigation
  viewServerDetails(server: Server) {
    this.router.navigate(['/servers', server.id]);
  }

  // TrackBy
  trackRow = (_: number, s: Server) => s.id;

  // Country helpers
  getCountryFlag(server: Server): string {
    return this.api.getCountryFlag(server.country || '');
  }

  hasCountryData(server: Server): boolean {
    return this.api.hasCountryData(server);
  }

  getLocationWithFlag(server: Server): string {
    const city = server.datacenter?.location?.city || server.location;
    if (this.hasCountryData(server)) {
      return `${this.getCountryFlag(server)} ${city}`;
    }
    return city;
  }

  // Helper to get clean city name (removes state abbreviations)
  getCleanCityName(server: Server): string {
    const fullCity = server.datacenter?.location?.city || server.location;
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
      return '⇅'; // Default sort icon when not sorted
    }
    
    switch (this.sortDirection()) {
      case 'asc':
        return '▲'; // Ascending arrow
      case 'desc':
        return '▼'; // Descending arrow
      default:
        return '⇅'; // Default sort icon
    }
  }

  // Check if column is currently being sorted
  isColumnSorted(column: string): boolean {
    return this.sortColumn() === column && this.sortDirection() !== 'none';
  }
}
