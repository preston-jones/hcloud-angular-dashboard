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
                  <!-- Backup Status Banner -->
                  <div class="mb-4 p-3 rounded-lg" [ngClass]="getBackupStatus() === 'in-progress' ? 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700' : 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700'">
                    <div class="flex items-center gap-3">
                      <div class="text-lg">{{ getBackupStatus() === 'in-progress' ? '⏳' : '✅' }}</div>
                      <div class="flex-1">
                        <div class="font-medium text-slate-900 dark:text-slate-100">
                          {{ getBackupStatus() === 'in-progress' ? 'Backup in Progress' : 'Backup System Active' }}
                        </div>
                        <div class="text-sm text-slate-600 dark:text-slate-300">
                          {{ getBackupStatus() === 'in-progress' ? 'Creating scheduled backup...' : getBackupCount() + ' backups available, next backup ' + getNextBackupTime() }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Backup Window -->
                    <div class="space-y-2">
                      <div class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Backup Window</div>
                      <div class="flex items-center gap-2">
                        <span class="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-lg text-sm font-medium">{{ getBackupWindowDisplay() }}</span>
                        <span class="text-xs text-slate-500 dark:text-slate-400">UTC</span>
                      </div>
                    </div>

                    <!-- Backup Frequency -->
                    <div class="space-y-2">
                      <div class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Frequency</div>
                      <div class="flex items-center gap-2">
                        <span class="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 rounded-lg text-sm font-medium">{{ getBackupFrequency() }}</span>
                      </div>
                    </div>

                    <!-- Available Backups -->
                    <div class="space-y-2">
                      <div class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Available Backups</div>
                      <div class="flex items-center gap-2">
                        <span class="px-3 py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-lg text-sm font-medium">{{ getBackupCount() }} / 7</span>
                        <span class="text-xs text-slate-500 dark:text-slate-400">snapshots</span>
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
                      <div class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Current Size</div>
                      <div class="flex items-center gap-2">
                        <span class="px-3 py-2 bg-orange-50 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-lg text-sm font-medium">{{ getBackupSize() }}</span>
                        <span class="text-xs text-slate-500 dark:text-slate-400">per backup</span>
                      </div>
                    </div>

                    <!-- Storage Location -->
                    <div class="space-y-2">
                      <div class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Storage Location</div>
                      <div class="flex items-center gap-2">
                        <span class="px-3 py-2 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200 rounded-lg text-sm font-medium">{{ getBackupLocation() }}</span>
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
                  </div>

                  <!-- Advanced Backup Configuration -->
                  <div class="mt-6 space-y-4">
                    <h5 class="text-md font-semibold text-slate-900 dark:text-slate-100">Technical Details</h5>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <!-- Compression -->
                      <div class="space-y-2">
                        <div class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Compression</div>
                        <div class="flex items-center gap-2">
                          <span class="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-sm font-medium">{{ getBackupCompression() }}</span>
                        </div>
                      </div>

                      <!-- Encryption -->
                      <div class="space-y-2">
                        <div class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Encryption</div>
                        <div class="flex items-center gap-2">
                          <span class="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-sm font-medium">{{ getBackupEncryption() }}</span>
                        </div>
                      </div>

                      <!-- Retention Policy -->
                      <div class="space-y-2">
                        <div class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Retention Policy</div>
                        <div class="flex items-center gap-2">
                          <span class="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 rounded-lg text-sm font-medium">7 days rolling</span>
                        </div>
                      </div>

                      <!-- Backup Type -->
                      <div class="space-y-2">
                        <div class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Backup Type</div>
                        <div class="flex items-center gap-2">
                          <span class="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-lg text-sm font-medium">Full System Image</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Backup Actions and Info -->
                  <div class="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div class="flex items-start gap-3">
                      <div class="text-lg">📋</div>
                      <div class="flex-1">
                        <div class="font-medium text-slate-900 dark:text-slate-100">Automatic Daily Backups</div>
                        <div class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          Backups are created automatically during your configured window ({{ getBackupWindowDisplay() }} UTC). 
                          The system retains the latest {{ getBackupCount() }} backups for {{ hasBackupEnabled() ? '7 days' : 'N/A' }}. 
                          Each backup is a complete system image that can restore your server to its exact state at backup time.
                        </div>
                        
                        <div class="flex items-center gap-3 mt-3">
                          <button class="px-3 py-1 rounded-md bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-xs font-medium" (click)="showDemoRestriction.set(true)">
                            View Backup History
                          </button>
                          <button class="px-3 py-1 rounded-md bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-xs font-medium" (click)="showDemoRestriction.set(true)">
                            Create Manual Backup
                          </button>
                          <button class="px-3 py-1 rounded-md bg-orange-600 dark:bg-orange-500 text-white hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors text-xs font-medium" (click)="showDemoRestriction.set(true)">
                            Restore from Backup
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                } @else {
                  <div class="text-center py-8 text-slate-500 dark:text-slate-400">
                    <div class="mb-4 text-4xl">⚠️</div>
                    <div class="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">Backups are currently disabled</div>
                    <div class="text-sm mb-6 max-w-md mx-auto">
                      Protect your server data with automatic daily backups. Backups are stored securely in the same region as your server and cost only <strong>{{ getBackupPrice() }} € per month</strong> (20% of your server price).
                    </div>
                    
                    <!-- Backup Benefits -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left max-w-2xl mx-auto">
                      <div class="bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
                        <div class="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                          <span>🔄</span>
                          <span>Daily automatic backups</span>
                        </div>
                        <div class="text-xs text-slate-600 dark:text-slate-400 mt-1">During your chosen time window</div>
                      </div>
                      
                      <div class="bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
                        <div class="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                          <span>🔒</span>
                          <span>AES-256 encryption</span>
                        </div>
                        <div class="text-xs text-slate-600 dark:text-slate-400 mt-1">Secure server-side encryption</div>
                      </div>
                      
                      <div class="bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
                        <div class="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                          <span>📅</span>
                          <span>7-day retention</span>
                        </div>
                        <div class="text-xs text-slate-600 dark:text-slate-400 mt-1">Rolling backup history</div>
                      </div>
                      
                      <div class="bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
                        <div class="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                          <span>⚡</span>
                          <span>One-click restore</span>
                        </div>
                        <div class="text-xs text-slate-600 dark:text-slate-400 mt-1">Fast recovery process</div>
                      </div>
                    </div>
                    
                    <div class="flex flex-col items-center gap-3">
                      <button class="px-6 py-3 rounded-lg bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600 transition-colors font-medium flex items-center gap-2" (click)="showDemoRestriction.set(true)">
                        <span>💾</span>
                        Enable Backups Now
                      </button>
                      <div class="text-xs text-slate-500 dark:text-slate-400">
                        Start protecting your data today for {{ getBackupPrice() }} €/month
                      </div>
                    </div>
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
    
    // Calculate backup price regardless of backup status for pricing display
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
    
    // Calculate backup size based on server disk size and usage patterns
    const server = this.server();
    const diskSize = server.server_type?.disk || 40;
    // Assume backups are 60-80% of disk size depending on server age and activity
    const usageMultiplier = server.status === 'running' ? 0.75 : 0.6;
    const backupSize = Math.round(diskSize * usageMultiplier);
    return `${backupSize} GB`;
  }

  getBackupStatus(): string {
    if (!this.hasBackupEnabled()) return 'disabled';
    
    const server = this.server();
    // Check if backup is in progress (simulate based on current time and backup window)
    const now = new Date();
    const window = this.getBackupWindow();
    
    if (window !== 'Not configured') {
      const [startHour] = window.split('-');
      const currentHour = now.getHours();
      const backupHour = parseInt(startHour);
      
      // If current time is within backup window
      if (Math.abs(currentHour - backupHour) <= 1) {
        return 'in-progress';
      }
    }
    
    return 'active';
  }

  getBackupFrequency(): string {
    if (!this.hasBackupEnabled()) return 'None';
    return 'Daily';
  }

  getBackupLocation(): string {
    const server = this.server();
    const location = server.datacenter?.location?.name || 'Unknown';
    return `${location} (Same region as server)`;
  }

  getBackupCount(): number {
    if (!this.hasBackupEnabled()) return 0;
    
    // Simulate backup count based on how long server has been running
    const server = this.server();
    if (server.created) {
      const createdDate = new Date(server.created);
      const now = new Date();
      const daysSinceCreation = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      // Backups are retained for 7 days, so max 7 backups
      return Math.min(daysSinceCreation, 7);
    }
    
    return 5; // Default for demo
  }

  getBackupCompression(): string {
    return 'LZ4 (Fast compression)';
  }

  getBackupEncryption(): string {
    return 'AES-256 (Server-side encrypted)';
  }
}