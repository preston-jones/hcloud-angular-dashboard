import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HetznerApiService } from '../../../core/hetzner-api.service';
import { Server } from '../../../core/models';
import { SelectionActionsComponent, SelectionAction } from '../../../shared/ui/selection-actions/selection-actions';
import { ServerSelectionService, ServerDisplayService, ServerSortingService } from '../../../shared/services';
import { ServerStatusDotComponent } from '../../../shared/ui/server-status-dot';
import { ServerSpecsDisplayComponent } from '../../../shared/ui/server-specs-display';
import { ServerProtectionToggleComponent } from '../../../shared/ui/server-protection-toggle';

@Component({
  selector: 'app-my-servers-page',
  standalone: true,
  imports: [
    SelectionActionsComponent, 
    ServerStatusDotComponent, 
    ServerSpecsDisplayComponent, 
    ServerProtectionToggleComponent
  ],
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
              <div class="flex items-center text-left">
                <span>Name</span>
              </div>
              <div class="flex items-center text-left">
                <span>Public IP</span>
              </div>
              <div class="flex items-center text-left">
                <span>Location</span>
              </div>
              <button 
                class="sortable-header text-left flex items-center"
                [class.sorted]="sortingService.isColumnSorted('created')"
                (click)="sortingService.onSort('created')"
                [attr.aria-label]="'Sort by created date ' + (sortingService.sortColumn() === 'created' ? sortingService.sortDirection() : 'none')"
                type="button">
                <span>Created</span>
                <span class="sort-arrow" aria-hidden="true">
                  <span class="sort-arrow-up" [style.display]="sortingService.showUpArrow('created') ? 'block' : 'none'">▲</span>
                  <span class="sort-arrow-down" [style.display]="sortingService.showDownArrow('created') ? 'block' : 'none'">▼</span>
                </span>
              </button>
              <div class="flex items-center justify-center">
              </div>
            </div>
          </div>

          <!-- Table Rows as Cards -->
          <div class="space-y-2">
            @for (s of myServers(); track s.id) {
              <div 
                class="server-card cursor-pointer"
                [style.background]="isServerSelected(s.id.toString()) ? 'color-mix(in oklab, var(--primary) 8%, var(--surface-elev))' : ''"
                (click)="viewServerDetails(s)">
                <div class="grid grid-cols-[auto_3fr_1fr_1fr_1fr_auto] gap-4 items-center text-sm">
                  <div class="flex items-center" (click)="$event.stopPropagation()">
                    <input 
                      type="checkbox" 
                      class="rounded border border-ui"
                      [checked]="isServerSelected(s.id.toString())"
                      (change)="toggleServerSelection(s.id.toString())"
                      [attr.aria-label]="'Select ' + s.name">
                  </div>
                  <div class="flex items-center gap-2">
                    <!-- Status dot -->
                    <app-server-status-dot [status]="s.status"></app-server-status-dot>
                    <app-server-specs-display [server]="s"></app-server-specs-display>
                  </div>
                  <div class="text-soft">{{ getPublicIP(s) }}</div>
                  <div class="text-soft">{{ getLocationWithFlag(s) }}</div>
                  <div class="text-soft text-xs">{{ getCreatedTimeAgo(s) }}</div>
                  <!-- Protection icon -->
                  <div class="flex items-center justify-center">
                    <app-server-protection-toggle 
                      [server]="s" 
                      (toggle)="onProtectionToggle($event)">
                    </app-server-protection-toggle>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </section>

    <!-- Shared Selection Actions Component -->
    <app-selection-actions 
      [selectedCount]="selectedCount()" 
      [actions]="selectionActions()">
    </app-selection-actions>

  `,
  styleUrls: ['./my-servers-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyServersPage implements OnInit {
  private api = inject(HetznerApiService);
  private router = inject(Router);
  
  // Inject the new services (public for template access)
  selectionService = inject(ServerSelectionService);
  displayService = inject(ServerDisplayService);
  sortingService = inject(ServerSortingService);

  // Use selection service
  selectedCount = this.selectionService.selectedCount;
  
  // Selection actions for the shared component
  selectionActions = computed<SelectionAction[]>(() => [
    {
      id: 'power-on',
      label: 'Power On',
      icon: '▶',
      disabled: !this.selectionService.hasSelectedStoppedServers(this.myServers()),
      hoverClass: 'hover:bg-green-50 dark:hover:bg-green-900/20',
      action: () => this.startSelectedServers()
    },
    {
      id: 'power-off',
      label: 'Power Off',
      icon: '⏸',
      disabled: !this.selectionService.hasSelectedRunningServers(this.myServers()),
      hoverClass: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
      action: () => this.stopSelectedServers()
    },
    {
      id: 'activate-protection',
      label: 'Activate Protection',
      icon: '🛡',
      hoverClass: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
      action: () => this.activateProtectionSelectedServers()
    },
    {
      id: 'deactivate-protection',
      label: 'Deactivate Protection',
      icon: '🔒',
      hoverClass: 'hover:bg-orange-50 dark:hover:bg-orange-900/20',
      action: () => this.deactivateProtectionSelectedServers()
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: '🗑',
      hoverClass: 'hover:bg-red-50 dark:hover:bg-red-900/20',
      action: () => this.deleteSelectedServers()
    }
  ]);

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
    
    // Apply sorting using the sorting service
    return this.sortingService.sortServers(filteredServers);
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

  // Selection methods - delegate to selection service
  isServerSelected(serverId: string): boolean {
    return this.selectionService.isServerSelected(serverId);
  }

  toggleServerSelection(serverId: string): void {
    this.selectionService.toggleServerSelection(serverId);
  }

  isAllSelected(): boolean {
    return this.selectionService.isAllSelected(this.myServers());
  }

  toggleSelectAll(): void {
    this.selectionService.toggleSelectAll(this.myServers());
  }

  // Clear selection
  clearSelection(): void {
    this.selectionService.clearSelection();
  }

  // Helper methods for selected servers
  getSelectedServers() {
    return this.selectionService.getSelectedServers(this.myServers());
  }

  hasSelectedRunningServers(): boolean {
    return this.selectionService.hasSelectedRunningServers(this.myServers());
  }

  hasSelectedStoppedServers(): boolean {
    return this.selectionService.hasSelectedStoppedServers(this.myServers());
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
    
    // Get servers that can actually be deleted (not protected)
    const deletableServers = selectedServers.filter(server => !server.protection?.delete);
    
    // Delete only the non-protected servers
    deletableServers.forEach(server => this.api.deleteServer(server.id));
    
    // Only uncheck the servers that were actually deleted
    if (deletableServers.length > 0) {
      const deletedServerIds = deletableServers.map(server => server.id.toString());
      this.selectionService.removeServersFromSelection(deletedServerIds);
    }
  }

  // Protection operations on selected servers
  activateProtectionSelectedServers(): void {
    const selectedServers = this.getSelectedServers();
    selectedServers.forEach(server => {
      this.api.updateServerProtection(server.id, true);
    });
  }

  deactivateProtectionSelectedServers(): void {
    const selectedServers = this.getSelectedServers();
    selectedServers.forEach(server => {
      this.api.updateServerProtection(server.id, false);
    });
  }

  // Toggle protection for individual server (updated for new component)
  onProtectionToggle(event: { serverId: number; event: Event }): void {
    this.toggleServerProtection(event.serverId, event.event);
  }

  // Toggle protection for individual server
  toggleServerProtection(serverId: number, event: Event): void {
    event.stopPropagation(); // Prevent triggering the row click
    
    const server = this.myServers().find(s => s.id === serverId);
    if (server) {
      const isCurrentlyProtected = server.protection?.delete || false;
      this.api.updateServerProtection(serverId, !isCurrentlyProtected);
    }
  }

  viewServerDetails(server: Server) {
    this.router.navigate(['/my-servers', server.id]);
  }

  // Display methods - delegate to display service
  getServerPrice(server: Server): string {
    return this.displayService.getServerPrice(server);
  }

  getServerType(server: Server): string {
    return this.displayService.getServerType(server);
  }

  getCpuCount(server: Server): string {
    return this.displayService.getCpuCount(server);
  }

  getRamSize(server: Server): string {
    return this.displayService.getRamSize(server);
  }

  getDiskSize(server: Server): string {
    return this.displayService.getDiskSize(server);
  }

  getArchitecture(server: Server): string {
    return this.displayService.getArchitecture(server);
  }

  getNetworkZone(server: Server): string {
    return this.displayService.getNetworkZone(server);
  }

  getPublicIP(server: Server): string {
    return this.displayService.getPublicIP(server);
  }

  getCreatedTimeAgo(server: Server): string {
    return this.displayService.getCreatedTimeAgo(server);
  }

  getLocationWithFlag(server: Server): string {
    return this.displayService.getLocationWithFlag(server);
  }
}