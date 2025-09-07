import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ThemeInfo {
  name: 'light' | 'dark' | 'auto';
  displayName: string;
  icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentThemeSubject = new BehaviorSubject<ThemeInfo>({
    name: 'auto',
    displayName: 'Auto',
    icon: 'phone-portrait-outline'
  });

  public readonly themes: ThemeInfo[] = [
    {
      name: 'light',
      displayName: 'Light',
      icon: 'sunny-outline'
    },
    {
      name: 'dark',
      displayName: 'Dark',
      icon: 'moon-outline'
    },
    {
      name: 'auto',
      displayName: 'Auto',
      icon: 'phone-portrait-outline'
    }
  ];

  public currentTheme$ = this.currentThemeSubject.asObservable();

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    // Get saved theme or default to auto
    const savedTheme = localStorage.getItem('app-theme') as 'light' | 'dark' | 'auto' || 'auto';
    const themeInfo = this.themes.find(t => t.name === savedTheme) || this.themes[2];
    
    this.setTheme(themeInfo);
  }

  public setTheme(theme: ThemeInfo): void {
    // Remove existing theme classes
    document.body.classList.remove('light-theme', 'dark-theme');
    
    // Apply new theme
    if (theme.name === 'light') {
      document.body.classList.add('light-theme');
    } else if (theme.name === 'dark') {
      document.body.classList.add('dark-theme');
    }
    // For 'auto', no class is added - relies on CSS media queries
    
    // Save to localStorage
    localStorage.setItem('app-theme', theme.name);
    
    // Update current theme
    this.currentThemeSubject.next(theme);
  }

  public toggleTheme(): void {
    const currentTheme = this.currentThemeSubject.value;
    const currentIndex = this.themes.findIndex(t => t.name === currentTheme.name);
    const nextIndex = (currentIndex + 1) % this.themes.length;
    this.setTheme(this.themes[nextIndex]);
  }

  public getCurrentTheme(): ThemeInfo {
    return this.currentThemeSubject.value;
  }

  public isDarkMode(): boolean {
    const currentTheme = this.currentThemeSubject.value;
    if (currentTheme.name === 'dark') {
      return true;
    } else if (currentTheme.name === 'light') {
      return false;
    } else {
      // Auto mode - check system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  }
}
