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
      margin: 8px 0;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .lab-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    
    .card-icon {
      margin-bottom: 12px;
    }
    
    .card-label {
      font-size: 16px;
      font-weight: 500;
      color: var(--ion-color-dark);
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
