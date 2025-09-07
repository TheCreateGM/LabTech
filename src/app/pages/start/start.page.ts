import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-start',
  template: `
    <ion-content class="ion-padding">
      <div class="start-container">
        <div class="logo-section">
          <h1 class="app-title">LabTech GeoLab</h1>
        </div>
        <div class="start-button-section">
          <ion-button 
            expand="block" 
            size="large" 
            (click)="navigateToHome()"
            class="start-button">
            START
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .start-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }
    
    .logo-section {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .app-title {
      font-size: 2.5rem;
      font-weight: 300;
      color: var(--ion-color-dark);
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .start-button-section {
      flex: 1;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      width: 100%;
      max-width: 300px;
    }
    
    .start-button {
      --background: var(--ion-color-primary);
      --color: white;
      font-size: 1.2rem;
      font-weight: 500;
      height: 60px;
    }
  `],
  standalone: true,
  imports: [IonicModule]
})
export class StartPage {
  constructor(private router: Router) {}

  navigateToHome() {
    this.router.navigate(['/home']);
  }
}
