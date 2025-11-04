import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject } from '@angular/core';
import { ThemeService } from '../../../../core/theme.service';

@Component({
  selector: 'app-topbar',
  imports: [],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  @Output() menu = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();
  private theme = inject(ThemeService);

  isDark() { return this.theme.theme() === 'dark'; }
  toggleTheme() { this.theme.toggle(); }

  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.search.emit(input.value);
  }
}
