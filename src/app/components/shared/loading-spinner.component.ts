import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="spinner-container" [class.overlay]="overlay">
      <div class="spinner-content">
        <ion-spinner [name]="spinnerType" [color]="color"></ion-spinner>
        <p *ngIf="message" class="spinner-message">{{ message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .spinner-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--lab-space-xl);
      
      &.overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: var(--lab-z-modal, 9999);
      }
    }
    
    .spinner-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--lab-space-base);
      
      .overlay & {
        background: var(--lab-color-surface);
        padding: var(--lab-space-2xl);
        border-radius: var(--lab-radius-2xl);
        box-shadow: var(--lab-shadow-strong);
      }
    }
    
    ion-spinner {
      width: 48px;
      height: 48px;
    }
    
    .spinner-message {
      margin: 0;
      font-size: var(--lab-font-size-base);
      color: var(--ion-text-color);
      font-weight: 500;
      text-align: center;
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() message: string = '';
  @Input() overlay: boolean = false;
  @Input() color: string = 'primary';
  @Input() spinnerType: string = 'crescent';
}
