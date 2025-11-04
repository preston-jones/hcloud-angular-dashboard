import { Component, inject, input, output } from '@angular/core';
import { WizardStateService } from '../services';
import { ImageTab } from '../../../core/models';

@Component({
  selector: 'wizard-step-image',
  standalone: true,
  styleUrls: ['./wizard-step-image.scss'],
  template: `
    <!-- Step 3: Image Selection -->
    <div class="wizard-step" id="step-image">
      <div class="step-header">
        <h2 class="step-title">
          <span class="step-icon-header" [class.completed]="isStepCompleted()">
            @if (isStepCompleted()) {
            ✓
            }
          </span>
          Image*
        </h2>
        <p class="step-description">Select an operating system or application</p>
      </div>

      <div class="image-tabs">
        <button class="image-tab" [class.active]="activeImageTab() === 'os'" (click)="setImageTab('os')">OS Images</button>
        <button class="image-tab" [class.active]="activeImageTab() === 'apps'" (click)="setImageTab('apps')">Apps</button>
      </div>

      @if (activeImageTab() === 'os') {
      <div class="image-grid">
        <div class="image-card" [class.selected]="selectedImage() === 'ubuntu'" (click)="selectImage('ubuntu')">
          <div class="image-icon">
            <img src="/assets/icons/ubuntu-icon.svg" alt="Ubuntu">
          </div>
          <div class="image-info">
            <h4>Ubuntu</h4>
            <p>Ubuntu 22.04 LTS</p>
          </div>
        </div>

        <div class="image-card" [class.selected]="selectedImage() === 'fedora'" (click)="selectImage('fedora')">
          <div class="image-icon">
            <img src="/assets/icons/fedora-icon.svg" alt="Fedora">
          </div>
          <div class="image-info">
            <h4>Fedora</h4>
            <p>Fedora 38</p>
          </div>
        </div>

        <div class="image-card" [class.selected]="selectedImage() === 'debian'" (click)="selectImage('debian')">
          <div class="image-icon">
            <img src="/assets/icons/debian-icon.svg" alt="Debian">
          </div>
          <div class="image-info">
            <h4>Debian</h4>
            <p>Debian 12</p>
          </div>
        </div>

        <div class="image-card" [class.selected]="selectedImage() === 'centos'" (click)="selectImage('centos')">
          <div class="image-icon">
            <img src="/assets/icons/centos-icon.svg" alt="CentOS">
          </div>
          <div class="image-info">
            <h4>CentOS</h4>
            <p>CentOS Stream 9</p>
          </div>
        </div>
      </div>
      }

      @if (activeImageTab() === 'apps') {
      <div class="image-grid">
        <div class="image-card" [class.selected]="selectedImage() === 'docker'" (click)="selectImage('docker')">
          <div class="image-icon">
            <img src="/assets/icons/docker-icon.svg" alt="Docker">
          </div>
          <div class="image-info">
            <h4>Docker</h4>
            <p>Docker auf Ubuntu 22.04</p>
          </div>
        </div>
      </div>
      }
    </div>
  `
})
export class WizardStepImage {
  private wizardState = inject(WizardStateService);

  // Input/Output for parent component interaction
  isStepCompleted = input<boolean>(false);
  onImageSelect = output<string>();
  onImageTabSelect = output<ImageTab>();

  // Delegate to wizard state
  selectedImage = () => this.wizardState.selectedImage();
  activeImageTab = () => this.wizardState.activeImageTab();

  selectImage(image: string): void {
    this.onImageSelect.emit(image);
  }

  setImageTab(tab: ImageTab): void {
    this.onImageTabSelect.emit(tab);
  }
}