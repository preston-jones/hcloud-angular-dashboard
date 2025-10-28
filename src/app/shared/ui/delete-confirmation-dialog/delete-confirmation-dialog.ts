import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-delete-confirmation-dialog',
  standalone: true,
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="onBackdropClick($event)">
      <!-- Dialog -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-w-md w-full p-6 relative z-10" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">Server löschen</h2>
          <button 
            class="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-1 rounded" 
            (click)="cancel.emit()"
            aria-label="Dialog schließen">
            <span class="text-lg">✕</span>
          </button>
        </div>

        <!-- Message -->
        <div class="mb-6">
          <p class="text-slate-700 dark:text-slate-300">
            Wollen Sie <strong class="text-slate-900 dark:text-slate-100">{{ serverName }}</strong> wirklich löschen?
          </p>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 justify-end">
          <button
            type="button"
            class="px-4 py-2 rounded-lg text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors w-20 min-w-20"
            (click)="cancel.emit()">
            Cancel
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20 w-20 min-w-20"
            (click)="confirm.emit()">
            Löschen
          </button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteConfirmationDialogComponent {
  @Input() serverName: string = '';
  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.cancel.emit();
    }
  }
}