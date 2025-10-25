import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBack, home } from 'ionicons/icons';

@Component({
  selector: 'app-header',
  template: `
    <ion-header class="modern-header">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button 
            (click)="goBack()" 
            [disabled]="!canGoBack"
            class="header-button">
            <ion-icon name="arrow-back" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        
        <ion-title class="header-title">
          <div class="title-wrapper">
            <span class="title-text">{{ title }}</span>
            <div class="title-underline"></div>
          </div>
        </ion-title>
        
        <ion-buttons slot="end">
          <ion-button 
            (click)="goHome()"
            class="header-button">
            <ion-icon name="home" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
  `,
  styles: [`
    .modern-header {
      ion-toolbar {
        --background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-secondary) 100%);
        --color: white;
        --border-width: 0;
        --min-height: 64px;
        box-shadow: var(--lab-shadow-soft);
        position: relative;
        
        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, 
            rgba(255, 255, 255, 0.3),
            rgba(255, 255, 255, 0.7),
            rgba(255, 255, 255, 0.3)
          );
        }
      }
    }
    
    .title-wrapper {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    
    .title-text {
      font-family: var(--lab-font-family-display);
      font-weight: 600;
      letter-spacing: var(--lab-letter-spacing-tight);
    }
    
    .title-underline {
      width: 40px;
      height: 3px;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 2px;
    }
    
    .header-button {
      --color: white;
      --border-radius: var(--lab-radius-lg);
      --padding-start: 8px;
      --padding-end: 8px;
      
      ion-icon {
        font-size: 24px;
      }
      
      &:hover {
        --background-hover: rgba(255, 255, 255, 0.15);
      }
      
      &:active {
        --background-activated: rgba(255, 255, 255, 0.25);
      }
      
      &[disabled] {
        opacity: 0.4;
      }
    }
    
    @media (max-width: 768px) {
      .modern-header ion-toolbar {
        --min-height: 56px;
      }
      
      .header-button ion-icon {
        font-size: 22px;
      }
    }
  `],
  standalone: true,
  imports: [IonicModule]
})
export class HeaderComponent {
  @Input() title: string = '';
  @Input() canGoBack: boolean = true;
  @Input() backRoute: string = '';

  constructor(private router: Router) {
    addIcons({ arrowBack, home });
  }

  goBack() {
    if (this.backRoute) {
      this.router.navigate([this.backRoute]);
    } else {
      window.history.back();
    }
  }

  goHome() {
    this.router.navigate(['/home']);
  }
}
