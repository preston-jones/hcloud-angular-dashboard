import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HetznerApiService } from '../../../../core/hetzner-api.service';

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [FormsModule],
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="onBackdropClick($event)">
      <!-- Dialog -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-w-md w-full p-6 relative z-10" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">Settings</h2>
          <button 
            class="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-1 rounded" 
            (click)="close.emit()"
            aria-label="Close dialog">
            <span class="text-lg">✕</span>
          </button>
        </div>

        <!-- Mode Toggle -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">API Mode</label>
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors border w-32 min-w-32"
              [class]="currentMode() === 'mock' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600'"
              (click)="setMode('mock')">
              Mock Data
            </button>
            <button
              type="button"
              class="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors border w-32 min-w-32"
              [class]="currentMode() === 'real' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600'"
              (click)="setMode('real')">
              Real API
            </button>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">
            @if (currentMode() === 'mock') {
              Using mock data for development and testing
            } @else {
              Using real Hetzner Cloud API
            }
          </p>
        </div>

        <!-- Token Input (only shown when real mode) -->
        @if (currentMode() === 'real') {
          <div class="mb-6">
            <label for="token" class="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
              Hetzner Cloud API Token
            </label>
            <div class="relative">
              <input
                id="token"
                [type]="showToken() ? 'text' : 'password'"
                [(ngModel)]="tokenInput"
                placeholder="Enter your API token..."
                class="w-full px-3 py-2 pr-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors w-6 h-6 flex items-center justify-center"
                (click)="toggleTokenVisibility()"
                [attr.aria-label]="showToken() ? 'Hide token' : 'Show token'">
                @if (showToken()) {
                  <span>🙈</span>
                } @else {
                  <span>👁️</span>
                }
              </button>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Your token is stored locally and never transmitted to our servers
            </p>
          </div>
        }

        <!-- Actions -->
        <div class="flex gap-3 justify-end">
          <button
            type="button"
            class="px-4 py-2 rounded-lg text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors w-20 min-w-20"
            (click)="close.emit()">
            Cancel
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 w-28 min-w-28"
            (click)="save()">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDialogComponent {
  @Output() close = new EventEmitter<void>();
  @Output() saveAndClose = new EventEmitter<void>();
  
  private apiService = inject(HetznerApiService);
  
  // Mode and token management
  currentMode = signal<'mock' | 'real'>(this.apiService.getCurrentMode());
  tokenInput = signal(this.apiService.getToken());
  showToken = signal(false);

  setMode(mode: 'mock' | 'real'): void {
    this.currentMode.set(mode);
  }

  toggleTokenVisibility(): void {
    this.showToken.update(show => !show);
  }

  save(): void {
    console.log('Saving settings - Mode:', this.currentMode(), 'Token:', this.tokenInput() ? 'Present' : 'None');
    
    // Save mode
    this.apiService.setMode(this.currentMode());
    
    // Save token if provided
    if (this.tokenInput().trim()) {
      this.apiService.setToken(this.tokenInput().trim());
    }
    
    console.log('Settings saved successfully');
    this.saveAndClose.emit();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}