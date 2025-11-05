import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
import { Server } from '../../../core/models';
import { HetznerUtilsService } from '../../../core/hetzner-utils.service';

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
        {{ getServerType() }} | 
        {{ utilsService.getArchitecture(server()) }} | 
        {{ utilsService.getDiskSize(server()) }} | 
        {{ utilsService.getNetworkZone(server()) }}
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
  utilsService = inject(HetznerUtilsService);
  
  getServerType(): string {
    return this.server().server_type?.name || 'Unknown';
  }
}