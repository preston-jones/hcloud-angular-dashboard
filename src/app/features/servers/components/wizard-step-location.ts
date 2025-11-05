import { Component, inject, input, output } from '@angular/core';
import { WizardStateService, DataMappingService } from '../services';

@Component({
  selector: 'wizard-step-location',
  standalone: true,
  styleUrls: ['./wizard-step-location.scss'],
  template: `
    <!-- Step 2: Location Selection -->
    <div class="wizard-step" id="step-location">
      <div class="step-header">
        <h2 class="step-title">
          <span class="step-icon-header" [class.completed]="isStepCompleted()">
          </span>
          Location*
        </h2>
        <p class="step-description">Select the location for your server</p>
      </div>

      <div class="location-grid">
        <div class="location-card" [class.selected]="selectedLocation() === 'fsn1'" (click)="selectLocation('fsn1')">
          <div class="location-flag">🇩🇪</div>
          <div class="location-info">
            <h4>Falkenstein</h4>
          </div>
          <div class="location-badge">Germany</div>
        </div>

        <div class="location-card" [class.selected]="selectedLocation() === 'nbg1'" (click)="selectLocation('nbg1')">
          <div class="location-flag">🇩🇪</div>
          <div class="location-info">
            <h4>Nürnberg</h4>
          </div>
          <div class="location-badge">Germany</div>
        </div>

        <div class="location-card" [class.selected]="selectedLocation() === 'hel1'" (click)="selectLocation('hel1')">
          <div class="location-flag">🇫🇮</div>
          <div class="location-info">
            <h4>Helsinki</h4>
          </div>
          <div class="location-badge">Finland</div>
        </div>

        <div class="location-card" [class.selected]="selectedLocation() === 'ash'" (click)="selectLocation('ash')">
          <div class="location-flag">🇺🇸</div>
          <div class="location-info">
            <h4>Ashburn</h4>
          </div>
          <div class="location-badge">USA</div>
        </div>

        <div class="location-card" [class.selected]="selectedLocation() === 'hil'" (click)="selectLocation('hil')">
          <div class="location-flag">🇺🇸</div>
          <div class="location-info">
            <h4>Hillsboro</h4>
          </div>
          <div class="location-badge">USA</div>
        </div>

        <div class="location-card" [class.selected]="selectedLocation() === 'sin'" (click)="selectLocation('sin')">
          <div class="location-flag">🇸🇬</div>
          <div class="location-info">
            <h4>Singapore</h4>
          </div>
          <div class="location-badge">Singapore</div>
        </div>
      </div>
    </div>
  `
})
export class WizardStepLocation {
  private wizardState = inject(WizardStateService);

  // Input/Output for parent component interaction
  isStepCompleted = input<boolean>(false);
  onLocationSelect = output<string>();

  // Delegate to wizard state
  selectedLocation = () => this.wizardState.selectedLocation();

  selectLocation(location: string): void {
    this.onLocationSelect.emit(location);
  }
}