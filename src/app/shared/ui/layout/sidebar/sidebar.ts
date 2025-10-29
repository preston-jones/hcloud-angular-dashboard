import { ChangeDetectionStrategy, Component, HostBinding, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

type NavItem = { label: string; path: string; icon?: string };

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Input() isPinned = false;
  @HostBinding('class.collapsed') get isCollapsed() { return this.collapsed; }
  @Output() togglePin = new EventEmitter<void>();

  nav: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Servers', path: '/my-servers', icon: '🖥️' },
    { label: 'Locations', path: '/locations', icon: '📍' },
    { label: 'Analyzer', path: '/analyzer', icon: '🌿' },
  ];

  onPinClick() {
    this.togglePin.emit();
  }
}
