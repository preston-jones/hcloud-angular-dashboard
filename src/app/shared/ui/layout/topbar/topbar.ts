import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
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
  private router = inject(Router);

  // Settings dialog state
  showSettings = signal(false);

  isDark() { return this.theme.theme() === 'dark'; }
  toggleTheme() { this.theme.toggle(); }

  openSettings() {
    this.showSettings.set(true);
  }

  closeSettings() {
    this.showSettings.set(false);
    // Just close the dialog without navigation
  }

  saveSettings() {
    this.showSettings.set(false);
    // Navigate to My Servers page only when saving settings
    this.router.navigate(['/my-servers']);
  }

  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.search.emit(input.value);
  }
}
