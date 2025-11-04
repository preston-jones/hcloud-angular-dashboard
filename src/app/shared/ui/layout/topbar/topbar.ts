import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject } from '@angular/core';
import { ThemeService } from '../../../../core/theme.service';
import { HetznerApiService } from '../../../../core/hetzner-api.service';

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
  private api = inject(HetznerApiService);

  isDark() { return this.theme.theme() === 'dark'; }
  toggleTheme() { this.theme.toggle(); }

  // API status methods
  getApiMode() { return this.api.mode(); }
  isLiveMode() { return this.api.mode() === 'real'; }
  isMockMode() { return this.api.mode() === 'mock'; }
  
  getStatusText() {
    return this.isLiveMode() ? 'Live connected' : 'Mock mode';
  }
  
  getStatusColor() {
    return this.isLiveMode() ? 'text-green-600' : 'text-orange-500';
  }
  
  getStatusDot() {
    return this.isLiveMode() ? '🟢' : '🟡';
  }

  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.search.emit(input.value);
  }
}
