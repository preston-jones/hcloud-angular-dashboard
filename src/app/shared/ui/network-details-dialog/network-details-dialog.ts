import { Component, signal, output, input, ChangeDetectionStrategy, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { Server } from '../../../core/models';
import { HetznerApiService } from '../../../core/hetzner-api.service';
import { DemoRestrictionDialogComponent } from '../demo-restriction-dialog/demo-restriction-dialog';

@Component({
  selector: 'app-network-details-dialog',
  standalone: true,
  imports: [NgClass, DemoRestrictionDialogComponent],
  template: `
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="cancel.emit()">
      <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 class="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            🌐 Network Configuration
          </h3>
          <button class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center justify-center text-xl font-bold" (click)="cancel.emit()">×</button>
        </div>

        <!-- Content -->
        <div class="p-6 overflow-y-auto flex-1 dialog-scroll-area">
          @if (server()) {
            <div class="space-y-6">
              
              <!-- Public Network Section -->
              <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full" [ngClass]="getNetworkStatusClass()"></span>
                    Public Network
                  </h4>
                  <span class="px-3 py-1 rounded-full text-sm font-medium" [ngClass]="getNetworkStatusClass()">
                    {{ getNetworkStatusText() }}
                  </span>
                </div>

                @if (hasPublicNetwork()) {
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- IPv4 Address -->
                    @if (getIPv4()) {
                      <div class="space-y-2">
                        <div class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">IPv4 Address</div>
                        <div class="flex items-center gap-2">
                          <code class="px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg font-mono text-sm text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600">{{ getIPv4() }}</code>
                        </div>
                      </div>
                    }

                    <!-- IPv6 Address -->
                    @if (getIPv6()) {
                      <div class="space-y-2">
                        <div class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">IPv6 Address</div>
                        <div class="flex items-center gap-2">
                          <code class="px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg font-mono text-xs text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600">{{ getIPv6() }}</code>
                        </div>
                      </div>
                    }

                    <!-- Network Zone -->
                    <div class="space-y-2">
                      <div class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Network Zone</div>
                      <div class="flex items-center gap-2">
                        <span class="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-lg text-sm font-medium">{{ getNetworkZone() }}</span>
                      </div>
                    </div>

                    <!-- Bandwidth -->
                    <div class="space-y-2">
                      <div class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Bandwidth</div>
                      <div class="flex items-center gap-2">
                        <span class="px-3 py-2 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg text-sm font-medium">{{ getBandwidth() }}</span>
                      </div>
                    </div>
                  </div>
                } @else {
                  <div class="text-center py-6 text-slate-500 dark:text-slate-400">
                    <div>Public network is disabled for this server</div>
                  </div>
                }
              </div>

              <!-- Firewall Section -->
              <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    🛡️ Firewall Protection
                  </h4>
                  <span class="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                    {{ getFirewallCount() }} {{ getFirewallCount() === 1 ? 'rule' : 'rules' }}
                  </span>
                </div>

                @if (getFirewallCount() > 0) {
                  <div class="space-y-3">
                    @for (rule of getFirewallRules(); track rule.port) {
                      <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <div class="text-lg">🔧</div>
                        <div class="flex-1">
                          <div class="font-medium text-slate-900 dark:text-slate-100">{{ rule.direction }} - {{ rule.protocol?.toUpperCase() }}</div>
                          <div class="text-sm text-slate-500 dark:text-slate-400">
                            Port {{ rule.port }} from {{ rule.source_ips?.join(', ') || 'any' }}
                          </div>
                        </div>
                        <div class="flex items-center">
                          <span class="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">Active</span>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="text-center py-6 text-slate-500 dark:text-slate-400">
                    <div>No firewall rules configured</div>
                  </div>
                }
              </div>

              <!-- Placement Group Section -->
              <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    📦 Placement Group
                  </h4>
                  <span class="px-3 py-1 rounded-full text-sm font-medium" [ngClass]="getPlacementGroupStatusClass()">
                    {{ getPlacementGroupStatus() }}
                  </span>
                </div>

                @if (hasPlacementGroup()) {
                  <div class="space-y-3">
                    <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Group Name</div>
                      <div class="font-medium text-slate-900 dark:text-slate-100">{{ getPlacementGroupName() }}</div>
                    </div>
                    <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Strategy</div>
                      <div class="font-medium text-slate-900 dark:text-slate-100">{{ getPlacementGroupType() }}</div>
                    </div>
                  </div>
                } @else {
                  <div class="text-center py-6 text-slate-500 dark:text-slate-400">
                    <div>Server is not assigned to any placement group</div>
                    <button class="mt-3 px-4 py-2 rounded-lg bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm font-medium" (click)="showDemoRestriction.set(true)">Assign to Group</button>
                  </div>
                }
              </div>

              <!-- Backup Configuration Section -->
              <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    💾 Backup Configuration
                  </h4>
                  <span class="px-3 py-1 rounded-full text-sm font-medium" [ngClass]="hasBackupEnabled() ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'">
                    {{ hasBackupEnabled() ? 'Enabled' : 'Disabled' }}
                  </span>
                </div>

                @if (hasBackupEnabled()) {
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Backup Window -->
                    <div class="space-y-2">
                      <div class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Backup Window</div>
                      <div class="flex items-center gap-2">
                        <span class="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-lg text-sm font-medium">{{ getBackupWindowDisplay() }}</span>
                      </div>
                    </div>

                    <!-- Next Backup -->
                    <div class="space-y-2">
                      <div class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Next Backup</div>
                      <div class="flex items-center gap-2">
                        <span class="px-3 py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-lg text-sm font-medium">{{ getNextBackupTime() }}</span>
                      </div>
                    </div>

                    <!-- Last Backup -->
                    <div class="space-y-2">
                      <div class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Last Backup</div>
                      <div class="flex items-center gap-2">
                        <span class="px-3 py-2 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg text-sm font-medium">{{ getLastBackupTime() }}</span>
                      </div>
                    </div>

                    <!-- Backup Size -->
                    <div class="space-y-2">
                      <div class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Backup Size</div>
                      <div class="flex items-center gap-2">
                        <span class="px-3 py-2 bg-orange-50 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-lg text-sm font-medium">{{ getBackupSize() }}</span>
                      </div>
                    </div>

                    <!-- Monthly Cost -->
                    <div class="space-y-2">
                      <div class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Monthly Cost</div>
                      <div class="flex items-center gap-2">
                        <span class="px-3 py-2 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg text-sm font-medium">{{ getBackupPrice() }} €</span>
                        <span class="text-xs text-slate-500 dark:text-slate-400">(20% of server)</span>
                      </div>
                    </div>

                    <!-- Retention -->
                    <div class="space-y-2">
                      <div class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Retention</div>
                      <div class="flex items-center gap-2">
                        <span class="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 rounded-lg text-sm font-medium">7 days</span>
                      </div>
                    </div>
                  </div>

                  <!-- Backup Details -->
                  <div class="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div class="flex items-start gap-3">
                      <div class="text-lg">📋</div>
                      <div class="flex-1">
                        <div class="font-medium text-slate-900 dark:text-slate-100">Automatic Daily Backups</div>
                        <div class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          Backups are created automatically during your configured window. The latest 7 backups are retained. You can restore from any backup or create manual snapshots at any time.
                        </div>
                      </div>
                    </div>
                  </div>
                } @else {
                  <div class="text-center py-6 text-slate-500 dark:text-slate-400">
                    <div class="mb-3">⚠️ Backups are currently disabled</div>
                    <div class="text-sm mb-4">Enable automatic backups to protect your server data. Backups cost 20% of your server price and are created daily.</div>
                    <button class="px-4 py-2 rounded-lg bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-sm font-medium" (click)="showDemoRestriction.set(true)">Enable Backups</button>
                  </div>
                }
              </div>

            </div>
          }
        </div>

        <!-- Demo Restriction Dialog -->
        @if (showDemoRestriction()) {
          <app-demo-restriction-dialog (close)="showDemoRestriction.set(false)"></app-demo-restriction-dialog>
        }
      </div>
    </div>
  `,
  styles: [`
    .dialog-scroll-area {
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* Internet Explorer 10+ */
    }
    .dialog-scroll-area::-webkit-scrollbar {
      display: none; /* WebKit */
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetworkDetailsDialogComponent {
  private api = inject(HetznerApiService);
  
  // Inputs
  server = input.required<Server>();
  
  // Outputs
  cancel = output<void>();
  
  // Local state
  showDemoRestriction = signal(false);

  // Network status helpers
  getNetworkStatusText(): string {
    const hasPublic = this.hasPublicNetwork();
    return hasPublic ? 'Enabled' : 'Disabled';
  }

  getNetworkStatusClass(): string {
    const hasPublic = this.hasPublicNetwork();
    if (hasPublic) {
      return 'bg-green-500 text-white px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
    } else {
      return 'bg-gray-400 text-white px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
    }
  }

  hasPublicNetwork(): boolean {
    const server = this.server();
    return !!(this.getIPv4() || this.getIPv6());
  }

  // IP address helpers
  getIPv4(): string | null {
    const server = this.server();
    return (server.public_net?.ipv4 && !Array.isArray(server.public_net.ipv4)) ? server.public_net.ipv4.ip : null;
  }

  getIPv6(): string | null {
    const server = this.server();
    return (server.public_net?.ipv6 && !Array.isArray(server.public_net.ipv6)) ? server.public_net.ipv6.ip : null;
  }

  // Network zone helper
  getNetworkZone(): string {
    const server = this.server();
    return server.datacenter?.location?.network_zone || 'eu-central';
  }

  // Bandwidth helper
  getBandwidth(): string {
    // In mock/real data this would come from server type
    return '1 Gbit/s';
  }

  // Firewall helpers
  getFirewallCount(): number {
    const server = this.server();
    if (server.public_net?.firewalls) {
      return server.public_net.firewalls.length;
    }
    // Mock some firewall rules based on server status for demo
    return server.status === 'running' ? 3 : 0;
  }

  getFirewallRules(): any[] {
    const server = this.server();
    if (server.public_net?.firewalls && server.public_net.firewalls.length > 0) {
      // For now, return mock rules since we don't have the full firewall details
      // In real implementation, you'd fetch firewall details by ID
      return server.public_net.firewalls.map((fw, index) => ({
        direction: 'inbound',
        port: index === 0 ? '22' : index === 1 ? '80' : '443',
        protocol: 'tcp',
        source_ips: ['0.0.0.0/0', '::/0'],
        firewall_id: fw.id
      }));
    }
    
    // Mock firewall rules for demo
    if (server.status === 'running') {
      return [
        {
          direction: 'inbound',
          port: '22',
          protocol: 'tcp',
          source_ips: ['0.0.0.0/0', '::/0']
        },
        {
          direction: 'inbound',
          port: '80',
          protocol: 'tcp',
          source_ips: ['0.0.0.0/0', '::/0']
        },
        {
          direction: 'inbound',
          port: '443',
          protocol: 'tcp',
          source_ips: ['0.0.0.0/0', '::/0']
        }
      ];
    }
    
    return [];
  }

  // Placement group helpers
  hasPlacementGroup(): boolean {
    const server = this.server();
    return !!(server.placement_group?.id);
  }

  getPlacementGroupStatus(): string {
    return this.hasPlacementGroup() ? 'Assigned' : 'Not assigned';
  }

  getPlacementGroupStatusClass(): string {
    if (this.hasPlacementGroup()) {
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200';
    } else {
      return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
    }
  }

  getPlacementGroupName(): string {
    const server = this.server();
    return server.placement_group?.name || 'Unknown';
  }

  getPlacementGroupType(): string {
    const server = this.server();
    return server.placement_group?.type || 'spread';
  }

  // Backup helpers
  hasBackupEnabled(): boolean {
    const server = this.server();
    return !!(server.backup_window);
  }

  getBackupWindow(): string {
    const server = this.server();
    if (!server.backup_window) return 'Not configured';
    return server.backup_window;
  }

  getBackupWindowDisplay(): string {
    const window = this.getBackupWindow();
    if (window === 'Not configured') return window;
    
    // Format "22-02" as "22:00 - 02:00"
    const [start, end] = window.split('-');
    return `${start}:00 - ${end}:00`;
  }

  getBackupPrice(): string {
    const server = this.server();
    if (!this.hasBackupEnabled()) return '0.00';
    
    // Backup costs 20% of server price
    const serverPrice = this.api.getServerPrice(server);
    const backupPrice = serverPrice * 0.2;
    return backupPrice.toFixed(2);
  }

  getNextBackupTime(): string {
    if (!this.hasBackupEnabled()) return 'No backups scheduled';
    
    const window = this.getBackupWindow();
    if (window === 'Not configured') return 'No backups scheduled';
    
    const [startHour] = window.split('-');
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(parseInt(startHour), 0, 0, 0);
    
    return tomorrow.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getLastBackupTime(): string {
    if (!this.hasBackupEnabled()) return 'No backups available';
    
    // Mock last backup time (yesterday during backup window)
    const window = this.getBackupWindow();
    if (window === 'Not configured') return 'No backups available';
    
    const [startHour] = window.split('-');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(parseInt(startHour), 15, 0, 0); // 15 minutes into window
    
    return yesterday.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getBackupSize(): string {
    if (!this.hasBackupEnabled()) return '0 GB';
    
    // Mock backup size based on server disk size
    const server = this.server();
    const diskSize = server.server_type?.disk || 40;
    // Assume backups are 60-80% of disk size
    const backupSize = Math.round(diskSize * 0.7);
    return `${backupSize} GB`;
  }
}