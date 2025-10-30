import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HetznerApiService } from '../../../core/hetzner-api.service';
import { Server, StatusFilter, SortDirection, SortColumn } from '../../../core/models';

@Component({
  selector: 'app-my-servers-page',
  standalone: true,
  imports: [NgClass],
  template: `
    <section class="space-y-4">
      <!-- Toolbar -->
      <header class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 class="text-xl font-semibold text-ink">My Servers</h1>

        <div class="flex flex-wrap gap-2 items-center">
          <select
            class="rounded-lg border border-ui bg-surface-elev text-ink px-3 py-2"
            (change)="onStatusChange($event)">
            <option value="all">All status</option>
            <option value="running">Running</option>
            <option value="stopped">Stopped</option>
          </select>

          <button 
            class="px-4 py-2 rounded-lg text-white bg-primary hover:bg-primary-700 transition-colors w-32 min-w-32"
            (click)="navigateToServerSelection()">
            Create Server
          </button>
        </div>
      </header>

      <!-- Bulk Operations -->
      @if (myServers().length > 0 && !loading()) {
        <div class="flex flex-wrap gap-2 items-center p-4 bg-surface-elev rounded-lg border border-ui">
          <span class="text-sm text-soft mr-2">Bulk Operations:</span>
          
          <button 
            class="px-3 py-1.5 text-xs rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors"
            (click)="startAllServers()"
            [disabled]="!hasStoppedServers()"
            [class.opacity-50]="!hasStoppedServers()">
            Start All
          </button>
          
          <button 
            class="px-3 py-1.5 text-xs rounded-md bg-yellow-600 hover:bg-yellow-700 text-white transition-colors"
            (click)="stopAllServers()"
            [disabled]="!hasRunningServers()"
            [class.opacity-50]="!hasRunningServers()">
            Stop All
          </button>
          
          <button 
            class="px-3 py-1.5 text-xs rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors"
            (click)="deleteAllServers()">
            Delete All
          </button>
          
          <span class="text-xs text-soft ml-2">
            ({{ myServers().length }} server{{ myServers().length !== 1 ? 's' : '' }})
          </span>
        </div>
      }

      <!-- SKELETON (Table with card rows) -->
      @if (loading()) {
        <div class="hidden md:block space-y-4">
          <!-- Skeleton Header -->
          <div class="bg-[color-mix(in_oklab,_var(--surface)_92%,_black)] rounded-lg border border-ui/30 px-4 py-3">
            <div class="grid grid-cols-[2fr_1fr_0.5fr_0.5fr_0.5fr_1fr_1fr_1fr] gap-4">
              <div class="skeleton h-4 w-12"></div>
              <div class="skeleton h-4 w-10"></div>
              <div class="skeleton h-4 w-8"></div>
              <div class="skeleton h-4 w-8"></div>
              <div class="skeleton h-4 w-8"></div>
              <div class="skeleton h-4 w-16"></div>
              <div class="skeleton h-4 w-12"></div>
              <div class="skeleton h-4 w-12"></div>
            </div>
          </div>

          <!-- Skeleton Rows -->
          <div class="space-y-3">
            @for (_ of [1,2,3,4,5]; track $index) {
              <div class="server-card">
                <div class="grid grid-cols-[2fr_1fr_0.5fr_0.5fr_0.5fr_1fr_1fr_1fr] gap-4 items-center">
                  <div class="skeleton h-5 w-3/4"></div>
                  <div class="skeleton h-5 w-1/2"></div>
                  <div class="skeleton h-5 w-full"></div>
                  <div class="skeleton h-5 w-full"></div>
                  <div class="skeleton h-5 w-full"></div>
                  <div class="skeleton h-5 w-2/3"></div>
                  <div class="skeleton h-5 w-1/2"></div>
                  <div class="skeleton h-5 w-1/2"></div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ERROR STATE -->
      @if (!loading() && error()) {
        <div class="text-center py-12">
          <div class="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 class="text-lg font-medium text-ink mb-2">Failed to load servers</h2>
          <p class="text-soft mb-4">{{ error() }}</p>
          <button 
            class="px-4 py-2 rounded-lg text-white bg-primary hover:bg-primary-700 transition-colors w-16 min-w-16"
            (click)="retry()">
            Retry
          </button>
        </div>
      }

      <!-- EMPTY STATE -->
      @if (!loading() && !error() && myServers().length === 0) {
        <div class="text-center py-12">
          <div class="text-4xl mb-4">🖥️</div>
          <h2 class="text-lg font-medium text-ink mb-2">No servers found</h2>
          <p class="text-soft mb-6">
            You don't have any servers in your Hetzner Cloud project yet.
          </p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              class="px-4 py-2 rounded-lg text-white bg-primary hover:bg-primary-700 transition-colors w-44 min-w-44"
              (click)="navigateToServerSelection()">
              Create Your First Server
            </button>
            <a 
              href="https://console.hetzner.cloud/" 
              target="_blank"
              class="px-4 py-2 rounded-lg border border-slate-300 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
              Open Hetzner Console
            </a>
          </div>
        </div>
      }

      <!-- TABLE WITH CARD ROWS (Responsive) -->
      @if (!loading() && !error() && myServers().length > 0) {
        <div class="space-y-4">
          <!-- Table Header -->
          <div class="px-4 py-3">
            <div class="grid grid-cols-[2fr_1fr_0.5fr_0.5fr_0.5fr_1fr_1fr_1fr] gap-4 text-sm text-soft font-bold">
              <button 
                class="sortable-header text-left"
                [class.sorted]="isColumnSorted('name')"
                (click)="onSort('name')"
                [attr.aria-label]="'Sort by name ' + (sortColumn() === 'name' ? sortDirection() : 'none')"
                type="button">
                <span>Name</span>
                <span class="sort-arrow" aria-hidden="true">
                  <span class="sort-arrow-up" [style.display]="showUpArrow('name') ? 'block' : 'none'">▲</span>
                  <span class="sort-arrow-down" [style.display]="showDownArrow('name') ? 'block' : 'none'">▼</span>
                </span>
              </button>
              <button 
                class="sortable-header text-left"
                [class.sorted]="isColumnSorted('type')"
                (click)="onSort('type')"
                [attr.aria-label]="'Sort by type ' + (sortColumn() === 'type' ? sortDirection() : 'none')"
                type="button">
                <span>Type</span>
                <span class="sort-arrow" aria-hidden="true">
                  <span class="sort-arrow-up" [style.display]="showUpArrow('type') ? 'block' : 'none'">▲</span>
                  <span class="sort-arrow-down" [style.display]="showDownArrow('type') ? 'block' : 'none'">▼</span>
                </span>
              </button>
              <button 
                class="sortable-header text-left text-xs"
                [class.sorted]="isColumnSorted('vcpus')"
                (click)="onSort('vcpus')"
                [attr.aria-label]="'Sort by vCPUs ' + (sortColumn() === 'vcpus' ? sortDirection() : 'none')"
                type="button">
                <span>vCPUs</span>
                <span class="sort-arrow" aria-hidden="true">
                  <span class="sort-arrow-up" [style.display]="showUpArrow('vcpus') ? 'block' : 'none'">▲</span>
                  <span class="sort-arrow-down" [style.display]="showDownArrow('vcpus') ? 'block' : 'none'">▼</span>
                </span>
              </button>
              <button 
                class="sortable-header text-left text-xs"
                [class.sorted]="isColumnSorted('ram')"
                (click)="onSort('ram')"
                [attr.aria-label]="'Sort by RAM ' + (sortColumn() === 'ram' ? sortDirection() : 'none')"
                type="button">
                <span>RAM</span>
                <span class="sort-arrow" aria-hidden="true">
                  <span class="sort-arrow-up" [style.display]="showUpArrow('ram') ? 'block' : 'none'">▲</span>
                  <span class="sort-arrow-down" [style.display]="showDownArrow('ram') ? 'block' : 'none'">▼</span>
                </span>
              </button>
              <button 
                class="sortable-header text-left text-xs"
                [class.sorted]="isColumnSorted('ssd')"
                (click)="onSort('ssd')"
                [attr.aria-label]="'Sort by SSD storage ' + (sortColumn() === 'ssd' ? sortDirection() : 'none')"
                type="button">
                <span>SSD</span>
                <span class="sort-arrow" aria-hidden="true">
                  <span class="sort-arrow-up" [style.display]="showUpArrow('ssd') ? 'block' : 'none'">▲</span>
                  <span class="sort-arrow-down" [style.display]="showDownArrow('ssd') ? 'block' : 'none'">▼</span>
                </span>
              </button>
              <button 
                class="sortable-header text-left"
                [class.sorted]="isColumnSorted('location')"
                (click)="onSort('location')"
                [attr.aria-label]="'Sort by location ' + (sortColumn() === 'location' ? sortDirection() : 'none')"
                type="button">
                <span>Location</span>
                <span class="sort-arrow" aria-hidden="true">
                  <span class="sort-arrow-up" [style.display]="showUpArrow('location') ? 'block' : 'none'">▲</span>
                  <span class="sort-arrow-down" [style.display]="showDownArrow('location') ? 'block' : 'none'">▼</span>
                </span>
              </button>
              <button 
                class="sortable-header text-left"
                [class.sorted]="isColumnSorted('status')"
                (click)="onSort('status')"
                [attr.aria-label]="'Sort by status ' + (sortColumn() === 'status' ? sortDirection() : 'none')"
                type="button">
                <span>Status</span>
                <span class="sort-arrow" aria-hidden="true">
                  <span class="sort-arrow-up" [style.display]="showUpArrow('status') ? 'block' : 'none'">▲</span>
                  <span class="sort-arrow-down" [style.display]="showDownArrow('status') ? 'block' : 'none'">▼</span>
                </span>
              </button>
              <button 
                class="sortable-header text-right"
                [class.sorted]="isColumnSorted('price')"
                (click)="onSort('price')"
                [attr.aria-label]="'Sort by price ' + (sortColumn() === 'price' ? sortDirection() : 'none')"
                type="button">
                <span>Price</span>
                <span class="sort-arrow" aria-hidden="true">
                  <span class="sort-arrow-up" [style.display]="showUpArrow('price') ? 'block' : 'none'">▲</span>
                  <span class="sort-arrow-down" [style.display]="showDownArrow('price') ? 'block' : 'none'">▼</span>
                </span>
              </button>
            </div>
          </div>

          <!-- Table Rows as Cards -->
          <div class="space-y-3">
            @for (s of myServers(); track s.id) {
              <div class="server-card cursor-pointer" (click)="viewServerDetails(s)">
                <div class="grid grid-cols-[2fr_1fr_0.5fr_0.5fr_0.5fr_1fr_1fr_1fr] gap-4 items-center text-sm">
                  <div class="font-medium text-primary">{{ s.name }}</div>
                  <div class="text-soft">{{ getServerType(s) }}</div>
                  <div class="text-soft text-xs">{{ getCpuCount(s) }}</div>
                  <div class="text-soft text-xs">{{ getRamSize(s) }}</div>
                  <div class="text-soft text-xs">{{ getDiskSize(s) }}</div>
                  <div class="text-soft">{{ getLocationWithFlag(s) }}</div>
                  <div>
                    <span class="inline-flex items-center gap-2">
                      <span class="status-dot" [ngClass]="s.status"></span>
                      <span class="capitalize">{{ s.status }}</span>
                    </span>
                  </div>
                  <div class="text-right text-soft">
                    €{{ getServerPrice(s) }}/mo
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </section>

    <!-- Confirmation Dialogs -->
    
    <!-- Delete All Confirmation -->
    @if (showDeleteAllDialog()) {
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-surface rounded-xl border border-ui p-6 max-w-md w-full">
          <h3 class="text-lg font-semibold text-ink mb-3">Delete All Servers</h3>
          <p class="text-soft mb-6">
            Are you sure you want to delete all {{ myServers().length }} servers? 
            This action cannot be undone.
          </p>
          <div class="flex gap-3 justify-end">
            <button 
              class="px-4 py-2 rounded-lg border border-ui text-soft hover:bg-surface-elev transition-colors"
              (click)="cancelDeleteAll()">
              Cancel
            </button>
            <button 
              class="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
              (click)="confirmDeleteAll()">
              Delete All
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Start All Confirmation -->
    @if (showStartAllDialog()) {
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-surface rounded-xl border border-ui p-6 max-w-md w-full">
          <h3 class="text-lg font-semibold text-ink mb-3">Start All Servers</h3>
          <p class="text-soft mb-6">
            Start all stopped servers? This will start {{ getStoppedServersCount() }} servers.
          </p>
          <div class="flex gap-3 justify-end">
            <button 
              class="px-4 py-2 rounded-lg border border-ui text-soft hover:bg-surface-elev transition-colors"
              (click)="cancelStartAll()">
              Cancel
            </button>
            <button 
              class="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
              (click)="confirmStartAll()">
              Start All
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Stop All Confirmation -->
    @if (showStopAllDialog()) {
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-surface rounded-xl border border-ui p-6 max-w-md w-full">
          <h3 class="text-lg font-semibold text-ink mb-3">Stop All Servers</h3>
          <p class="text-soft mb-6">
            Stop all running servers? This will stop {{ getRunningServersCount() }} servers.
          </p>
          <div class="flex gap-3 justify-end">
            <button 
              class="px-4 py-2 rounded-lg border border-ui text-soft hover:bg-surface-elev transition-colors"
              (click)="cancelStopAll()">
              Cancel
            </button>
            <button 
              class="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white transition-colors"
              (click)="confirmStopAll()">
              Stop All
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrls: ['./my-servers-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyServersPage implements OnInit {
  private api = inject(HetznerApiService);
  private router = inject(Router);

  // UI state
  status = signal<StatusFilter>('all');
  
  // Confirmation dialogs
  showDeleteAllDialog = signal(false);
  showStartAllDialog = signal(false);
  showStopAllDialog = signal(false);
  
  // Sorting state
  sortColumn = signal<string | null>(null);
  sortDirection = signal<SortDirection>('none');

  // API state
  get loading() { return this.api.loading; }
  get error() { return this.api.error; }

  // Use combined servers (real + user-created) with filtering and sorting
  myServers = computed(() => {
    const allServers = this.api.myServers();
    
    // Filter by status
    const statusFilter = this.status();
    const filtered = statusFilter === 'all' 
      ? allServers 
      : allServers.filter(s => s.status === statusFilter);
    
    // Apply sorting
    return this.sortServers(filtered);
  });

  ngOnInit() {
    // Servers are automatically loaded by the service
    // No need to call loadServers() here since service manages loading
  }

  retry(): void {
    // Force reload even in mock mode
    this.api.forceReloadServers();
  }

  navigateToServerSelection(): void {
    this.router.navigate(['/servers']);
  }

  onStatusChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.status.set(select.value as StatusFilter);
  }

  // Sorting handler
  onSort(column: string) {
    const currentColumn = this.sortColumn();
    const currentDirection = this.sortDirection();

    if (currentColumn === column) {
      this.cycleSortDirection();
    } else {
      this.setSortColumn(column, 'asc');
    }
  }

  private cycleSortDirection(): void {
    const current = this.sortDirection();
    switch (current) {
      case 'none':
        this.sortDirection.set('asc');
        break;
      case 'asc':
        this.sortDirection.set('desc');
        break;
      case 'desc':
        this.resetSort();
        break;
    }
  }

  private setSortColumn(column: string, direction: 'asc' | 'desc'): void {
    this.sortColumn.set(column);
    this.sortDirection.set(direction);
  }

  private resetSort(): void {
    this.sortColumn.set(null);
    this.sortDirection.set('none');
  }

  // Get sort value for a server based on column
  private getSortValue(server: any, column: string): any {
    switch (column) {
      case 'name':
        return server.name.toLowerCase();
      case 'type':
        return this.getServerType(server).toLowerCase();
      case 'vcpus':
        return server.server_type?.cores || 0;
      case 'ram':
        return server.server_type?.memory || 0;
      case 'ssd':
        return server.server_type?.disk || 0;
      case 'location':
        return (server.datacenter?.location?.city || server.location || '').toLowerCase();
      case 'status':
        return server.status;
      case 'price':
        return this.api.getServerPrice(server);
      default:
        return '';
    }
  }

  // Sort servers array
  private sortServers(servers: any[]): any[] {
    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (!column || direction === 'none') {
      return servers;
    }

    return [...servers].sort((a, b) => {
      const comparison = this.compareValues(a, b, column);
      return direction === 'asc' ? comparison : -comparison;
    });
  }

  private compareValues(a: any, b: any, column: string): number {
    const aValue = this.getSortValue(a, column);
    const bValue = this.getSortValue(b, column);
    
    if (aValue < bValue) return -1;
    if (aValue > bValue) return 1;
    return 0;
  }

  // Check if up arrow should be visible
  showUpArrow(column: string): boolean {
    return this.sortColumn() !== column || this.sortDirection() !== 'desc';
  }

  // Check if down arrow should be visible
  showDownArrow(column: string): boolean {
    return this.sortColumn() !== column || this.sortDirection() !== 'asc';
  }

  // Check if column is currently being sorted
  isColumnSorted(column: string): boolean {
    return this.sortColumn() === column && this.sortDirection() !== 'none';
  }

  viewServerDetails(server: Server) {
    this.router.navigate(['/my-servers', server.id]);
  }

  // Helper methods for UI state
  hasRunningServers(): boolean {
    return this.myServers().some(server => server.status === 'running');
  }

  hasStoppedServers(): boolean {
    return this.myServers().some(server => server.status === 'stopped');
  }

  // Bulk operations - show confirmation dialogs
  startAllServers(): void {
    if (this.hasStoppedServers()) {
      this.showStartAllDialog.set(true);
    }
  }

  stopAllServers(): void {
    if (this.hasRunningServers()) {
      this.showStopAllDialog.set(true);
    }
  }

  deleteAllServers(): void {
    if (this.myServers().length > 0) {
      this.showDeleteAllDialog.set(true);
    }
  }

  // Confirmation handlers
  confirmStartAll(): void {
    this.executeOnFilteredServers('stopped', server => 
      this.api.updateServerStatus(server.id, 'running')
    );
    this.showStartAllDialog.set(false);
  }

  confirmStopAll(): void {
    this.executeOnFilteredServers('running', server => 
      this.api.updateServerStatus(server.id, 'stopped')
    );
    this.showStopAllDialog.set(false);
  }

  confirmDeleteAll(): void {
    this.executeOnAllServers(server => this.api.deleteServer(server.id));
    this.showDeleteAllDialog.set(false);
  }

  // Cancel handlers
  cancelStartAll(): void {
    this.showStartAllDialog.set(false);
  }

  cancelStopAll(): void {
    this.showStopAllDialog.set(false);
  }

  cancelDeleteAll(): void {
    this.showDeleteAllDialog.set(false);
  }

  private executeOnFilteredServers(status: string, action: (server: any) => void): void {
    const servers = this.myServers().filter(server => server.status === status);
    console.log(`Operating on ${servers.length} ${status} servers`);
    servers.forEach(action);
  }

  private executeOnAllServers(action: (server: any) => void): void {
    const servers = this.myServers();
    console.log(`Operating on ${servers.length} servers`);
    servers.forEach(action);
  }

  // Helper methods for counts
  getRunningServersCount(): number {
    return this.myServers().filter(server => server.status === 'running').length;
  }

  getStoppedServersCount(): number {
    return this.myServers().filter(server => server.status === 'stopped').length;
  }

  // Get the monthly price for a server
  getServerPrice(server: Server): string {
    return this.api.getServerPriceFormatted(server);
  }

  // Get server type display name
  getServerType(server: Server): string {
    return server.server_type?.name || server.type || 'Unknown';
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

  // Location helpers
  getLocationWithFlag(server: Server): string {
    const city: string = server.datacenter?.location?.city || server.datacenter?.location?.name || server.location || 'Unknown';
    if (server.datacenter?.location?.country) {
      const flag = this.api.getCountryFlag(server.datacenter.location.country);
      return `${flag} ${city}`;
    }
    return city;
  }
}