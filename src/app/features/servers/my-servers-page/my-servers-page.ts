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
    <section class="space-y-12">
      <!-- Toolbar -->
      <header class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-8">
        <h1 class="text-xl font-semibold text-ink">Server</h1>

        <div class="flex flex-wrap gap-2 items-center">
          <button 
            class="px-4 py-2 rounded-lg text-white bg-primary hover:bg-primary-700 transition-colors w-32 min-w-32"
            (click)="navigateToServerSelection()">
            Create Server
          </button>
        </div>
      </header>

      <!-- SKELETON (Table with card rows) -->
      @if (loading()) {
        <div class="hidden md:block space-y-4">
          <!-- Skeleton Header -->
          <div class="bg-[color-mix(in_oklab,_var(--surface)_92%,_black)] rounded-lg border border-ui/30 px-4 py-3">
            <div class="grid grid-cols-[auto_3fr_1fr_1fr_1fr_auto] gap-4">
              <div class="skeleton h-4 w-4"></div>
              <div class="skeleton h-4 w-12"></div>
              <div class="skeleton h-4 w-20"></div>
              <div class="skeleton h-4 w-16"></div>
              <div class="skeleton h-4 w-16"></div>
              <div class="skeleton h-4 w-4"></div>
            </div>
          </div>

          <!-- Skeleton Rows -->
          <div class="space-y-3">
            @for (_ of [1,2,3,4,5]; track $index) {
              <div class="server-card">
                <div class="grid grid-cols-[auto_3fr_1fr_1fr_1fr_auto] gap-4 items-center">
                  <div class="skeleton h-4 w-4"></div>
                  <div class="flex items-center gap-2">
                    <div class="skeleton h-3 w-3 rounded-full flex-shrink-0"></div>
                    <div class="space-y-2">
                      <div class="skeleton h-5 w-32"></div>
                      <div class="skeleton h-4 w-48"></div>
                    </div>
                  </div>
                  <div class="skeleton h-5 w-24"></div>
                  <div class="skeleton h-5 w-20"></div>
                  <div class="skeleton h-5 w-16"></div>
                  <div class="skeleton h-4 w-4"></div>
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
        <div class="space-y-2">
          <!-- Table Header -->
          <div class="px-4 py-2">
            <div class="grid grid-cols-[auto_3fr_1fr_1fr_1fr_auto] gap-4 text-sm text-soft font-bold">
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  class="rounded border border-ui"
                  [checked]="isAllSelected()"
                  (change)="toggleSelectAll()"
                  aria-label="Select all servers">
              </div>
              <div class="text-left">
                <span>Name</span>
              </div>
              <div class="text-left">
                <span>Public IP</span>
              </div>
              <div class="text-left">
                <span>Location</span>
              </div>
              <button 
                class="sortable-header text-left"
                [class.sorted]="isColumnSorted('created')"
                (click)="onSort('created')"
                [attr.aria-label]="'Sort by created date ' + (sortColumn() === 'created' ? sortDirection() : 'none')"
                type="button">
                <span>Created</span>
                <span class="sort-arrow" aria-hidden="true">
                  <span class="sort-arrow-up" [style.display]="showUpArrow('created') ? 'block' : 'none'">▲</span>
                  <span class="sort-arrow-down" [style.display]="showDownArrow('created') ? 'block' : 'none'">▼</span>
                </span>
              </button>
              <div class="text-center">
                <span>🛡</span>
              </div>
            </div>
          </div>

          <!-- Table Rows as Cards -->
          <div class="space-y-2">
            @for (s of myServers(); track s.id) {
              <div 
                class="server-card cursor-pointer"
                [style.background]="isServerSelected(s.id) ? 'color-mix(in oklab, var(--primary) 8%, var(--surface-elev))' : ''"
                (click)="viewServerDetails(s)">
                <div class="grid grid-cols-[auto_3fr_1fr_1fr_1fr_auto] gap-4 items-center text-sm">
                  <div class="flex items-center" (click)="$event.stopPropagation()">
                    <input 
                      type="checkbox" 
                      class="rounded border border-ui"
                      [checked]="isServerSelected(s.id)"
                      (change)="toggleServerSelection(s.id)"
                      [attr.aria-label]="'Select ' + s.name">
                  </div>
                  <div class="flex items-center gap-2">
                    <!-- Status dot -->
                    <span class="status-dot flex-shrink-0" [ngClass]="s.status"></span>
                    <div class="space-y-1">
                      <!-- Server name -->
                      <div class="font-medium text-primary">
                        {{ s.name }}
                      </div>
                      <!-- Server specs line -->
                      <div class="text-soft text-xs">
                        {{ getServerType(s) }} | {{ getArchitecture(s) }} | {{ getDiskSize(s) }} | {{ getNetworkZone(s) }}
                      </div>
                    </div>
                  </div>
                  <div class="text-soft">{{ getPublicIP(s) }}</div>
                  <div class="text-soft">{{ getLocationWithFlag(s) }}</div>
                  <div class="text-soft text-xs">{{ getCreatedTimeAgo(s) }}</div>
                  <!-- Protection icon -->
                  <div class="flex items-center justify-center">
                    <button 
                      class="text-sm hover:scale-110 transition-transform p-1"
                      [class.text-blue-600]="s.protection?.delete"
                      [class.text-gray-400]="!s.protection?.delete"
                      (click)="toggleServerProtection(s.id, $event)"
                      [attr.aria-label]="s.protection?.delete ? 'Remove protection from ' + s.name : 'Protect ' + s.name"
                      type="button">
                      {{ s.protection?.delete ? '🛡' : '🔓' }}
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </section>

    <!-- Selection Actions Container -->
    <div class="selection-container" 
         [class.active]="selectedCount() > 0"
         [style.transform]="selectedCount() > 0 ? 'translateY(0)' : 'translateY(100%)'">
      <div class="selection-content">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-sm font-medium text-ink">
              {{ selectedCount() }} selected
            </span>
          </div>
          
          <div class="flex items-center gap-2">
            <button 
              class="flex flex-col items-center gap-1 px-3 py-2 text-xs hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors rounded-md"
              (click)="startSelectedServers()"
              [disabled]="!hasSelectedStoppedServers()"
              [class.opacity-50]="!hasSelectedStoppedServers()">
              <span class="text-sm">▶</span>
              <span>Power On</span>
            </button>
            
            <button 
              class="flex flex-col items-center gap-1 px-3 py-2 text-xs hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors rounded-md"
              (click)="stopSelectedServers()"
              [disabled]="!hasSelectedRunningServers()"
              [class.opacity-50]="!hasSelectedRunningServers()">
              <span class="text-sm">⏸</span>
              <span>Power Off</span>
            </button>
            
            <button 
              class="flex flex-col items-center gap-1 px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors rounded-md"
              (click)="activateProtectionSelectedServers()">
              <span class="text-sm">🛡</span>
              <span>Activate Protection</span>
            </button>
            
            <button 
              class="flex flex-col items-center gap-1 px-3 py-2 text-xs hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors rounded-md"
              (click)="deactivateProtectionSelectedServers()">
              <span class="text-sm">🔒</span>
              <span>Deactivate Protection</span>
            </button>
            
            <button 
              class="flex flex-col items-center gap-1 px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-md"
              (click)="deleteSelectedServers()">
              <span class="text-sm">🗑</span>
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>

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

  // UI state (removed status signal - no longer needed)
  selectedServerIds = signal<Set<string>>(new Set());
  
  // Computed for selection count
  selectedCount = computed(() => this.selectedServerIds().size);
  
  // Confirmation dialogs
  showDeleteAllDialog = signal(false);
  showStartAllDialog = signal(false);
  showStopAllDialog = signal(false);
  
  // Sorting state
  sortColumn = signal<string | null>('created');
  sortDirection = signal<SortDirection>('desc');

  // API state
  get loading() { return this.api.loading; }
  get error() { return this.api.error; }

  // Use combined servers (real + user-created) with filtering and sorting
  myServers = computed(() => {
    const allServers = this.api.myServers();
    const searchTerm = this.api.searchQuery().toLowerCase();
    
    // Apply search filtering by server name only (like create server page)
    let filteredServers = allServers;
    if (searchTerm) {
      filteredServers = allServers.filter(server => 
        server.name?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply sorting
    return this.sortServers(filteredServers);
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

  // Selection methods
  isServerSelected(serverId: string): boolean {
    return this.selectedServerIds().has(serverId);
  }

  toggleServerSelection(serverId: string): void {
    const selected = new Set(this.selectedServerIds());
    if (selected.has(serverId)) {
      selected.delete(serverId);
    } else {
      selected.add(serverId);
    }
    this.selectedServerIds.set(selected);
  }

  isAllSelected(): boolean {
    const serverIds = this.myServers().map(s => s.id);
    return serverIds.length > 0 && serverIds.every(id => this.selectedServerIds().has(id));
  }

  isPartiallySelected(): boolean {
    const serverIds = this.myServers().map(s => s.id);
    const selectedCount = serverIds.filter(id => this.selectedServerIds().has(id)).length;
    return selectedCount > 0 && selectedCount < serverIds.length;
  }

  toggleSelectAll(): void {
    const serverIds = this.myServers().map(s => s.id);
    if (this.isAllSelected()) {
      this.selectedServerIds.set(new Set());
    } else {
      this.selectedServerIds.set(new Set(serverIds));
    }
  }

  // Clear selection
  clearSelection(): void {
    this.selectedServerIds.set(new Set());
  }

  // Helper methods for selected servers
  getSelectedServers() {
    return this.myServers().filter(server => this.selectedServerIds().has(server.id));
  }

  hasSelectedRunningServers(): boolean {
    return this.getSelectedServers().some(server => server.status === 'running');
  }

  hasSelectedStoppedServers(): boolean {
    return this.getSelectedServers().some(server => server.status === 'stopped');
  }

  // Bulk operations on selected servers
  startSelectedServers(): void {
    const selectedServers = this.getSelectedServers().filter(server => server.status === 'stopped');
    selectedServers.forEach(server => this.api.updateServerStatus(server.id, 'running'));
  }

  stopSelectedServers(): void {
    const selectedServers = this.getSelectedServers().filter(server => server.status === 'running');
    selectedServers.forEach(server => this.api.updateServerStatus(server.id, 'stopped'));
  }

  deleteSelectedServers(): void {
    const selectedServers = this.getSelectedServers();
    selectedServers.forEach(server => this.api.deleteServer(server.id));
    this.clearSelection();
  }

  // Protection operations on selected servers
  activateProtectionSelectedServers(): void {
    const selectedServers = this.getSelectedServers();
    console.log(`Activating protection for ${selectedServers.length} servers`);
    selectedServers.forEach(server => {
      this.api.updateServerProtection(server.id, true);
      console.log(`Activated protection for server: ${server.name}`);
    });
  }

  deactivateProtectionSelectedServers(): void {
    const selectedServers = this.getSelectedServers();
    console.log(`Deactivating protection for ${selectedServers.length} servers`);
    selectedServers.forEach(server => {
      this.api.updateServerProtection(server.id, false);
      console.log(`Deactivated protection for server: ${server.name}`);
    });
  }

  // Toggle protection for individual server
  toggleServerProtection(serverId: number, event: Event): void {
    event.stopPropagation(); // Prevent triggering the row click
    
    const server = this.myServers().find(s => s.id === serverId);
    if (server) {
      const isCurrentlyProtected = server.protection?.delete || false;
      this.api.updateServerProtection(serverId, !isCurrentlyProtected);
      console.log(`${!isCurrentlyProtected ? 'Activated' : 'Deactivated'} protection for server: ${server.name}`);
    }
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
      case 'created':
        return server.created ? new Date(server.created).getTime() : 0;
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

  // Get server architecture
  getArchitecture(server: Server): string {
    return server.server_type?.architecture || server.architecture || 'x86';
  }

  // Get network zone
  getNetworkZone(server: Server): string {
    return server.datacenter?.location?.network_zone || 'unknown';
  }

  // Get public IP address
  getPublicIP(server: Server): string {
    return server.public_net?.ipv4?.ip || 'No IP';
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
    const city: string = server.datacenter?.location?.city || server.datacenter?.location?.name || server.location || 'Unknown';
    if (server.datacenter?.location?.country) {
      const flag = this.api.getCountryFlag(server.datacenter.location.country);
      return `${flag} ${city}`;
    }
    return city;
  }
}