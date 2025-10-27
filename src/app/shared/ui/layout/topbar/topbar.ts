import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { ThemeService } from '../../../../core/theme.service';

@Component({
  selector: 'app-topbar',
  imports: [NgIf],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  @Output() menu = new EventEmitter<void>();
  private theme = inject(ThemeService);

  isDark() { return this.theme.theme() === 'dark'; }
  toggleTheme() { this.theme.toggle(); }
}
