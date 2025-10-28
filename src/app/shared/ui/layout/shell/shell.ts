import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopbarComponent } from '../topbar/topbar';
import { SidebarComponent } from '../sidebar/sidebar';
import { DemoRestrictionDialogComponent } from '../../demo-restriction-dialog/demo-restriction-dialog';
import { HetznerApiService } from '../../../../core/hetzner-api.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, TopbarComponent, SidebarComponent, DemoRestrictionDialogComponent],
  templateUrl: './shell.html',
  styleUrls: ['./shell.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  collapsed = signal(true); // Default to collapsed (small sidebar)
  isPinned = signal(false); // Pin state
  api = inject(HetznerApiService);

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
