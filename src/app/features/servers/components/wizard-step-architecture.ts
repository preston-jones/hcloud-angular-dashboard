import { Component, computed, inject, input, output } from '@angular/core';
import { HetznerApiService } from '../../../core/hetzner-api.service';
import { WizardStateService, DataMappingService } from '../services';
import { ServerArchitecture, CpuArchitecture } from '../../../core/models';

@Component({
  selector: 'wizard-step-architecture',
  standalone: true,
  styleUrls: ['./wizard-step-architecture.scss'],
  template: `
    <!-- Step 1: Architecture Selection -->
    <div class="wizard-step" id="step-architecture">
      <div class="step-header">
        <h2 class="step-title">
          <span class="step-icon-header" [class.completed]="isStepCompleted()">
            @if (isStepCompleted()) {
            ✓
            } @else {
            !
            }
          </span>
          Architecture
        </h2>
        <p class="step-description">Select the desired server architecture</p>
      </div>

      <div class="architecture-options">
        <!-- Shared Resources Section -->
        <div class="architecture-section">
          <h3 class="section-header">Shared Resources</h3>
          <div class="architecture-cards-row">
            <div class="architecture-option" [class.selected]="selectedArchitecture() === 'cost-optimized'"
              (click)="selectArchitecture('cost-optimized')">
              <div class="option-header">
                <h4>Cost-Optimized</h4>
                <span class="availability-badge limited">Limited Availability</span>
              </div>
              <p>Ideal für Entwicklung und Tests</p>

              <!-- Architecture Selection for Cost-Optimized -->
              <div class="arch-selection">
                <div class="arch-selection-header">Architecture</div>
                <div class="arch-options">
                  <div class="arch-option" [class.selected]="selectedArchitecture() === 'cost-optimized' && selectedCpuArchitecture() === 'x86'"
                    (click)="selectCpuArchitecture($event, 'x86')">
                    <input type="radio" name="cost-optimized-arch" value="x86"
                      [checked]="selectedArchitecture() === 'cost-optimized' && selectedCpuArchitecture() === 'x86'">
                    <span>x86 (Intel/AMD)</span>
                  </div>
                  <div class="arch-option" [class.selected]="selectedArchitecture() === 'cost-optimized' && selectedCpuArchitecture() === 'arm64'"
                    (click)="selectCpuArchitecture($event, 'arm64')">
                    <input type="radio" name="cost-optimized-arch" value="arm64"
                      [checked]="selectedArchitecture() === 'cost-optimized' && selectedCpuArchitecture() === 'arm64'">
                    <span>Arm64 (Ampere)</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="architecture-option" [class.selected]="selectedArchitecture() === 'regular-performance'"
              (click)="selectArchitecture('regular-performance')">
              <div class="option-header">
                <h4>Regular Performance</h4>
              </div>
              <p>Ausgewogene Performance für die meisten Anwendungen</p>

              <!-- Architecture Selection for Regular Performance -->
              <div class="arch-selection">
                <div class="arch-selection-header">Architecture</div>
                <div class="arch-options">
                  <div class="arch-option" 
                       [class.selected]="selectedArchitecture() === 'regular-performance'">
                    <span>x86 (AMD)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Dedicated Resources Section -->
        <div class="architecture-section">
          <h3 class="section-header">Dedicated Resources</h3>
          <div class="architecture-cards-row">
            <div class="architecture-option" [class.selected]="selectedArchitecture() === 'general-purpose'"
              (click)="selectArchitecture('general-purpose')">
              <div class="option-header">
                <h4>General Purpose</h4>
              </div>
              <p>Dedizierte CPU-Performance für produktive Workloads</p>

              <!-- Architecture Selection for General Purpose -->
              <div class="arch-selection">
                <div class="arch-selection-header">Architecture</div>
                <div class="arch-options">
                  <div class="arch-option" 
                       [class.selected]="selectedArchitecture() === 'general-purpose'">
                    <span>x86 (AMD)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Server Types Table under Architecture -->
      @if (selectedArchitecture()) {
      <div class="server-types-section">
        <h3>Available Server Types</h3>
        <div class="server-type-table">
          <div class="table-header">
            <div class="col-name">Name</div>
            <div class="col-vcpus">vCPUs</div>
            <div class="col-memory">RAM</div>
            <div class="col-disk">Disk</div>
            <div class="col-transfer">Transfer</div>
            <div class="col-price">Preis/Monat</div>
          </div>

          @for (server of filteredServerTypes(); track server.id; let i = $index) {
          @if (i < 6) { 
          <div class="table-row" [class.selected]="selectedServerType() === server.server_type?.name"
            [class.unavailable]="isServerTypeUnavailable(server.server_type?.name || '')"
            (click)="selectServerType(server.server_type?.name || '')">
            <div class="col-name">
              <strong>{{ server.server_type?.name || 'Unknown' }}</strong>
              @if (isServerTypeUnavailable(server.server_type?.name || '')) {
              <span class="unavailable-badge">Ausverkauft</span>
              }
            </div>
            <div class="col-vcpus">{{ server.server_type?.cores || 0 }}</div>
            <div class="col-memory">{{ server.server_type?.memory || 0 }} GB</div>
            <div class="col-disk">{{ server.server_type?.disk || 0 }} GB</div>
            <div class="col-transfer">20 TB</div>
            <div class="col-price">€{{ formatPrice(server.server_type?.prices?.[0]?.price_monthly?.gross) }}</div>
          </div>
          }
          }
        </div>
      </div>
      }
    </div>
  `
})
export class WizardStepArchitecture {
  private api = inject(HetznerApiService);
  private wizardState = inject(WizardStateService);
  private dataMapping = inject(DataMappingService);

