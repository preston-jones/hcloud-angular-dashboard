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
  private api = inject(HetznerApiService);

  // Local state
  serverId = signal<string | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // Computed server based on ID from route
  server = computed(() => {
    const id = this.serverId();
    const servers = this.api.servers();
    if (!id || !servers) return null;
    return servers.find(s => s.id === id) || null;
  });

  ngOnInit() {
    // Get server ID from route params
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('No server ID provided');
      this.loading.set(false);
      return;
    }

    this.serverId.set(id);
    
    // Servers are automatically loaded by the service
    // No need to check and load here

    // Wait for servers to load or use existing data
    this.loading.set(false);
  }

  // Navigation
  goBack() {
    this.router.navigate(['/servers']);
  }

  // Server helper methods
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

  getCleanCityName(server: Server): string {
    const fullCity = server.datacenter?.location?.city || server.location;
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
}