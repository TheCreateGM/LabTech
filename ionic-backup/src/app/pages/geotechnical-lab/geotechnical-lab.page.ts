import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-geotechnical-lab',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>GEOTECHNICAL LAB</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="lab-container">
        <div class="test-buttons">
          <ion-button
            expand="block"
            size="large"
            (click)="navigateToSieveAnalysis()"
            class="test-button">
            GRAIN SIZE SIEVE ANALYSIS (DRY)
          </ion-button>
          
          <ion-button
            expand="block"
            size="large"
            (click)="navigateToProctorTest()"
            class="test-button">
            STANDARD PROCTOR COMPACTION TEST
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .lab-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      justify-content: center;
      max-width: 400px;
      margin: 0 auto;
    }
    
    .test-buttons {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    .test-button {
      --background: var(--ion-color-primary);
      --color: white;
      height: 80px;
      font-size: 1rem;
      font-weight: 500;
      text-align: center;
      white-space: normal;
      line-height: 1.3;
    }
  `],
  standalone: true,
  imports: [IonicModule]
})
export class GeotechnicalLabPage {
  constructor(private router: Router) {}

  navigateToSieveAnalysis() {
    this.router.navigate(['/sieve-analysis']);
  }

  navigateToProctorTest() {
    this.router.navigate(['/proctor-test']);
  }
}