  // Self-contained computed properties
  protected selectedArchitecture = () => this.wizardState.selectedArchitecture();
  protected selectedCpuArchitecture = () => this.wizardState.selectedCpuArchitecture();
  protected selectedServerType = () => this.wizardState.selectedServerType();
  protected isStepCompleted = () => this.wizardState.isStepCompleted('architecture');

  // Self-contained filtered server types
  protected filteredServerTypes = computed(() => {
    const servers = this.api.availableServerTypes();
    const architectureFilter = this.wizardState.selectedArchitecture();
    const cpuArchitecture = this.wizardState.selectedCpuArchitecture();

    if (!architectureFilter) {
      return servers;
    }

    return servers.filter(server => {
      const cpuType = server.server_type?.cpu_type;
      const architecture = server.server_type?.architecture;
      const category = server.server_type?.category;

      if (!cpuType || !architecture || !category) return false;

      switch (architectureFilter) {
        case 'cost-optimized':
          if (cpuType !== 'shared' || category !== 'cost_optimized') return false;
          if (cpuArchitecture) {
            // Map TypeScript type to mock data value
            const mockArchitecture = cpuArchitecture === 'arm64' ? 'arm' : cpuArchitecture;
            return architecture === mockArchitecture;
          }
          return architecture === 'x86';

        case 'regular-performance':
          return cpuType === 'shared' && 
                 category === 'regular_purpose' && 
                 architecture === 'x86';

        case 'general-purpose':
          return cpuType === 'dedicated' && 
                 category === 'general_purpose' && 
                 architecture === 'x86';

        default:
          return false;
      }
    });
  });

  // Self-contained methods
  protected selectArchitecture(architecture: ServerArchitecture): void {
    this.wizardState.selectedArchitecture.set(architecture);
    this.wizardState.selectedServerType.set(''); // Reset server type when architecture changes
    
    // Only auto-set CPU architecture if none is currently selected
    if (!this.wizardState.selectedCpuArchitecture()) {
      const autoArch = this.dataMapping.autoSetCpuArchitecture(architecture);
      this.wizardState.selectedCpuArchitecture.set(autoArch);
    }
  }

  protected selectCpuArchitecture(event: Event, cpuArch: CpuArchitecture): void {
    event.stopPropagation();
    this.wizardState.selectedCpuArchitecture.set(cpuArch);
    
    // Also select the Cost-Optimized card when clicking CPU architecture buttons
    if (this.wizardState.selectedArchitecture() !== 'cost-optimized') {
      this.wizardState.selectedArchitecture.set('cost-optimized');
      this.wizardState.selectedServerType.set(''); // Reset server type when architecture changes
    }
  }

  protected selectServerType(serverType: string): void {
    if (!this.isServerTypeUnavailable(serverType)) {
      this.wizardState.selectedServerType.set(serverType);
    }
  }

  protected isServerTypeUnavailable(serverTypeName: string): boolean {
    const types = this.api.serverTypes();
    const server = types?.find(s => s.server_type?.name === serverTypeName);
    return server ? !this.api.isServerTypeAvailable(server) : false;
  }

  protected formatPrice(price: string | number | undefined): string {
    if (!price) return '0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toFixed(2);
  }
}