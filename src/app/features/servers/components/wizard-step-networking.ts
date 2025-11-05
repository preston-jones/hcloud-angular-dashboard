import { Component, inject, input, output } from '@angular/core';
import { WizardStateService } from '../services';

@Component({
  selector: 'wizard-step-networking',
  standalone: true,
  styleUrls: ['./wizard-step-networking.scss'],
  template: `
    <!-- Step 4: Networking -->
    <div class="wizard-step" id="step-networking">
      <div class="step-header">
        <h2 class="step-title">
          <span class="step-icon-header" [class.completed]="isStepCompleted()">
          </span>
          Networking
        </h2>
        <p class="step-description">Configure network settings for your server</p>
      </div>

      <div class="networking-options">
        <label class="checkbox-label">
          <input type="checkbox" [checked]="enablePublicIPv4()" (change)="togglePublicIPv4()">
          <span>public IPv4</span>
        </label>

        <label class="checkbox-label">
          <input type="checkbox" [checked]="enablePublicIPv6()" (change)="togglePublicIPv6()">
          <span>public IPv6</span>
        </label>
      </div>
    </div>
  `
})
export class WizardStepNetworking {
  private wizardState = inject(WizardStateService);

  // Input/Output for parent component interaction
  isStepCompleted = input<boolean>(false);
  onToggleIPv4 = output<void>();
  onToggleIPv6 = output<void>();

  // Delegate to wizard state
  enablePublicIPv4 = () => this.wizardState.enablePublicIPv4();
  enablePublicIPv6 = () => this.wizardState.enablePublicIPv6();

  togglePublicIPv4(): void {
    this.onToggleIPv4.emit();
  }

  togglePublicIPv6(): void {
    this.onToggleIPv6.emit();
  }
}