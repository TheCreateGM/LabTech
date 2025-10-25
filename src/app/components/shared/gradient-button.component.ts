import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-gradient-button',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-button
      [expand]="expand"
      [size]="size"
      [disabled]="disabled"
      [class]="'gradient-button ' + variant"
      (click)="handleClick()">
      <ion-icon *ngIf="iconStart" [name]="iconStart" slot="start"></ion-icon>
      <ng-content></ng-content>
      <ion-icon *ngIf="iconEnd" [name]="iconEnd" slot="end"></ion-icon>
    </ion-button>
  `,
  styles: [`
    .gradient-button {
      --border-radius: var(--lab-radius-xl);
      --padding-top: 16px;
      --padding-bottom: 16px;
      --padding-start: 24px;
      --padding-end: 24px;
      font-weight: 600;
      letter-spacing: 0.5px;
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.2) 0%,
          rgba(255, 255, 255, 0) 100%
        );
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      &:hover::before {
        opacity: 1;
      }
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4);
      }
      
      &:active {
        transform: translateY(0);
      }
      
      // Variants
      &.primary {
        --background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-secondary) 100%);
        --color: white;
      }
      
      &.accent {
        --background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        --color: white;
      }
      
      &.success {
        --background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        --color: white;
      }
      
      &.outline {
        --background: transparent;
        --color: var(--ion-color-primary);
        --border-width: 2px;
        --border-color: var(--ion-color-primary);
        --border-style: solid;
        
        &:hover {
          --background: var(--ion-color-primary);
          --color: white;
        }
      }
      
      &.glass {
        --background: rgba(255, 255, 255, 0.85);
        --color: var(--ion-color-primary);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        
        &:hover {
          --background: rgba(255, 255, 255, 0.95);
        }
      }
    }
    
    @media (max-width: 768px) {
      .gradient-button {
        --padding-top: 14px;
        --padding-bottom: 14px;
        --padding-start: 20px;
        --padding-end: 20px;
      }
    }
  `]
})
export class GradientButtonComponent {
  @Input() expand: 'block' | 'full' | undefined = undefined;
  @Input() size: 'small' | 'default' | 'large' = 'default';
  @Input() variant: 'primary' | 'accent' | 'success' | 'outline' | 'glass' = 'primary';
  @Input() disabled: boolean = false;
  @Input() iconStart?: string;
  @Input() iconEnd?: string;
  @Output() buttonClick = new EventEmitter<void>();
  
  handleClick() {
    if (!this.disabled) {
      this.buttonClick.emit();
    }
  }
}
