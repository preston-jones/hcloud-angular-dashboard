import { Component, computed, inject, input, output } from '@angular/core';
import { HetznerApiService } from '../../../core/hetzner-api.service';
import { WizardStateService } from '../services';

@Component({
  selector: 'wizard-step-security',
  standalone: true,
  styleUrls: ['./wizard-step-security.scss'],
  template: `
    <!-- Step 5: Firewalls -->
    <div class="wizard-step" id="step-security">
      <div class="step-header">
        <h2 class="step-title">
          <span class="step-icon-header" [class.completed]="isStepCompleted()">
            @if (isStepCompleted()) {
            ✓
            } @else {
            !
            }
          </span>
          Firewalls
        </h2>
        <p class="step-description">Configure firewall rules to protect your server</p>
      </div>

      <p>Mit Firewalls können Sie Ihre Server einfach absichern, indem Sie Traffic basierend auf Regeln einschränken oder erlauben.</p>

      <div class="firewall-selection">
        @for (firewall of firewalls(); track firewall.id) {
        <div class="firewall-card" [class.selected]="selectedFirewalls().includes(firewall.id)"
          (click)="toggleFirewall(firewall.id)">
          <div class="firewall-icon">🛡️</div>
          <div class="firewall-info">
            <div class="firewall-name">{{ firewall.name }}</div>
            <div class="firewall-details">{{ firewall.rules?.length || 0 }} rules</div>
          </div>
        </div>
        }
      </div>
    </div>
  `
})
export class WizardStepSecurity {
  private api = inject(HetznerApiService);
  private wizardState = inject(WizardStateService);

  // Input/Output for parent component interaction
  isStepCompleted = input<boolean>(false);
  onFirewallToggle = output<number>();

  // Computed properties
  firewalls = computed(() => this.api.firewalls());

  // Delegate to wizard state
  selectedFirewalls = () => this.wizardState.selectedFirewalls();

  toggleFirewall(firewallId: number): void {
    this.onFirewallToggle.emit(firewallId);
  }
}