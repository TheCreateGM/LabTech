import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HeaderComponent } from '../../../components/header.component';

@Component({
  selector: 'app-proctor-test-calculation',
  template: `
    <app-header title="Standard Proctor Test - Calculation" [canGoBack]="true" backRoute="/proctor-test/data"></app-header>
    
    <ion-content class="ion-padding">
      <div class="content-section">
        <h3>F. CALCULATION</h3>
        
        <div class="calculation-section">
          <h4>Dry Density Calculation:</h4>
          <div class="formula-box">
            <p><strong>ρd = ρb / (1 + w/100)</strong></p>
            <p>Where:</p>
            <ul>
              <li>ρd = Dry density (Mg/m³)</li>
              <li>ρb = Bulk density (Mg/m³)</li>
              <li>w = Moisture content (%)</li>
            </ul>
          </div>
          
          <h4>Bulk Density Calculation:</h4>
          <div class="formula-box">
            <p><strong>ρb = (m2 - m1) / V</strong></p>
            <p>Where:</p>
            <ul>
              <li>m1 = Mass of mould + base plate (kg)</li>
              <li>m2 = Mass of mould + base plate + compacted specimen (kg)</li>
              <li>V = Volume of mould (m³)</li>
            </ul>
          </div>
          
          <h4>Moisture Content Calculation:</h4>
          <div class="formula-box">
            <p><strong>w = [(c2 - c3) / (c3 - c1)] × 100</strong></p>
            <p>Where:</p>
            <ul>
              <li>c1 = Mass of container (g)</li>
              <li>c2 = Mass of container + wet soil (g)</li>
              <li>c3 = Mass of container + dry soil (g)</li>
            </ul>
          </div>
          
          <div class="note-box">
            <p><strong>Note:</strong> Plot the dry density vs moisture content curve to determine the maximum dry density and optimum moisture content.</p>
          </div>
        </div>
      </div>
      
      <div class="navigation-buttons">
        <ion-button expand="block" (click)="navigateNext()" class="next-button">Next: Discussion</ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .content-section { margin-bottom: 80px; }
    h3 { color: var(--ion-color-primary); font-weight: 600; margin-bottom: 16px; }
    h4 { color: var(--ion-color-secondary); font-weight: 600; margin-top: 20px; margin-bottom: 8px; }
    .formula-box {
      /* Theme-aware surface for readability in dark mode */
      background: var(--lab-color-surface);
      border: 1px solid var(--lab-color-outline);
      color: var(--ion-text-color);
      padding: 16px;
      border-radius: 12px;
      margin: 12px 0;
      box-shadow: var(--lab-shadow-soft);
    }
    .formula-box p { margin-bottom: 8px; }
    .formula-box ul { margin: 8px 0; padding-left: 20px; }
    .formula-box li { margin-bottom: 4px; }
    .note-box {
      /* Subtle primary-tinted background with good contrast on dark */
      background: rgba(var(--ion-color-primary-rgb), 0.08);
      color: var(--ion-text-color);
      padding: 16px;
      border-radius: 12px;
      border: 1px solid var(--lab-color-outline);
      border-left: 4px solid var(--ion-color-primary);
      margin: 16px 0;
    }
    .navigation-buttons { position: fixed; bottom: 20px; left: 20px; right: 20px; }
    .next-button { --background: var(--ion-color-success); }
  `],
  standalone: true,
  imports: [IonicModule, HeaderComponent]
})
export class ProctorTestCalculationPage {
  constructor(private router: Router) {}
  navigateNext() { this.router.navigate(['/proctor-test/discussion']); }
}
