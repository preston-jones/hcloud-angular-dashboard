import { Component, inject, input, output } from '@angular/core';
import { WizardStateService } from '../services';

@Component({
  selector: 'wizard-step-labels',
  standalone: true,
  styleUrls: ['./wizard-step-labels.scss'],
  template: `
    <!-- Step 7: Labels -->
    <div class="wizard-step" id="step-labels">
      <div class="step-header">
        <h2 class="step-title">
          <span class="step-icon-header" [class.completed]="isStepCompleted()">
            @if (isStepCompleted()) {
            ✓
            } @else {
            !
            }
          </span>
          Labels
        </h2>
        <p class="step-description">Add key-value pairs to categorize and organize your server.</p>
      </div>

      <div class="labels-configuration">
        <div class="labels-input-section">
          <div class="labels-textarea-section">
            <textarea class="labels-textarea"
              placeholder="environment=production&#10;team=backend&#10;project=api-server" rows="6"
              [value]="labelsTextarea()" (input)="updateLabelsTextarea($event)">
            </textarea>
          </div>
        </div>
      </div>
    </div>
  `
})
export class WizardStepLabels {
  private wizardState = inject(WizardStateService);

  // Input/Output for parent component interaction
  isStepCompleted = input<boolean>(false);
  onLabelsUpdate = output<Event>();

  // Delegate to wizard state
  labelsTextarea = () => this.wizardState.labelsTextarea();

  updateLabelsTextarea(event: Event): void {
    this.onLabelsUpdate.emit(event);
  }
}