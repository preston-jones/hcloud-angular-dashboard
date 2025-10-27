import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopbarComponent } from '../topbar/topbar';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, TopbarComponent],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  collapsed = signal(false);
  toggleSidebar = () => this.collapsed.update(v => !v);
}
