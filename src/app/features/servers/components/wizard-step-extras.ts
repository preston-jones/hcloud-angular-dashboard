import { Component, computed, inject, input, output } from '@angular/core';
import { WizardStateService, DataMappingService } from '../services';

@Component({
  selector: 'wizard-step-extras',
  standalone: true,
  styleUrls: ['./wizard-step-extras.scss'],
  template: `
    <!-- Step 6: Backup Configuration -->
    <div class="wizard-step" id="step-extras">
      <div class="step-header">
        <h2 class="step-title">
          <span class="step-icon-header" [class.completed]="isStepCompleted()">
            @if (isStepCompleted()) {
            ✓
            }
          </span>
          Backups
        </h2>
        <p class="step-description">Configure automatic backup settings for your server</p>
      </div>

      <div class="configuration-options">
        <label class="checkbox-label">
          <input type="checkbox" [checked]="enableBackups()" (change)="toggleBackups()">
          <span>Enable automatic backups (+20% of server costs)</span>
        </label>

        @if (enableBackups()) {
        <div class="backup-window-selection">
          <h5>Backup Window</h5>
          <p class="backup-window-description">Choose when automatic backups should run (4-hour window in UTC)</p>
          <div class="backup-window-grid">
            @for (window of backupWindows(); track window.value) {
            <div class="backup-window-option" [class.selected]="selectedBackupWindow() === window.value"
              (click)="selectBackupWindow(window.value)">
              <span class="window-time">{{ window.value }}</span>
              <span class="window-label">{{ window.label }}</span>
            </div>
            }
          </div>
        </div>
        }
      </div>
    </div>
  `
})
export class WizardStepExtras {
  private wizardState = inject(WizardStateService);
  private dataMapping = inject(DataMappingService);

  // Input/Output for parent component interaction
  isStepCompleted = input<boolean>(false);
  onToggleBackups = output<void>();
  onBackupWindowSelect = output<string>();

  // Computed properties
  backupWindows = computed(() => this.dataMapping.backupWindows());

  // Delegate to wizard state
  enableBackups = () => this.wizardState.enableBackups();
  selectedBackupWindow = () => this.wizardState.selectedBackupWindow();

  toggleBackups(): void {
    this.onToggleBackups.emit();
  }

  selectBackupWindow(window: string): void {
    this.onBackupWindowSelect.emit(window);
  }
}