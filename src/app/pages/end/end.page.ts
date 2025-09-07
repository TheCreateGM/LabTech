import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { App } from '@capacitor/app';
import { addIcons } from 'ionicons';
import { home, power } from 'ionicons/icons';

@Component({
  selector: 'app-end',
  template: `
    <ion-content class="ion-padding">
      <div class="end-container">
        <div class="completion-message">
          <h2>Test Completed!</h2>
          <p>Thank you for using LabTech GeoLab.</p>
        </div>
        
        <div class="action-buttons">
          <ion-button 
            expand="block" 
            size="large" 
            (click)="goHome()"
            class="home-button">
            <ion-icon name="home" slot="start"></ion-icon>
            HOME
          </ion-button>
          
          <ion-button 
            expand="block" 
            size="large" 
            (click)="exitApp()"
            class="exit-button">
            <ion-icon name="power" slot="start"></ion-icon>
            EXIT
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .end-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      max-width: 400px;
      margin: 0 auto;
    }
    
    .completion-message {
      margin-bottom: 40px;
    }
    
    .completion-message h2 {
      font-size: 2rem;
      font-weight: 300;
      color: var(--ion-color-success);
      margin-bottom: 16px;
    }
    
    .completion-message p {
      font-size: 1.2rem;
      color: var(--ion-color-medium);
    }
    
    .action-buttons {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .home-button {
      --background: var(--ion-color-primary);
      --color: white;
      height: 60px;
      font-size: 1.1rem;
      font-weight: 500;
    }
    
    .exit-button {
      --background: var(--ion-color-danger);
      --color: white;
      height: 60px;
      font-size: 1.1rem;
      font-weight: 500;
    }
  `],
  standalone: true,
  imports: [IonicModule]
})
export class EndPage {
  constructor(private router: Router) {
    addIcons({ home, power });
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  async exitApp() {
    try {
      await App.exitApp();
    } catch (error) {
      // Fallback for web browser
      console.log('Exit app not supported in web browser');
      window.close();
    }
  }
}
