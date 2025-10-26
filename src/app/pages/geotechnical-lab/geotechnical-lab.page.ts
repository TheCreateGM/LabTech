import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-geotechnical-lab',
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar class="gradient-toolbar">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home" text="" color="light"></ion-back-button>
        </ion-buttons>
        <ion-title>Geotechnical Lab</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding lab-content">
      <div class="lab-container" [@pageEnter]="animationState">
        <!-- Header Section -->
        <div class="header-section">
          <div class="header-icon">
            <ion-icon name="layers"></ion-icon>
          </div>
          <h2 class="section-title">Available Tests</h2>
          <p class="section-subtitle">Select a test to begin your workflow</p>
        </div>
        
        <!-- Test Cards -->
        <div class="test-cards">
          <div class="test-card" 
               *ngFor="let test of tests; let i = index"
               (click)="navigateToTest(test)"
               [class.stagger-1]="i === 0"
               [class.stagger-2]="i === 1">
            <div class="card-header">
              <div class="card-icon">
                <ion-icon [name]="test.icon"></ion-icon>
              </div>
              <div class="card-badge" [class]="test.difficulty">
                {{ test.difficulty }}
              </div>
            </div>
            
            <div class="card-content">
              <h3 class="card-title">{{ test.name }}</h3>
              <p class="card-description">{{ test.description }}</p>
              
              <div class="card-meta">
                <div class="meta-item">
                  <ion-icon name="time-outline"></ion-icon>
                  <span>{{ test.duration }}</span>
                </div>
                <div class="meta-item">
                  <ion-icon name="document-text-outline"></ion-icon>
                  <span>{{ test.steps }} steps</span>
                </div>
              </div>
            </div>
            
            <div class="card-footer">
              <ion-button fill="clear" class="start-button">
                <span>Start Test</span>
                <ion-icon name="arrow-forward" slot="end"></ion-icon>
              </ion-button>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .gradient-toolbar {
      --background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary));
      --color: white;
      --border-width: 0;
      --padding-top: 8px;
      --padding-bottom: 8px;
      
      ion-title {
        font-weight: 600;
        letter-spacing: 0.5px;
      }
    }
    
    .lab-content {
      --background: linear-gradient(180deg, #f8fafc 0%, #e0e7ff 100%);
    }
    
    .lab-container {
      max-width: 700px;
      margin: 0 auto;
      padding: var(--lab-space-xl) var(--lab-space-base);
    }
    
    /* Header Section */
    .header-section {
      text-align: center;
      margin-bottom: var(--lab-space-2xl);
    }
    
    .header-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto var(--lab-space-lg);
      background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary));
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
      
      ion-icon {
        font-size: 36px;
        color: white;
      }
    }
    
    .section-title {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0 0 var(--lab-space-sm) 0;
      color: var(--ion-text-color) !important;
    }
    
    .section-subtitle {
      font-size: var(--lab-font-size-base);
      color: var(--ion-color-medium);
      margin: 0;
    }
    
    /* Test Cards */
    .test-cards {
      display: flex;
      flex-direction: column;
      gap: var(--lab-space-xl);
    }
    
    .test-card {
      background: white;
      border-radius: var(--lab-radius-2xl);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      padding: var(--lab-space-xl);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 2px solid transparent;
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary));
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 40px rgba(102, 126, 234, 0.2);
        border-color: var(--ion-color-primary);
        
        &::before {
          opacity: 1;
        }
        
        .card-icon {
          transform: scale(1.1) rotate(5deg);
        }
        
        .start-button {
          transform: translateX(4px);
        }
      }
      
      &:active {
        transform: translateY(-2px);
      }
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--lab-space-lg);
    }
    
    .card-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
      border-radius: var(--lab-radius-xl);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      ion-icon {
        font-size: 32px;
        color: var(--ion-color-primary);
      }
    }
    
    .card-badge {
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      
      &.intermediate {
        background: linear-gradient(135deg, #ffce00, #ff9500);
        color: #000;
      }
      
      &.beginner {
        background: linear-gradient(135deg, #10dc60, #38ef7d);
        color: white;
      }
    }
    
    .card-content {
      margin-bottom: var(--lab-space-lg);
    }
    
    .card-title {
      font-size: var(--lab-font-size-xl);
      font-weight: 700;
      margin: 0 0 var(--lab-space-sm) 0;
      color: var(--ion-text-color) !important;
      line-height: 1.3;
    }
    
    .card-description {
      font-size: var(--lab-font-size-sm);
      color: var(--ion-color-medium);
      margin: 0 0 var(--lab-space-base) 0;
      line-height: 1.5;
    }
    
    .card-meta {
      display: flex;
      gap: var(--lab-space-lg);
      flex-wrap: wrap;
    }
    
    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: var(--lab-font-size-sm);
      color: var(--ion-color-medium);
      
      ion-icon {
        font-size: 18px;
        color: var(--ion-color-primary);
      }
    }
    
    .card-footer {
      display: flex;
      justify-content: flex-end;
      padding-top: var(--lab-space-base);
      border-top: 1px solid var(--lab-color-outline);
    }
    
    .start-button {
      --color: var(--ion-color-primary);
      font-weight: 600;
      transition: transform 0.3s ease;
      
      ion-icon {
        margin-left: 4px;
      }
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .header-icon {
        width: 56px;
        height: 56px;
        border-radius: 18px;
        
        ion-icon {
          font-size: 32px;
        }
      }
      
      .section-title {
        font-size: 1.5rem;
      }
      
      .test-card {
        padding: var(--lab-space-lg);
      }
      
      .card-icon {
        width: 48px;
        height: 48px;
        
        ion-icon {
          font-size: 28px;
        }
      }
      
      .card-title {
        font-size: var(--lab-font-size-lg);
      }
    }
    
    @media (max-width: 480px) {
      .lab-container {
        padding: var(--lab-space-lg) var(--lab-space-base);
      }
      
      .test-card {
        padding: var(--lab-space-base);
      }
      
      .card-meta {
        gap: var(--lab-space-sm);
      }
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule],
  animations: [
    trigger('pageEnter', [
      transition(':enter', [
        query('.header-section, .test-card', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(150, [
            animate('0.6s cubic-bezier(0.4, 0, 0.2, 1)', style({ 
              opacity: 1, 
              transform: 'translateY(0)' 
            }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class GeotechnicalLabPage implements OnInit {
  animationState = 'visible';
  tests = [
    {
      name: 'Grain Size Sieve Analysis (Dry)',
      description: 'Determine particle size distribution of coarse-grained soil through mechanical sieving',
      icon: 'grid-outline',
      duration: '45 min',
      steps: 5,
      difficulty: 'beginner',
      route: '/sieve-analysis'
    },
    {
      name: 'Standard Proctor Compaction Test',
      description: 'Establish the relationship between moisture content and dry density of soil',
      icon: 'hammer-outline',
      duration: '60 min',
      steps: 6,
      difficulty: 'intermediate',
      route: '/proctor-test'
    }
  ];
  
  constructor(private router: Router) {}

  ngOnInit() {
    // Animation state is set
  }

  navigateToTest(test: any) {
    this.router.navigate([test.route]);
  }
}
