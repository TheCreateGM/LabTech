import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

export interface Step {
  label: string;
  icon?: string;
  status: 'pending' | 'active' | 'completed';
}

@Component({
  selector: 'app-progress-stepper',
  template: `
    <div class="stepper-container" [class.vertical]="vertical" role="navigation" aria-label="Progress steps">
      <!-- Progress Bar Background -->
      <div class="progress-background" *ngIf="!vertical">
        <div class="progress-fill" [style.width.%]="progressPercentage"></div>
      </div>
      
      <!-- Steps -->
      <div class="steps-wrapper" [class.vertical]="vertical">
        <div 
          *ngFor="let step of steps; let i = index; let isLast = last"
          class="step-item"
          [class.active]="step.status === 'active'"
          [class.completed]="step.status === 'completed'"
          [class.pending]="step.status === 'pending'"
          [attr.aria-current]="step.status === 'active' ? 'step' : null">
          
          <!-- Step Circle -->
          <div class="step-circle" [class.touch-target]="touchFriendly">
            <ion-icon 
              *ngIf="step.status === 'completed'" 
              name="checkmark" 
              class="step-icon"
              aria-hidden="true"></ion-icon>
            <ion-icon 
              *ngIf="step.status === 'active' && step.icon" 
              [name]="step.icon" 
              class="step-icon"
              aria-hidden="true"></ion-icon>
            <span 
              *ngIf="step.status === 'pending' || (step.status === 'active' && !step.icon)" 
              class="step-number"
              aria-label="Step {{i + 1}}">
              {{ i + 1 }}
            </span>
          </div>
          
          <!-- Step Label -->
          <div class="step-label" [class.sr-only]="hideLabels">
            {{ step.label }}
          </div>
          
          <!-- Connector Line -->
          <div 
            *ngIf="!isLast" 
            class="step-connector"
            [class.vertical-connector]="vertical"
            [class.completed-connector]="step.status === 'completed'"
            aria-hidden="true">
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .stepper-container {
      position: relative;
      width: 100%;
      padding: var(--lab-space-lg) 0;
      
      &.vertical {
        display: flex;
        flex-direction: column;
      }
    }

    /* Progress Bar Background (Horizontal Only) */
    .progress-background {
      position: absolute;
      top: calc(var(--lab-space-lg) + 20px);
      left: 32px;
      right: 32px;
      height: 4px;
      background: var(--lab-color-outline);
      border-radius: var(--lab-radius-full);
      z-index: 0;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, 
        var(--ion-color-primary), 
        var(--ion-color-secondary)
      );
      border-radius: var(--lab-radius-full);
      transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0 8px rgba(91, 141, 238, 0.4);
    }

    /* Steps Wrapper */
    .steps-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      position: relative;
      z-index: 1;
      
      &.vertical {
        flex-direction: column;
        gap: var(--lab-space-xl);
      }
    }

    /* Step Item */
    .step-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--lab-space-sm);
      flex: 1;
      position: relative;
      transition: all var(--lab-transition-base);
      
      &.active {
        .step-circle {
          background: linear-gradient(135deg, 
            var(--ion-color-primary), 
            var(--ion-color-secondary)
          );
          color: white;
          box-shadow: var(--lab-shadow-primary);
          transform: scale(1.15);
          animation: pulse-ring 2s ease-out infinite;
        }
        
        .step-label {
          color: var(--ion-color-primary);
          font-weight: 600;
        }
      }
      
      &.completed {
        .step-circle {
          background: linear-gradient(135deg, 
            var(--ion-color-success), 
            var(--ion-color-secondary)
          );
          color: white;
          box-shadow: var(--lab-shadow-success);
        }
        
        .step-label {
          color: var(--ion-color-success);
        }
      }
      
      &.pending {
        .step-circle {
          background: var(--lab-color-surface);
          border: 2px solid var(--lab-color-outline);
          color: var(--ion-color-medium);
        }
        
        .step-label {
          color: var(--ion-color-medium);
        }
      }
    }

    /* Step Circle */
    .step-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--lab-transition-base);
      position: relative;
      z-index: 2;
      background: var(--lab-color-surface);
      
      &.touch-target {
        min-width: 44px;
        min-height: 44px;
      }
    }

    .step-icon {
      font-size: 1.5rem;
      font-weight: bold;
    }

    .step-number {
      font-size: var(--lab-font-size-base);
      font-weight: 600;
      font-family: var(--lab-font-family-display);
    }

    /* Step Label */
    .step-label {
      font-size: var(--lab-font-size-sm);
      text-align: center;
      max-width: 100px;
      line-height: var(--lab-line-height-tight);
      font-weight: 500;
      transition: all var(--lab-transition-base);
    }

    /* Connector Line */
    .step-connector {
      position: absolute;
      top: 20px;
      left: calc(50% + 22px);
      width: calc(100% - 44px);
      height: 4px;
      background: var(--lab-color-outline);
      border-radius: var(--lab-radius-full);
      transition: background var(--lab-transition-base);
      
      &.completed-connector {
        background: linear-gradient(90deg, 
          var(--ion-color-success), 
          var(--ion-color-secondary)
        );
      }
      
      &.vertical-connector {
        top: calc(50% + 22px);
        left: 20px;
        width: 4px;
        height: var(--lab-space-xl);
      }
    }

    /* Pulse Ring Animation */
    @keyframes pulse-ring {
      0% {
        box-shadow: 0 0 0 0 rgba(91, 141, 238, 0.7);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(91, 141, 238, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(91, 141, 238, 0);
      }
    }

    /* Screen Reader Only */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .step-circle {
        width: 40px;
        height: 40px;
      }
      
      .step-icon {
        font-size: 1.25rem;
      }
      
      .step-label {
        font-size: var(--lab-font-size-xs);
        max-width: 80px;
      }
      
      .progress-background {
        top: calc(var(--lab-space-lg) + 18px);
        left: 28px;
        right: 28px;
      }
    }
    
    @media (max-width: 480px) {
      .step-circle {
        width: 36px;
        height: 36px;
      }
      
      .step-number {
        font-size: var(--lab-font-size-sm);
      }
      
      .step-label {
        font-size: 0.625rem;
        max-width: 60px;
      }
      
      .progress-background {
        top: calc(var(--lab-space-lg) + 16px);
        left: 24px;
        right: 24px;
      }
      
      .step-connector {
        top: 18px;
        left: calc(50% + 18px);
        width: calc(100% - 36px);
      }
    }
    
    /* Reduced Motion */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class ProgressStepperComponent {
  @Input() steps: Step[] = [];
  @Input() vertical: boolean = false;
  @Input() hideLabels: boolean = false;
  @Input() touchFriendly: boolean = true;

  get progressPercentage(): number {
    if (this.steps.length === 0) return 0;
    const completedSteps = this.steps.filter(s => s.status === 'completed').length;
    const activeStepIndex = this.steps.findIndex(s => s.status === 'active');
    const totalProgress = completedSteps + (activeStepIndex >= 0 ? 0.5 : 0);
    return (totalProgress / this.steps.length) * 100;
  }
}
