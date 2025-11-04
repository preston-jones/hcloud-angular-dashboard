import { Component, inject, input, output } from '@angular/core';
import { WizardStateService } from '../services';

@Component({
  selector: 'wizard-step-name',
  standalone: true,
  styleUrls: ['./wizard-step-name.scss'],
  template: `
    <!-- Step 8: Server Name -->
    <div class="wizard-step" id="step-name">
      <div class="step-header">
        <h2 class="step-title">
          <span class="step-icon-header" [class.completed]="isStepCompleted()">
            @if (isStepCompleted()) {
            ✓
            }
          </span>
          Name
        </h2>
      </div>

      <div class="name-configuration">
        <div class="name-input-section">
          <p class="name-description">Choose a descriptive name for your server (3-63 characters). Leave empty to auto-generate a name.</p>

          <div class="name-input-wrapper">
            <input type="text" placeholder="e.g., web-server-prod-1 (optional)" class="name-input"
              [value]="serverName()" (input)="updateServerName($event)">

            @if (nameError()) {
            <div class="name-error">{{ nameError() }}</div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class WizardStepName {
  private wizardState = inject(WizardStateService);

  // Input/Output for parent component interaction
  isStepCompleted = input<boolean>(false);
  onNameUpdate = output<Event>();

  // Delegate to wizard state
  serverName = () => this.wizardState.serverName();
  nameError = () => this.wizardState.nameError();

  updateServerName(event: Event): void {
    this.onNameUpdate.emit(event);
  }
}