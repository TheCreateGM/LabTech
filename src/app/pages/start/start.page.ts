import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-start',
  template: `
    <ion-content class="ion-no-padding start-content">
      <div class="start-container">
        <!-- Animated gradient background -->
        <div class="gradient-background"></div>
        
        <!-- Floating particles effect -->
        <div class="particles">
          <div class="particle" *ngFor="let p of particles" 
               [style.left.%]="p.x"
               [style.animation-delay.s]="p.delay"
               [style.animation-duration.s]="p.duration"></div>
        </div>
        
        <!-- Logo Section -->
        <div class="logo-section" [@fadeInUp]="animationState">
          <!-- App Icon -->
          <div class="app-icon-wrapper">
            <div class="app-icon">
              <ion-icon name="flask" class="icon-main"></ion-icon>
            </div>
          </div>
          
          <!-- App Title -->
          <h1 class="app-title gradient-text">LabTech GeoLab</h1>
          <p class="app-subtitle">Geotechnical Engineering Excellence</p>
        </div>
        
        <!-- Start Button Section -->
        <div class="start-button-section" [@fadeInUp]="animationState">
          <ion-button 
            expand="block" 
            size="large" 
            (click)="navigateToHome()"
            class="start-button">
            <span class="button-text">GET STARTED</span>
            <ion-icon name="arrow-forward" slot="end"></ion-icon>
          </ion-button>
          
          <p class="version-text">Version 1.0.2</p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .start-content {
      --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .start-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
      padding: var(--lab-space-2xl) var(--lab-space-lg);
      position: relative;
      overflow: hidden;
    }
    
    /* Animated gradient background */
    .gradient-background {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(270deg, #667eea, #764ba2, #f093fb);
      background-size: 600% 600%;
      animation: gradientShift 15s ease infinite;
      z-index: 0;
    }
    
    /* Floating particles */
    .particles {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
      z-index: 1;
    }
    
    .particle {
      position: absolute;
      bottom: -10px;
      width: 8px;
      height: 8px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      animation: float-up 8s linear infinite;
    }
    
    @keyframes float-up {
      0% {
        transform: translateY(0) rotate(0deg);
        opacity: 0;
      }
      10% {
        opacity: 1;
      }
      90% {
        opacity: 1;
      }
      100% {
        transform: translateY(-100vh) rotate(360deg);
        opacity: 0;
      }
    }
    
    /* Logo Section */
    .logo-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--lab-space-lg);
      position: relative;
      z-index: 2;
    }
    
    .app-icon-wrapper {
      margin-bottom: var(--lab-space-base);
      animation: float 3s ease-in-out infinite;
    }
    
    .app-icon {
      width: 120px;
      height: 120px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(8px);
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
        animation: pulse 2s ease-in-out infinite;
      }
    }
    
    .icon-main {
      font-size: 64px;
      color: var(--ion-color-primary);
      filter: drop-shadow(0 2px 4px rgba(102, 126, 234, 0.3));
      position: relative;
      z-index: 1;
    }
    
    .app-title {
      font-size: 3rem;
      font-weight: 700;
      margin: 0;
      background: linear-gradient(135deg, #ffffff, #e0e7ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      letter-spacing: -0.02em;
    }
    
    .app-subtitle {
      font-size: var(--lab-font-size-lg);
      color: rgba(255, 255, 255, 0.9);
      font-weight: 400;
      margin: 0;
      letter-spacing: 0.5px;
    }
    
    /* Start Button Section */
    .start-button-section {
      width: 100%;
      max-width: 360px;
      display: flex;
      flex-direction: column;
      gap: var(--lab-space-base);
      position: relative;
      z-index: 2;
      padding-bottom: var(--lab-space-xl);
    }
    
    .start-button {
      --border-radius: var(--lab-radius-xl);
      --padding-top: 20px;
      --padding-bottom: 20px;
      --background: rgba(255, 255, 255, 0.95);
      --color: var(--ion-color-primary);
      font-weight: 700;
      letter-spacing: 1px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.2), transparent);
        transition: left 0.5s ease;
      }
      
      &:hover::before {
        left: 100%;
      }
      
      &:hover {
        --background: white;
        transform: translateY(-2px);
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3);
      }
      
      &:active {
        transform: translateY(0);
      }
    }
    
    .button-text {
      font-size: var(--lab-font-size-lg);
    }
    
    .version-text {
      margin: 0;
      font-size: var(--lab-font-size-sm);
      color: rgba(255, 255, 255, 0.7);
      text-align: center;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .app-icon {
        width: 100px;
        height: 100px;
        border-radius: 28px;
      }
      
      .icon-main {
        font-size: 56px;
      }
      
      .app-title {
        font-size: 2.5rem;
      }
      
      .app-subtitle {
        font-size: var(--lab-font-size-base);
      }
    }
    
    @media (max-width: 480px) {
      .start-container {
        padding: var(--lab-space-xl) var(--lab-space-base);
      }
      
      .app-icon {
        width: 80px;
        height: 80px;
        border-radius: 24px;
      }
      
      .icon-main {
        font-size: 48px;
      }
      
      .app-title {
        font-size: 2rem;
      }
      
      .app-subtitle {
        font-size: var(--lab-font-size-sm);
      }
      
      .button-text {
        font-size: var(--lab-font-size-base);
      }
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule],
  animations: [
    trigger('fadeInUp', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(30px)'
      })),
      transition(':enter', [
        animate('0.8s 0.3s cubic-bezier(0.4, 0, 0.2, 1)', style({
          opacity: 1,
          transform: 'translateY(0)'
        }))
      ])
    ])
  ]
})
export class StartPage implements OnInit {
  animationState = 'visible';
  particles: Array<{x: number, delay: number, duration: number}> = [];
  
  constructor(private router: Router) {}

  ngOnInit() {
    // Generate random particles for floating effect
    this.particles = Array.from({length: 15}, () => ({
      x: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 6 + Math.random() * 4
    }));
  }

  navigateToHome() {
    this.router.navigate(['/home']);
  }
}
