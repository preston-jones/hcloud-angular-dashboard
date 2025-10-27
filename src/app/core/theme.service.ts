import { Injectable, signal } from '@angular/core';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  theme = signal<Theme>(document.documentElement.classList.contains('dark') ? 'dark' : 'light');

  set(theme: Theme) {
    this.theme.set(theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(STORAGE_KEY, theme);
  }

  toggle() {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }
}