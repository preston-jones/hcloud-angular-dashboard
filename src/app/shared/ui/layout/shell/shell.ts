import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TopbarComponent } from '../topbar/topbar';
import { SidebarComponent } from '../sidebar/sidebar';
import { DemoRestrictionDialogComponent } from '../../demo-restriction-dialog/demo-restriction-dialog';
import { HetznerApiService } from '../../../../core/hetzner-api.service';
import { PageHeaderService } from '../../../../core/page-header.service';
import { LayoutService } from '../../../services/layout.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, CommonModule, TopbarComponent, SidebarComponent, DemoRestrictionDialogComponent],
  templateUrl: './shell.html',
  styleUrls: ['./shell.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  api = inject(HetznerApiService);
  pageHeaderService = inject(PageHeaderService);
  layoutService = inject(LayoutService);

  // Use layout service for sidebar state
  collapsed = this.layoutService.isCollapsed;
  isPinned = this.layoutService.isPinnedState;

  expandSidebar = () => {
    this.layoutService.expandSidebar();
  };
  
  collapseSidebar = () => {
    this.layoutService.collapseSidebar();
  };

  // Conditional methods that check if settings are open
  onSidebarMouseEnter = (sidebar: SidebarComponent) => {
    if (!sidebar.isSettingsOpen) {
      this.expandSidebar();
    }
  };

  onSidebarMouseLeave = (sidebar: SidebarComponent) => {
    if (!sidebar.isSettingsOpen) {
      this.collapseSidebar();
    }
  };

  togglePin = () => {
    this.layoutService.togglePin();
  };

  onSearch(query: string) {
    this.api.setSearchQuery(query);
  }
}
