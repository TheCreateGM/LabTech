import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-lab-card',
  template: `
    <ion-card (click)="onCardClick()" class="lab-card">
      <ion-card-content>
        <div class="card-icon">
          <ion-icon [name]="iconName" size="large"></ion-icon>
        </div>
        <div class="card-label">
          {{ label }}
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .lab-card {
      --background: var(--lab-glass-backdrop);
      border: 1px solid var(--lab-glass-border);
      border-radius: var(--lab-radius-2xl);
      box-shadow: var(--lab-shadow-soft);
      margin: var(--lab-space-base);
      text-align: center;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      overflow: hidden;
      position: relative;
    }
    
    .lab-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary));
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .lab-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: var(--lab-shadow-strong);
      --background: rgba(255, 255, 255, 0.95);
    }
    
    .lab-card:hover::before {
      opacity: 1;
    }
    
    ion-card-content {
      padding: var(--lab-space-xl) !important;
    }
    
    .card-icon {
      margin-bottom: var(--lab-space-lg);
      position: relative;
    }
    
    .card-icon ion-icon {
      font-size: 3rem;
      color: var(--ion-color-primary);
      filter: drop-shadow(0 2px 4px rgba(102, 126, 234, 0.3));
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .lab-card:hover .card-icon ion-icon {
      transform: scale(1.1);
      filter: drop-shadow(0 4px 8px rgba(102, 126, 234, 0.4));
    }
    
    .card-label {
      font-size: var(--lab-font-size-lg);
      font-weight: 600;
      color: var(--ion-color-dark);
      letter-spacing: -0.01em;
      line-height: 1.4;
    }
    
    @media (max-width: 768px) {
      .lab-card {
        margin: var(--lab-space-sm);
      }
      
      ion-card-content {
        padding: var(--lab-space-lg) !important;
      }
      
      .card-icon ion-icon {
        font-size: 2.5rem;
      }
      
      .card-label {
        font-size: var(--lab-font-size-base);
      }
    }
  `],
  standalone: true,
  imports: [IonicModule]
})
export class LabCardComponent {
  @Input() iconName: string = '';
  @Input() label: string = '';
  @Output() cardClick = new EventEmitter<void>();

  onCardClick() {
    this.cardClick.emit();
  }
}
