import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate, stagger, query } from '@angular/animations';
import { LabCardComponent } from '../../components/lab-card.component';
import { addIcons } from 'ionicons';
import { settings, layers, flask } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  template: `
    <ion-content class="ion-padding home-content">
      <div class="home-container" [@pageEnter]="animationState">
        <!-- Hero Section -->
        <div class="hero-section">
          <div class="hero-icon">
            <ion-icon name="flask"></ion-icon>
          </div>
          <h1 class="home-title gradient-text">Choose Your Laboratory</h1>
          <p class="home-subtitle">Select a laboratory to begin your test workflow</p>
        </div>
        
        <!-- Lab Cards -->
        <div class="lab-cards" [@staggerCards]="labs.length">
          <app-lab-card
            *ngFor="let lab of labs; let i = index"
            [iconName]="lab.icon"
            [label]="lab.name"
            [class.available]="lab.available"
            [class.coming-soon]="!lab.available"
            (cardClick)="onLabClick(lab)">
          </app-lab-card>
        </div>
        
        <!-- Coming Soon Badge -->
        <div class="info-section">
          <ion-chip color="medium" class="info-chip">
            <ion-icon name="information-circle"></ion-icon>
            <ion-label>More labs coming soon!</ion-label>
          </ion-chip>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .home-content {
      --background: linear-gradient(180deg, #f8fafc 0%, #e0e7ff 100%);
    }
    
    .home-container {
      max-width: 600px;
      margin: 0 auto;
      padding-top: var(--lab-space-2xl);
      padding-bottom: var(--lab-space-2xl);
    }
    
    /* Hero Section */
    .hero-section {
      text-align: center;
      margin-bottom: var(--lab-space-2xl);
      padding: 0 var(--lab-space-base);
    }
    
    .hero-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto var(--lab-space-lg);
      background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary));
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
      animation: float 3s ease-in-out infinite;
      
      ion-icon {
        font-size: 48px;
        color: white;
      }
    }
    
    .home-title {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 var(--lab-space-sm) 0;
      background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .home-subtitle {
      font-size: var(--lab-font-size-base);
      color: var(--ion-color-medium);
      margin: 0;
      font-weight: 400;
    }
    
    /* Lab Cards */
    .lab-cards {
      display: flex;
      flex-direction: column;
      gap: var(--lab-space-lg);
      margin-bottom: var(--lab-space-2xl);
    }
    
    app-lab-card {
      &.coming-soon {
        opacity: 0.6;
        position: relative;
        
        &::after {
          content: 'Coming Soon';
          position: absolute;
          top: var(--lab-space-base);
          right: var(--lab-space-base);
          background: linear-gradient(135deg, #ffce00, #ff9500);
          color: #000;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          z-index: 10;
          box-shadow: 0 2px 8px rgba(255, 206, 0, 0.3);
        }
      }
      
      &.available {
        cursor: pointer;
        
        &::after {
          content: 'Available';
          position: absolute;
          top: var(--lab-space-base);
          right: var(--lab-space-base);
          background: linear-gradient(135deg, #10dc60, #38ef7d);
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          z-index: 10;
          box-shadow: 0 2px 8px rgba(16, 220, 96, 0.3);
        }
      }
    }
    
    /* Info Section */
    .info-section {
      display: flex;
      justify-content: center;
      padding: var(--lab-space-base);
    }
    
    .info-chip {
      --background: rgba(113, 128, 150, 0.1);
      border: 1px solid var(--ion-color-medium);
      font-size: var(--lab-font-size-sm);
      
      ion-icon {
        margin-right: 4px;
      }
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .home-container {
        padding-top: var(--lab-space-xl);
      }
      
      .hero-icon {
        width: 64px;
        height: 64px;
        border-radius: 20px;
        
        ion-icon {
          font-size: 40px;
        }
      }
      
      .home-title {
        font-size: 1.75rem;
      }
      
      .home-subtitle {
        font-size: var(--lab-font-size-sm);
      }
    }
    
    @media (max-width: 480px) {
      .home-container {
        padding-top: var(--lab-space-lg);
      }
      
      .hero-section {
        margin-bottom: var(--lab-space-xl);
      }
      
      .home-title {
        font-size: 1.5rem;
      }
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, LabCardComponent],
  animations: [
    trigger('pageEnter', [
      transition(':enter', [
        query('.hero-section, .lab-cards, .info-section', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(150, [
            animate('0.6s cubic-bezier(0.4, 0, 0.2, 1)', style({ 
              opacity: 1, 
              transform: 'translateY(0)' 
            }))
          ])
        ])
      ])
    ]),
    trigger('staggerCards', [
      transition('* => *', [
        query('app-lab-card', [
          style({ opacity: 0, transform: 'scale(0.95) translateY(20px)' }),
          stagger(120, [
            animate('0.5s cubic-bezier(0.4, 0, 0.2, 1)', style({ 
              opacity: 1, 
              transform: 'scale(1) translateY(0)' 
            }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class HomePage implements OnInit {
  animationState = 'visible';
  labs = [
    {
      name: 'Tech LAB',
      icon: 'settings',
      available: false,
      route: null
    },
    {
      name: 'GeoTechnical LAB',
      icon: 'layers',
      available: true,
      route: '/tabs/geotechnical-lab'
    },
    {
      name: 'Chemical LAB',
      icon: 'flask',
      available: false,
      route: null
    }
  ];
  
  constructor(
    private router: Router,
    private alertController: AlertController
  ) {
    addIcons({ settings, layers, flask });
  }

  ngOnInit() {
    // Animation state is already set
  }

  onLabClick(lab: any) {
    if (lab.available && lab.route) {
      this.router.navigate([lab.route]);
    } else {
      this.showNotAvailableAlert(lab.name);
    }
  }

  async showNotAvailableAlert(labName: string) {
    const alert = await this.alertController.create({
      header: 'Coming Soon',
      message: `${labName} is not yet available in this version. Stay tuned for updates!`,
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }
}
