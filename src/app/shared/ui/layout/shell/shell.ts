import { ChangeDetectionStrategy, Component, signal, inject, computed, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TopbarComponent } from '../topbar/topbar';
import { SidebarComponent } from '../sidebar/sidebar';
import { DemoRestrictionDialogComponent } from '../../demo-restriction-dialog/demo-restriction-dialog';
import { ServerSearchDropdownComponent } from '../../server-search-dropdown/server-search-dropdown';
import { HetznerApiService } from '../../../../core/hetzner-api.service';
import { PageHeaderService } from '../../../../core/page-header.service';
import { LayoutService } from '../../../services/layout.service';
import { SearchService } from '../../../../core/search.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, CommonModule, TopbarComponent, SidebarComponent, DemoRestrictionDialogComponent, ServerSearchDropdownComponent],
  templateUrl: './shell.html',
  styleUrls: ['./shell.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  api = inject(HetznerApiService);
  pageHeaderService = inject(PageHeaderService);
  layoutService = inject(LayoutService);
  searchService = inject(SearchService);

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

  onSearchDropdownClosed() {
    this.searchService.clearQuery();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const searchInput = document.querySelector('input[type="search"]');
    const dropdown = document.querySelector('app-server-search-dropdown');
    
    // Check if click is outside both search input and dropdown
    if (searchInput && dropdown && 
        !searchInput.contains(target) && 
        !dropdown.contains(target) &&
        this.searchService.searchQuery()) {
      this.onSearchDropdownClosed();
    }
  }
}
