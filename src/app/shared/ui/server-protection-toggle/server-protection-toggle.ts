import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Server } from '../../../core/models';

@Component({
  selector: 'app-server-protection-toggle',
  standalone: true,
  imports: [],
  template: `
    <button 
      class="protection-toggle"
      [class.protected]="isProtected()"
      [class.unprotected]="!isProtected()"
      (click)="onToggle($event)"
      [attr.aria-label]="getAriaLabel()"
      [title]="getTitle()"
      type="button">
      {{ isProtected() ? '🛡' : '🔓' }}
    </button>
  `,
  styles: [`
    .protection-toggle {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.875rem;
      padding: 0.25rem;
      border-radius: 0.25rem;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 1.5rem;
      min-height: 1.5rem;
    }
    
    .protection-toggle:hover {
      transform: scale(1.1);
      background-color: rgba(0, 0, 0, 0.05);
    }
    
    .protection-toggle:active {
      transform: scale(0.95);
    }
    
    .protection-toggle.protected {
      color: #2563eb; /* blue-600 */
    }
    
    .protection-toggle.unprotected {
      color: #9ca3af; /* gray-400 */
    }
    
    .protection-toggle:focus {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerProtectionToggleComponent {
  server = input.required<Server>();
  
  // Output event for when protection is toggled
  toggle = output<{ serverId: number; event: Event }>();

  isProtected(): boolean {
    return this.server().protection?.delete || false;
  }

  onToggle(event: Event): void {
    event.stopPropagation(); // Prevent triggering parent click events
    this.toggle.emit({ 
      serverId: this.server().id, 
      event 
    });
  }

  getAriaLabel(): string {
    const serverName = this.server().name;
    return this.isProtected() 
      ? `Remove protection from ${serverName}`
      : `Protect ${serverName}`;
  }

  getTitle(): string {
    return this.isProtected()
      ? 'Click to remove delete protection'
      : 'Click to enable delete protection';
  }
}