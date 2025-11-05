import { Injectable, signal } from '@angular/core';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  theme = signal<Theme>(this.getInitialTheme());

  constructor() {
    // Apply initial theme to DOM
    this.applyThemeToDom(this.theme());
  }

  private getInitialTheme(): Theme {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        return saved as Theme;
      }
      // Default to dark mode if no saved preference
      return 'dark';
    } catch {
      // Fallback to checking document class or default to dark
      return document.documentElement.classList.contains('dark') ? 'dark' : 'dark';
    }
  }

  private applyThemeToDom(theme: Theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }

  set(theme: Theme) {
    this.theme.set(theme);
    this.applyThemeToDom(theme);
    sessionStorage.setItem(STORAGE_KEY, theme);
  }

  toggle() {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }
}