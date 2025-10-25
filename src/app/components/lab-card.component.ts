import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lab-card',
  template: `
    <ion-card (click)="onCardClick()" class="lab-card" [class.has-progress]="progress !== undefined">
      <div class="card-gradient-overlay"></div>
      
      <ion-card-content>
        <div class="card-icon-wrapper">
          <div class="card-icon-bg"></div>
          <ion-icon [name]="iconName" class="card-icon"></ion-icon>
        </div>
        
        <div class="card-label">
          {{ label }}
        </div>
        
        <div class="card-subtitle" *ngIf="subtitle">
          {{ subtitle }}
        </div>
        
        <div class="card-progress" *ngIf="progress !== undefined">
          <div class="progress-track">
            <div class="progress-fill" [style.width.%]="progress"></div>
          </div>
          <span class="progress-text">{{ progress }}% Complete</span>
        </div>
      </ion-card-content>
      
      <div class="card-shine"></div>
    </ion-card>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .lab-card {
      --background: var(--lab-color-surface);
      border: 1.5px solid var(--lab-color-outline);
      border-radius: var(--lab-radius-2xl);
      box-shadow: var(--lab-shadow-soft);
      margin: 0 !important;
      width: 100%;
      text-align: center;
      cursor: pointer;
      transition: all var(--lab-transition-base);
      overflow: hidden;
      position: relative;
      background: linear-gradient(135deg, 
        var(--lab-color-surface) 0%, 
        var(--lab-color-surface-variant) 100%
      );
    }

    /* Gradient overlay for depth */
    .card-gradient-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(135deg, 
        var(--ion-color-primary) 0%, 
        var(--ion-color-secondary) 100%
      );
      opacity: 0;
      transition: opacity var(--lab-transition-base);
    }

    /* Shine effect on hover */
    .card-shine {
      position: absolute;
      top: -50%;
      right: -50%;
      bottom: -50%;
      left: -50%;
      background: linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.3) 50%,
        rgba(255, 255, 255, 0) 100%
      );
      transform: translateX(-100%) translateY(-100%) rotate(30deg);
      transition: transform 0.6s ease;
    }

    .lab-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: var(--lab-shadow-primary);
      border-color: var(--ion-color-primary);
    }

    .lab-card:hover .card-gradient-overlay {
      opacity: 1;
    }

    .lab-card:hover .card-shine {
      transform: translateX(100%) translateY(100%) rotate(30deg);
    }

    .lab-card:active {
      transform: translateY(-4px) scale(1.01);
    }

    ion-card-content {
      padding: var(--lab-space-2xl) var(--lab-space-xl) !important;
      position: relative;
      z-index: 1;
    }

    /* Icon wrapper with animated background */
    .card-icon-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--lab-space-lg);
      width: 80px;
      height: 80px;
    }

    .card-icon-bg {
      position: absolute;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, 
        var(--lab-glass-primary), 
        var(--lab-glass-secondary)
      );
      border-radius: var(--lab-radius-2xl);
      transition: all var(--lab-transition-base);
      opacity: 0.8;
    }

    .lab-card:hover .card-icon-bg {
      transform: rotate(180deg) scale(1.1);
      opacity: 1;
    }

    .card-icon {
      font-size: 3rem;
      color: var(--ion-color-primary);
      filter: drop-shadow(0 2px 8px rgba(91, 141, 238, 0.3));
      transition: all var(--lab-transition-base);
      position: relative;
      z-index: 1;
    }

    .lab-card:hover .card-icon {
      transform: scale(1.15) rotate(-5deg);
      filter: drop-shadow(0 4px 12px rgba(91, 141, 238, 0.5));
    }

    .card-label {
      font-size: var(--lab-font-size-lg);
      font-weight: 600;
      color: var(--ion-text-color);
      letter-spacing: var(--lab-letter-spacing-tight);
      line-height: var(--lab-line-height-tight);
      font-family: var(--lab-font-family-display);
      margin-bottom: var(--lab-space-xs);
    }

    .card-subtitle {
      font-size: var(--lab-font-size-sm);
      color: var(--ion-color-medium);
      margin-top: var(--lab-space-xs);
      line-height: var(--lab-line-height-normal);
    }

    /* Progress indicator */
    .card-progress {
      margin-top: var(--lab-space-lg);
      display: flex;
      flex-direction: column;
      gap: var(--lab-space-xs);
    }

    .progress-track {
      width: 100%;
      height: 6px;
      background: var(--lab-progress-track);
      border-radius: var(--lab-radius-full);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, 
        var(--ion-color-primary), 
        var(--ion-color-secondary)
      );
      border-radius: var(--lab-radius-full);
      transition: width var(--lab-transition-slow);
    }

    .progress-text {
      font-size: var(--lab-font-size-xs);
      color: var(--ion-color-medium);
      font-weight: 500;
      text-align: right;
    }

    /* Completed state */
    .lab-card.has-progress .progress-fill[style*="100%"] {
      background: linear-gradient(90deg, 
        var(--ion-color-success), 
        var(--ion-color-secondary)
      );
    }

    /* Responsive */
    @media (max-width: 768px) {
      ion-card-content {
        padding: var(--lab-space-xl) var(--lab-space-lg) !important;
      }

      .card-icon-wrapper {
        width: 70px;
        height: 70px;
      }

      .card-icon {
        font-size: 2.5rem;
      }

      .card-label {
        font-size: var(--lab-font-size-base);
      }
    }

    @media (max-width: 480px) {
      ion-card-content {
        padding: var(--lab-space-lg) var(--lab-space-base) !important;
      }

      .card-icon-wrapper {
        width: 60px;
        height: 60px;
      }

      .card-icon {
        font-size: 2rem;
      }

      .card-label {
        font-size: var(--lab-font-size-sm);
      }
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class LabCardComponent {
  @Input() iconName: string = '';
  @Input() label: string = '';
  @Input() subtitle?: string;
  @Input() progress?: number;
  @Output() cardClick = new EventEmitter<void>();

  onCardClick() {
    this.cardClick.emit();
  }
}
