import { ChangeDetectionStrategy, Component, HostBinding, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NavItem } from '../../../models/component.model';
import { SettingsDialogComponent } from '../settings-dialog/settings-dialog';
import { LayoutService } from '../../../services/layout.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SettingsDialogComponent],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Input() isPinned = false;
  @HostBinding('class.collapsed') get isCollapsed() { return this.collapsed; }
  @Output() togglePin = new EventEmitter<void>();

  private router = inject(Router);
  private layoutService = inject(LayoutService);

  // Settings dialog state
  showSettings = signal(false);

  // Expose settings state for parent components
  get isSettingsOpen() {
    return this.showSettings();
  }

  nav: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Server', path: '/my-servers', icon: '🖥️' },
    { label: 'Settings', path: '#', icon: '⚙️', action: 'settings' },
    { label: 'About this App', path: '/app-info', icon: '🌿' },
  ];

  onPinClick() {
    this.togglePin.emit();
  }

  onNavItemClick(item: NavItem, event: Event) {
    if (item.action === 'settings') {
      event.preventDefault();
      this.openSettings();
    }
  }

  openSettings() {
    this.togglePin.emit(); // Actually pin the sidebar
    this.showSettings.set(true);
  }

  closeSettings() {
    this.showSettings.set(false);
    this.togglePin.emit(); // Unpin the sidebar
  }

  saveSettings() {
    this.showSettings.set(false);
    this.togglePin.emit(); // Unpin the sidebar
    this.router.navigate(['/my-servers']);
  }
}
