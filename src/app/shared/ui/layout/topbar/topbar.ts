import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { ThemeService } from '../../../../core/theme.service';
import { SettingsDialogComponent } from '../settings-dialog/settings-dialog';

@Component({
  selector: 'app-topbar',
  imports: [SettingsDialogComponent],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  @Output() menu = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();
  private theme = inject(ThemeService);

  // Settings dialog state
  showSettings = signal(false);

  isDark() { return this.theme.theme() === 'dark'; }
  toggleTheme() { this.theme.toggle(); }

  openSettings() {
    this.showSettings.set(true);
  }

  closeSettings() {
    this.showSettings.set(false);
  }

  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.search.emit(input.value);
  }
}
