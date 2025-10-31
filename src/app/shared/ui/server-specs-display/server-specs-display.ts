import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
import { Server } from '../../../core/models';
import { ServerDisplayService } from '../../services';

@Component({
  selector: 'app-server-specs-display',
  standalone: true,
  imports: [],
  template: `
    <div class="space-y-1">
      <!-- Server name -->
      <div class="font-medium text-primary">
        {{ server().name }}
      </div>
      <!-- Server specs line -->
      <div class="text-soft text-xs server-specs">
        {{ displayService.getServerType(server()) }} | 
        {{ displayService.getArchitecture(server()) }} | 
        {{ displayService.getDiskSize(server()) }} | 
        {{ displayService.getNetworkZone(server()) }}
      </div>
    </div>
  `,
  styles: [`
    .server-specs {
      line-height: 1.3;
      color: var(--text-soft);
    }
    
    .text-primary {
      color: var(--primary);
    }
    
    .text-soft {
      color: var(--text-soft);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerSpecsDisplayComponent {
  server = input.required<Server>();
  displayService = inject(ServerDisplayService);
}