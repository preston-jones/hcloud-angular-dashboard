import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ServerStatus = 'running' | 'stopped' | 'error' | 'available';

@Component({
  selector: 'app-server-status-dot',
  standalone: true,
  imports: [NgClass],
  template: `
    <span 
      class="status-dot flex-shrink-0" 
      [ngClass]="status()"
      [attr.aria-label]="getStatusLabel()"
      [title]="getStatusLabel()">
    </span>
  `,
  styles: [`
    /* Status dot styles */
    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }
    
    .status-dot.running { 
      background: #22c55e; 
    }
    
    .status-dot.stopped { 
      background: #9ca3af; 
    }
    
    .status-dot.error { 
      background: #ef4444; 
    }
    
    .status-dot.available { 
      background: #3b82f6; 
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerStatusDotComponent {
  status = input.required<ServerStatus>();

  getStatusLabel(): string {
    const statusLabels: Record<ServerStatus, string> = {
      running: 'Server is running',
      stopped: 'Server is stopped',
      error: 'Server has an error',
      available: 'Server is available'
    };
    
    return statusLabels[this.status()] || 'Unknown status';
  }
}