import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-demo-restriction-dialog',
  standalone: true,
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="close.emit()">
      <!-- Dialog -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-w-sm w-full p-6 relative z-10" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Demo Modus</h2>
          <button 
            class="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-1 rounded" 
            (click)="close.emit()"
            aria-label="Dialog schließen">
            <span class="text-lg">✕</span>
          </button>
        </div>

        <!-- Message -->
        <div class="mb-6">
          <p class="text-slate-700 dark:text-slate-300 text-center">
            Funktion in Demo nicht verfügbar
          </p>
        </div>

        <!-- Action -->
        <div class="flex justify-center">
          <button
            type="button"
            class="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
            (click)="close.emit()">
            OK
          </button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoRestrictionDialogComponent {
  @Output() close = new EventEmitter<void>();
}