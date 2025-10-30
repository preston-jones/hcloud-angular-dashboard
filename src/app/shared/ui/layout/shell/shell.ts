import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TopbarComponent } from '../topbar/topbar';
import { SidebarComponent } from '../sidebar/sidebar';
import { DemoRestrictionDialogComponent } from '../../demo-restriction-dialog/demo-restriction-dialog';
import { HetznerApiService } from '../../../../core/hetzner-api.service';
import { PageHeaderService } from '../../../../core/page-header.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, CommonModule, TopbarComponent, SidebarComponent, DemoRestrictionDialogComponent],
  templateUrl: './shell.html',
  styleUrls: ['./shell.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  collapsed = signal(true); // Default to collapsed (small sidebar)
  isPinned = signal(false); // Pin state
  api = inject(HetznerApiService);
  pageHeaderService = inject(PageHeaderService);

  // Computed sidebar width based on state
  sidebarWidth = computed(() => {
    if (this.isPinned() || !this.collapsed()) {
      return '280px';
    }
    return '71px'; // Close gap with 72px minimal sidebar
  });

  getSidebarWidth(): string {
    return this.sidebarWidth();
  }

  expandSidebar = () => {
    if (!this.isPinned()) {
      this.collapsed.set(false);
    }
  };
  
  collapseSidebar = () => {
    if (!this.isPinned()) {
      this.collapsed.set(true);
    }
  };

  togglePin = () => {
    this.isPinned.update(pinned => !pinned);
    if (this.isPinned()) {
      // When pinning, expand the sidebar
      this.collapsed.set(false);
    } else {
      // When unpinning, collapse the sidebar
      this.collapsed.set(true);
    }
  };

  onSearch(query: string) {
    this.api.setSearchQuery(query);
  }
}
