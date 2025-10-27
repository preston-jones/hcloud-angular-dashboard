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
  @HostBinding('class.collapsed') get isCollapsed() { return this.collapsed; }
  @Output() menu = new EventEmitter<void>();

  nav: NavItem[] = [
    { label: 'Servers',   path: '/servers',   icon: '🖥️' },
    { label: 'Locations', path: '/locations', icon: '📍' },
    { label: 'Analyzer',  path: '/analyzer',  icon: '🌿' },
  ];

  onIconClick() {
    this.menu.emit();
  }
}
