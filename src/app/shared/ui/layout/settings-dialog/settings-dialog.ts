import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
          <label class="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">Data Source</label>
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
              [class]="currentMode() === 'mock' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600'"
              (click)="setMode('mock')">
              Demo Mode
            </button>
            <button
              type="button"
              class="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
              [class]="currentMode() === 'real' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600'"
              (click)="setMode('real')">
              Live Data
            </button>
          </div>
          <p class="text-sm text-slate-600 dark:text-slate-300 mt-4">
            @if (currentMode() === 'mock') {
              Using sample data for testing and demo purposes
            } @else {
              Using real Hetzner Cloud data
            }
          </p>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 justify-end">
          <button
            type="button"
            class="px-4 py-2 rounded-lg text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            (click)="close.emit()">
            Cancel
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
            (click)="save()">
            Save Changes
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
  private router = inject(Router);
  currentMode = signal<'mock' | 'real'>(this.apiService.getCurrentMode());

  setMode(mode: 'mock' | 'real'): void {
    this.currentMode.set(mode);
  }

  save(): void {
    this.apiService.setMode(this.currentMode());
    // Force immediate data reload before navigation
    this.apiService.loadServers();
    this.saveAndClose.emit();
    this.router.navigate(['/dashboard']);
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}