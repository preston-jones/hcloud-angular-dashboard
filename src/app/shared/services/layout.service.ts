import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // Sidebar state signals
  private collapsed = signal(true);
  private isPinned = signal(false);

  // Computed sidebar width based on state
  readonly sidebarWidth = computed(() => {
    if (this.isPinned() || !this.collapsed()) {
      return '280px';
    }
    return '74px';
  });

  // Getters for read access
  isCollapsed = this.collapsed.asReadonly();
  isPinnedState = this.isPinned.asReadonly();

  // Methods for updating state
  setCollapsed(collapsed: boolean): void {
    this.collapsed.set(collapsed);
  }

  setPinned(pinned: boolean): void {
    this.isPinned.set(pinned);
  }

  togglePin(): void {
    this.isPinned.update(pinned => !pinned);
    if (this.isPinned()) {
      this.collapsed.set(false);
    } else {
      this.collapsed.set(true);
    }
  }

  expandSidebar(): void {
    if (!this.isPinned()) {
      this.collapsed.set(false);
    }
  }

  collapseSidebar(): void {
    if (!this.isPinned()) {
      this.collapsed.set(true);
    }
  }
}