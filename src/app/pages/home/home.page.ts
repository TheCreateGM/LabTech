import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { LabCardComponent } from '../../components/lab-card.component';
import { addIcons } from 'ionicons';
import { settings, layers, flask } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  template: `
    <ion-content class="ion-padding">
      <div class="home-container">
        <h2 class="home-title">Pick your lab here:</h2>
        
        <div class="lab-cards">
          <app-lab-card
            iconName="settings"
            label="Tech LAB"
            (cardClick)="onTechLabClick()">
          </app-lab-card>
          
          <app-lab-card
            iconName="layers"
            label="GeoTechnical LAB"
            (cardClick)="onGeoTechnicalLabClick()">
          </app-lab-card>
          
          <app-lab-card
            iconName="flask"
            label="Chemical LAB"
            (cardClick)="onChemicalLabClick()">
          </app-lab-card>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .home-container {
      max-width: 420px;
      margin: 0 auto;
      padding-top: 32px;
      padding-bottom: 24px;
      /* Prevent any decorative overflow from leaking to the sides */
      overflow: hidden;
    }
    
    .home-title {
      text-align: center;
      font-size: 1.5rem;
      font-weight: 500;
      color: var(--ion-text-color);
      margin: 0 0 16px 0;
    }
    
    .lab-cards {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Small screens: slightly reduce spacing */
    @media (max-width: 420px) {
      .home-container { padding-top: 24px; }
      .home-title { margin-bottom: 12px; }
    }
  `],
  standalone: true,
  imports: [IonicModule, LabCardComponent]
})
export class HomePage {
  constructor(
    private router: Router,
    private alertController: AlertController
  ) {
    addIcons({ settings, layers, flask });
  }

  onTechLabClick() {
    this.showNotAvailableAlert('Tech LAB');
  }

  onGeoTechnicalLabClick() {
    this.router.navigate(['/tabs/geotechnical-lab']);
  }

  onChemicalLabClick() {
    this.showNotAvailableAlert('Chemical LAB');
  }

  async showNotAvailableAlert(labName: string) {
    const alert = await this.alertController.create({
      header: 'Not Available',
      message: `${labName} is not yet available in this version.`,
      buttons: ['OK']
    });
    await alert.present();
  }
}
