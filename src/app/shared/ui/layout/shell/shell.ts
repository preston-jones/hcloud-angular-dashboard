import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopbarComponent } from '../topbar/topbar';
import { SidebarComponent } from '../sidebar/sidebar';
import { HetznerApiService } from '../../../../core/hetzner-api.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, TopbarComponent, SidebarComponent],
  templateUrl: './shell.html',
  styleUrls: ['./shell.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  collapsed = signal(false);
  private api = inject(HetznerApiService);

  toggleSidebar = () => this.collapsed.update(v => !v);

  onSearch(query: string) {
    this.api.setSearchQuery(query);
  }
}
