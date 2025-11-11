import { ChangeDetectionStrategy, Component, signal, output, input, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Server } from '../../../core/models';

@Component({
  selector: 'app-server-name-dialog',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full shadow-xl">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Create Server</h3>
        
        <!-- Server Type Info -->
        @if (selectedServer()) {
          <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-4">
            <h4 class="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Server Configuration</h4>
            <div class="space-y-1 text-sm text-slate-600 dark:text-slate-300">
              <div>Type: {{ selectedServer()!.server_type.name || 'Unknown' }}</div>
              <div>CPU: {{ getCpuCount(selectedServer()!) }}</div>
              <div>RAM: {{ getRamSize(selectedServer()!) }}</div>
              <div>Storage: {{ getDiskSize(selectedServer()!) }}</div>
            </div>
          </div>
        }
        
        <!-- Server Name Input -->
        <div class="mb-6">
          <label for="serverName" class="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
            Server Name
          </label>
          <input
            id="serverName"
            type="text"
            [(ngModel)]="serverName"
            placeholder="e.g., web-server-prod-1"
            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            (keydown.enter)="confirmCreate()"
            (keydown.escape)="cancelCreate()"
            #nameInput
          />
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Choose a descriptive name for your server (3-63 characters)
          </p>
          
          <!-- Validation Error -->
          @if (showError()) {
            <p class="text-xs text-red-500 mt-1">{{ errorMessage() }}</p>
          }
        </div>
        
        <!-- Suggested Names -->
        <div class="mb-6">
          <p class="text-xs text-slate-600 dark:text-slate-400 mb-2">Suggestions:</p>
          <div class="flex flex-wrap gap-2">
            @for (suggestion of suggestions(); track suggestion) {
              <button
                type="button"
                (click)="useSuggestion(suggestion)"
                class="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                {{ suggestion }}
              </button>
            }
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex gap-3 justify-end">
          <button 
            type="button"
            class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            (click)="cancelCreate()">
            Cancel
          </button>
          <button 
            type="button"
            class="px-4 py-2 rounded-lg bg-primary hover:bg-primary-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            [disabled]="!isValidName()"
            (click)="confirmCreate()">
            Create Server
          </button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerNameDialogComponent {
  selectedServer = input<Server | null>(null);
  
  confirm = output<string>();
  cancel = output<void>();
  
  serverName = signal('');
  showError = signal(false);
  errorMessage = signal('');
  
  suggestions = signal<string[]>([]);
  
  constructor() {
    // Use effect to generate suggestions when selectedServer changes
    effect(() => {
      const server = this.selectedServer();
      if (server) {
        this.generateSuggestions();
      }
    });
  }
  
  private generateSuggestions(): void {
    const server = this.selectedServer();
    if (!server || !server.server_type) return;
    
    const memory = server.server_type.memory || 4;
    const serverType = server.server_type.name || 'cx11';
    
    // Generate realistic suggestions based on server size
    const suggestions = [];
    
    if (memory <= 4) {
      suggestions.push(
        'dev-server-1',
        'test-env-1', 
        'staging-app',
        `${serverType}-dev`
      );
    } else if (memory <= 16) {
      suggestions.push(
        'web-server-1',
        'api-backend-1',
        'app-prod-1',
        `${serverType}-prod`
      );
    } else {
      suggestions.push(
        'db-server-1',
        'analytics-1',
        'ml-worker-1',
        `${serverType}-cluster`
      );
    }
    
    this.suggestions.set(suggestions);
    
    // Set first suggestion as default
    this.serverName.set(suggestions[0]);
  }
  
  useSuggestion(suggestion: string): void {
    this.serverName.set(suggestion);
    this.showError.set(false);
  }
  
  isValidName(): boolean {
    const name = this.serverName().trim();
    if (name.length < 3 || name.length > 63) return false;
    
    // Basic validation: alphanumeric, hyphens, no consecutive hyphens
    const validPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
    return validPattern.test(name);
  }
  
  confirmCreate(): void {
    const name = this.serverName().trim();
    
    if (!this.isValidName()) {
      this.showError.set(true);
      this.errorMessage.set('Name must be 3-63 characters, alphanumeric and hyphens only');
      return;
    }
    
    this.confirm.emit(name);
  }
  
  cancelCreate(): void {
    this.cancel.emit();
  }
  
  // Helper methods for server info display
  getCpuCount(server: Server): string {
    return server.server_type.cores ? `${server.server_type.cores} vCPU` : '1 vCPU';
  }
  
  getRamSize(server: Server): string {
    return server.server_type.memory ? `${server.server_type.memory} GB` : '4 GB';
  }
  
  getDiskSize(server: Server): string {
    return server.server_type.disk ? `${server.server_type.disk} GB SSD` : '20 GB SSD';
  }
}