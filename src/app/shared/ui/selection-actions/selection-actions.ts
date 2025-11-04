import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
import { LayoutService } from '../../services/layout.service';
import { SelectionAction } from '../../models/component.model';

@Component({
  selector: 'app-selection-actions',
  standalone: true,
  imports: [],
  template: `
    <!-- Selection Actions Footer - adapts to sidebar like page header -->
    <div class="selection-footer transition-all duration-300"
         [class.active]="selectedCount() > 0"
         [style.margin-left]="layoutService.sidebarWidth()"
         [style.transform]="selectedCount() > 0 ? 'translateY(0)' : 'translateY(100%)'">
      <div class="selection-content">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-sm font-medium text-ink">
              {{ selectedCount() }} selected
            </span>
          </div>
          
          <div class="flex items-center gap-2">
            @for (action of actions(); track action.id) {
              <button 
                class="flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors rounded-md"
                [class]="action.hoverClass || 'hover:bg-gray-50 dark:hover:bg-gray-800'"
                [disabled]="action.disabled"
                [class.opacity-50]="action.disabled"
                (click)="action.action()">
                <span class="text-sm">{{ action.icon }}</span>
                <span>{{ action.label }}</span>
              </button>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./selection-actions.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectionActionsComponent {
  // Inputs
  selectedCount = input.required<number>();
  actions = input.required<SelectionAction[]>();
  
  // Inject layout service for sidebar state
  layoutService = inject(LayoutService);
}