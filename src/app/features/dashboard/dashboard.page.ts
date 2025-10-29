import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { HetznerApiService, Server } from '../../core/hetzner-api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  private api = inject(HetznerApiService);
  private router = inject(Router);

  // API state
  get loading() { return this.api.loading; }
  get servers() { return this.api.servers; }
  get error() { return this.api.error; }
  get isUsingMockData() { return this.api.isUsingMockData(); }

  ngOnInit() {
    // Servers are automatically loaded by the service
  }

  retry(): void {
    this.api.forceReloadServers();
  }

  // Use the service's myServers computed property (non-available servers)
  myServers = computed(() => {
    return this.api.myServers();
  });

  // Calculate totals
  totalCosts = computed(() => {
    const servers = this.myServers();
    return servers.reduce((total, server) => total + (server.priceEur || 0), 0);
  });

  totalVCpus = computed(() => {
    const servers = this.myServers();
    return servers.reduce((total, server) => total + (server.server_type?.cores || 0), 0);
  });

  totalMemory = computed(() => {
    const servers = this.myServers();
    return servers.reduce((total, server) => total + (server.server_type?.memory || 0), 0);
  });

  // Navigation
  viewServerDetails(server: Server) {
    this.router.navigate(['/servers', server.id]);
  }

  goToMyServers() {
    this.router.navigate(['/my-servers']);
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

  // Skeleton rows
  skeletonRows = Array.from({ length: 3 });
}