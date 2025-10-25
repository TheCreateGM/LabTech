import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-theme-toggle',
  template: `
    <ion-button 
      fill="clear" 
      (click)="toggleTheme()"
      [attr.aria-label]="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
      [attr.aria-pressed]="isDarkMode"
      class="theme-toggle-btn"
      role="switch">
      <ion-icon 
        [name]="isDarkMode ? 'sunny' : 'moon'" 
        slot="icon-only"
        class="theme-icon"
        aria-hidden="true">
      </ion-icon>
    </ion-button>
  `,
  styles: [`
    .theme-toggle-btn {
      --color: white;
      --border-radius: var(--lab-radius-full);
      --padding-start: 12px;
      --padding-end: 12px;
      transition: all var(--lab-transition-base);
      
      &:hover {
        --background-hover: rgba(255, 255, 255, 0.15);
      }
    }
    
    .theme-icon {
      font-size: 1.5rem;
      transition: transform var(--lab-transition-bounce);
    }
    
    .theme-toggle-btn:hover .theme-icon {
      transform: rotate(20deg) scale(1.1);
    }
    
    .theme-toggle-btn:active .theme-icon {
      transform: rotate(-10deg) scale(0.95);
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class ThemeToggleComponent implements OnInit {
  isDarkMode: boolean = false;

  ngOnInit() {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.isDarkMode = savedTheme === 'dark';
    } else {
      // Check system preference
      this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.applyTheme();
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }

  private applyTheme() {
    const body = document.body;
    if (this.isDarkMode) {
      body.classList.add('dark-theme');
    } else {
      body.classList.remove('dark-theme');
    }
  }
}
