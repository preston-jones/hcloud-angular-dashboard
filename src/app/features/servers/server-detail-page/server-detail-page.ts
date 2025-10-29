import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { HetznerApiService, Server } from '../../../core/hetzner-api.service';

@Component({
  selector: 'app-server-detail-page',
  standalone: true,
  imports: [NgClass],
  templateUrl: './server-detail-page.html',
  styleUrls: ['./server-detail-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public api = inject(HetznerApiService);

  // Local state
  serverId = signal<number | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // Computed server based on ID from route - only show actual user servers
  server = computed(() => {
    const id = this.serverId();
    const userServers = this.api.myServers(); // Only check user servers, not available types
    if (!id || !userServers) return null;
    return userServers.find(s => s.id === id) || null;
  });

  ngOnInit() {
    // Get server ID from route params
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.error.set('No server ID provided');
      this.loading.set(false);
      return;
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      this.error.set('Invalid server ID');
      this.loading.set(false);
      return;
    }

    this.serverId.set(id);
    this.loading.set(false);
  }

  // Navigation
  goBack() {
    // Always go back to my-servers since this page is only for user servers
    this.router.navigate(['/my-servers']);
  }

  // Server helper methods
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

  getCleanCityName(server: Server): string {
    const fullCity = server.datacenter?.location?.city || server.datacenter?.location?.name || 'Unknown';
    return fullCity.replace(/,\s*[A-Z]{2}$/, '');
  }

  // Hardware specs helpers
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

  // Get pricing information for the server's location
  getServerPricing(server: Server): any {
    if (!server.server_type?.prices) return null;
    // Find pricing for the server's location
    const serverLocation = server.datacenter?.location?.name;
    return server.server_type.prices.find(p => p.location.toLowerCase() === serverLocation?.toLowerCase());
  }

  // Format price values to show clean decimals with € at the end
  formatPrice(priceString: string | undefined): string {
    if (!priceString) return '0 €';
    const price = parseFloat(priceString);
    return `${price.toFixed(2)} €`;
  }

  formatHourlyPrice(priceString: string | undefined): string {
    if (!priceString) return '0 €';
    const price = parseFloat(priceString);
    return `${price.toFixed(2)} €`;
  }

  // Server actions
  startServer(): void {
    const server = this.server();
    if (server && server.status !== 'running') {
      this.api.updateServerStatus(server.id, 'running');
    }
  }

  stopServer(): void {
    const server = this.server();
    if (server && server.status !== 'stopped') {
      this.api.updateServerStatus(server.id, 'stopped');
    }
  }

  deleteServer(): void {
    const server = this.server();
    if (server) {
      if (confirm(`Are you sure you want to delete server "${server.name}"? This action cannot be undone.`)) {
        this.api.deleteServer(server.id);
        this.goBack(); // Navigate back after deletion
      }
    }
  }

  // Format created date
  formatDate(dateString?: string): string {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  }

  getRelativeTime(date: string): string {
    const now = new Date();
    const createdDate = new Date(date);
    const diffMs = now.getTime() - createdDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  }

  togglePower(): void {
    const currentServer = this.server();
    if (!currentServer) return;

    if (currentServer.status === 'running') {
      this.stopServer();
    } else {
      this.startServer();
    }
  }
}