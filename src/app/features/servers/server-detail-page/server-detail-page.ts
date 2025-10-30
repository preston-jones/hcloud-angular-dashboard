import { ChangeDetectionStrategy, Component, computed, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { HetznerApiService, Server } from '../../../core/hetzner-api.service';
import { DeleteConfirmationDialogComponent } from '../../../shared/ui/delete-confirmation-dialog/delete-confirmation-dialog';

@Component({
  selector: 'app-server-detail-page',
  standalone: true,
  imports: [NgClass, DeleteConfirmationDialogComponent],
  templateUrl: './server-detail-page.html',
  styleUrls: ['./server-detail-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerDetailPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public api = inject(HetznerApiService);

  // Local state
  serverId = signal<number | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  showActionsDropdown = signal(false);
  showDeleteDialog = signal(false);
  
  // Feature states
  backupEnabled = signal(false);
  backupActivity = signal<{ message: string; time: Date } | null>(null);
  
  // Timer state
  serverStartTime = signal<Date | null>(null);
  currentTime = signal<Date>(new Date());
  private timerInterval: any = null;

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
    
    // Initialize timer if server is running
    this.initializeTimer();
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  // Timer management
  private initializeTimer() {
    const currentServer = this.server();
    if (currentServer?.status === 'running') {
      this.serverStartTime.set(new Date());
      this.startTimer();
    }
  }

  private startTimer() {
    this.clearTimer();
    this.timerInterval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
  }

  private clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private resetTimer() {
    this.serverStartTime.set(new Date());
    this.currentTime.set(new Date());
  }

  // Get elapsed time since server started
  getElapsedTime(): string {
    const startTime = this.serverStartTime();
    const current = this.currentTime();
    
    if (!startTime) return 'Recently';
    
    const diffMs = current.getTime() - startTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    
    if (diffHours > 0) {
      const remainingMinutes = diffMinutes % 60;
      if (remainingMinutes > 0) {
        return `${diffHours}h ${remainingMinutes}m ago`;
      } else {
        return `${diffHours}h ago`;
      }
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just started';
    }
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
  // Hardware specs helpers (delegate to service)
  getCpuCount(server: Server): string {
    return this.api.getCpuCount(server);
  }

  getRamSize(server: Server): string {
    return this.api.getRamSize(server);
  }

  getDiskSize(server: Server): string {
    return this.api.getDiskSize(server);
  }

  getHardwareSpecs(server: Server): string {
    return `${this.getCpuCount(server)} vCPU • ${this.getRamSize(server)} • ${this.getDiskSize(server)} SSD`;
  }

  // IP address helpers
  getIPv4(server: Server): string | null {
    return server.public_net?.ipv4?.ip || null;
  }

  getIPv6(server: Server): string | null {
    return server.public_net?.ipv6?.ip || null;
  }

  hasPublicIPs(server: Server): boolean {
    return !!(server.public_net?.ipv4?.ip || server.public_net?.ipv6?.ip);
  }

  // Get pricing information for the server's location
  getServerPricing(server: Server): any {
    if (!server.server_type?.prices) return null;
    // Find pricing for the server's location
    const serverLocation = server.datacenter?.location?.name;
    return server.server_type.prices.find(p => p.location.toLowerCase() === serverLocation?.toLowerCase());
  }

  // Get the monthly price for the server (delegate to service)
  getServerPrice(server: Server): number {
    return this.api.getServerPrice(server);
  }

  // Get the included traffic for the server in TB
  getIncludedTraffic(server: Server): string {
    const pricing = this.getServerPricing(server);
    if (pricing?.included_traffic) {
      // Convert bytes to TB (1 TB = 1,000,000,000,000 bytes)
      const trafficTB = pricing.included_traffic / 1000000000000;
      return Math.round(trafficTB).toString();
    }
    return '0';
  }

  // Get traffic display string
  getTrafficDisplay(server: Server): string {
    const outgoingGB = server.outgoing_traffic ? (server.outgoing_traffic / 1024 / 1024 / 1024).toFixed(1) : '0';
    const includedTB = this.getIncludedTraffic(server);
    return `${outgoingGB} GB / ${includedTB} TB`;
  }

  // Get incoming traffic display - works with both mock and real API data
  getIncomingTrafficDisplay(server: Server): string {
    const ingoing = this.api.getServerIncomingTraffic(server);
    return ingoing ? this.api.formatBytes(ingoing) : '0 B';
  }

  // Get outgoing traffic display - works with both mock and real API data
  getOutgoingTrafficDisplay(server: Server): string {
    const outgoing = this.api.getServerOutgoingTraffic(server);
    return outgoing ? this.api.formatBytes(outgoing) : '0 B';
  }

  // Format bytes to human readable (delegate to service)
  formatBytes(bytes: number): string {
    return this.api.formatBytes(bytes);
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
      this.resetTimer();
      this.startTimer();
    }
  }

  stopServer(): void {
    const server = this.server();
    if (server && server.status !== 'stopped') {
      this.api.updateServerStatus(server.id, 'stopped');
      this.clearTimer();
      this.serverStartTime.set(null);
    }
  }

  deleteServer(): void {
    const server = this.server();
    if (server) {
      this.showDeleteDialog.set(true);
    }
  }

  // Handle delete confirmation
  confirmDelete(): void {
    const server = this.server();
    if (server) {
      this.api.deleteServer(server.id);
      this.showDeleteDialog.set(false);
      this.goBack(); // Navigate back after deletion
    }
  }

  // Handle delete cancellation
  cancelDelete(): void {
    this.showDeleteDialog.set(false);
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
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours > 0) {
      const remainingMinutes = diffMinutes % 60;
      if (remainingMinutes > 0) {
        return `${diffHours}h ${remainingMinutes}m ago`;
      } else {
        return `${diffHours}h ago`;
      }
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just created';
    }
  }

  /** Calculate current usage cost based on server uptime */
  calculateCurrentUsage(server: Server): string {
    if (!server.created) return '0.00';
    
    // Get the hourly price from the pricing data
    const monthlyPrice = this.api.getServerPrice(server);
    const hourlyPrice = monthlyPrice / (30 * 24); // Convert monthly to hourly (approximation)
    
    // Calculate hours since creation
    const now = new Date();
    const createdDate = new Date(server.created);
    const diffMs = now.getTime() - createdDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Calculate usage cost
    const usageCost = hourlyPrice * diffHours;
    
    return Math.max(0.01, usageCost).toFixed(2); // Minimum 0.01 to match console behavior
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

  // Dropdown methods
  toggleActionsDropdown(): void {
    this.showActionsDropdown.set(!this.showActionsDropdown());
  }

  closeActionsDropdown(): void {
    this.showActionsDropdown.set(false);
  }

  // Server actions from dropdown
  turnOffServer(): void {
    const server = this.server();
    if (server && server.status === 'running') {
      this.stopServer();
    }
    this.closeActionsDropdown();
  }

  shutDownServer(): void {
    const server = this.server();
    if (server && server.status === 'running') {
      this.stopServer();
    }
    this.closeActionsDropdown();
  }

  deleteServerFromDropdown(): void {
    this.closeActionsDropdown();
    this.deleteServer();
  }

  // Backup management
  toggleBackup(): void {
    const currentState = this.backupEnabled();
    this.backupEnabled.set(!currentState);
    
    const message = !currentState 
      ? 'Backup enabled'
      : 'Backup disabled';
    
    this.backupActivity.set({
      message: message,
      time: new Date()
    });
  }

  // Get backup activity time display
  getBackupActivityTime(): string {
    const activity = this.backupActivity();
    if (!activity) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - activity.time.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    
    if (diffHours > 0) {
      const remainingMinutes = diffMinutes % 60;
      if (remainingMinutes > 0) {
        return `${diffHours}h ${remainingMinutes}m ago`;
      } else {
        return `${diffHours}h ago`;
      }
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  }
}