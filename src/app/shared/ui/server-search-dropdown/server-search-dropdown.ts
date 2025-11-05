import { ChangeDetectionStrategy, Component, computed, inject, input, output, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HetznerApiService } from '../../../core/hetzner-api.service';
import { Server } from '../../../core/models';

@Component({
  selector: 'app-server-search-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (query() && filteredServers().length > 0) {
      <div class="dropdown-content bg-white dark:bg-slate-800 border border-ui rounded-lg shadow-lg max-h-96 overflow-y-auto">
        <div class="p-2">
          <div class="text-xs text-soft mb-2 px-2">{{ filteredServers().length }} server(s) found</div>
          @for (server of filteredServers(); track server.id) {
            <div 
              class="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
              (click)="selectServer(server)">
              <!-- Status dot -->
              <span class="w-2 h-2 rounded-full" 
                    [class]="getStatusColor(server.status)"></span>
              
              <!-- Server info -->
              <div class="flex-1 min-w-0">
                <div class="font-medium text-ink truncate">{{ server.name }}</div>
                <div class="text-sm text-soft">
                  {{ server.server_type.name || 'Unknown' }} • {{ getLocation(server) }}
                </div>
              </div>
              
              <!-- Price -->
              <div class="text-sm text-soft">
                €{{ getServerPrice(server) }}
              </div>
            </div>
          }
        </div>
      </div>
    }
    @if (query() && filteredServers().length === 0 && query().length > 0) {
      <div class="dropdown-content bg-white dark:bg-slate-800 border border-ui rounded-lg shadow-lg">
        <div class="p-4 text-center text-soft">
          <div class="text-2xl mb-2">🔍</div>
          <div class="text-sm">No servers found for "{{ query() }}"</div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      position: fixed;
      z-index: 50000;
      pointer-events: none;
    }
    
    .dropdown-content {
      pointer-events: auto;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerSearchDropdownComponent {
  private api = inject(HetznerApiService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  query = input<string>('');
  serverSelected = output<void>();

  constructor() {
    // Update position when query changes
    effect(() => {
      if (this.query()) {
        this.updatePosition();
      }
    });
  }

  // Filter servers by name in real-time
  filteredServers = computed(() => {
    const searchQuery = this.query().toLowerCase().trim();
    if (!searchQuery) return [];
    
    return this.api.myServers()
      .filter(server => 
        server.name.toLowerCase().includes(searchQuery)
      )
      .slice(0, 8); // Limit to 8 results
  });

  selectServer(server: Server) {
    // Navigate to server detail page
    this.router.navigate(['/my-servers', server.id]);
    this.serverSelected.emit();
  }

  private updatePosition() {
    // Find the search input element in the topbar
    const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
    if (searchInput && this.elementRef.nativeElement) {
      const rect = searchInput.getBoundingClientRect();
      const dropdown = this.elementRef.nativeElement;
      
      // Position the dropdown directly under the search input
      dropdown.style.position = 'fixed';
      dropdown.style.top = `${rect.bottom + 8}px`;
      dropdown.style.left = `${rect.left}px`;
      dropdown.style.width = `${rect.width}px`;
      dropdown.style.zIndex = '10000';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'stopped': return 'bg-red-500';
      case 'starting': return 'bg-yellow-500';
      case 'stopping': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  }

  getLocation(server: Server): string {
    return server.datacenter?.location?.city || server.location || 'Unknown';
  }

  getServerPrice(server: Server): string {
    return this.api.getServerPriceFormatted(server);
  }
}