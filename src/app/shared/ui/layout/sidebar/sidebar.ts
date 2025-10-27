import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgFor } from '@angular/common';

type NavItem = { label: string; path: string; icon?: string };

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgFor],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  @Input() collapsed = false;
  @HostBinding('class.collapsed') get isCollapsed() { return this.collapsed; }

  nav: NavItem[] = [
    { label: 'Servers',   path: '/servers',   icon: '🖥️' },
    { label: 'Locations', path: '/locations', icon: '📍' },
    { label: 'Analyzer',  path: '/analyzer',  icon: '🌿' },
  ];
}
