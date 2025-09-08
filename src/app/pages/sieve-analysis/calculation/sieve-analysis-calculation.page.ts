import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HeaderComponent } from '../../../components/header.component';

@Component({
  selector: 'app-sieve-analysis-calculation',
  template: `
    <app-header 
      title="Grain Size Sieve Analysis - Calculation" 
      [canGoBack]="true"
      backRoute="/sieve-analysis/data">
    </app-header>
    
    <ion-content class="ion-padding">
      <div class="content-section">
        <h3>F. CALCULATION</h3>
        
        <div class="calculation-steps">
          <h4>i. Mass of soil retained on each sieve</h4>
          <p>Record the mass of soil retained on each sieve directly from weighing.</p>
          
          <h4>ii. Mass of soil passing each sieve</h4>
          <p>Mass passing = Total initial mass - Cumulative mass retained on all previous sieves</p>
          
          <h4>iii. Percentage of soil retained on each sieve</h4>
          <p>% Retained = (Mass retained on sieve / Total initial mass) × 100</p>
          
          <h4>iv. Cumulative percentage of soil passing each sieve</h4>
          <p>Cumulative % Passing = 100 - Cumulative % Retained</p>
          
          <div class="formula-box">
            <p><strong>Where:</strong></p>
            <ul>
              <li>Total initial mass = Mass of dry soil sample before sieving</li>
              <li>Cumulative % Retained = Sum of % retained on current sieve and all larger sieves</li>
              <li>Losses = Total initial mass - Total mass after sieving</li>
              <li>% Losses = (Losses / Total initial mass) × 100</li>
            </ul>
          </div>
          
          <div class="note-box">
            <p><strong>Note:</strong> The percentage of losses should not exceed 2% for accurate results. If losses are higher, the test should be repeated.</p>
          </div>
        </div>
      </div>
      
      <div class="navigation-buttons">
        <ion-button 
          expand="block" 
          (click)="navigateNext()"
          class="next-button">
          Next: Summary
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .content-section {
      margin-bottom: 80px;
    }
    
    h3 {
      color: var(--ion-color-primary);
      font-weight: 600;
      margin-bottom: 16px;
    }
    
    h4 {
      color: var(--ion-color-secondary);
      font-weight: 600;
      margin-top: 20px;
      margin-bottom: 8px;
    }
    
    p {
      line-height: 1.6;
      margin-bottom: 12px;
      text-align: justify;
    }
    
    .formula-box {
      /* Use theme-aware surface so it looks good in both light and dark modes */
      background: var(--lab-color-surface);
      border: 1px solid var(--lab-color-outline);
      color: var(--ion-text-color);
      padding: 16px;
      border-radius: 12px;
      margin: 16px 0;
      box-shadow: var(--lab-shadow-soft);
    }
    
    .formula-box ul {
      margin: 8px 0;
      padding-left: 20px;
    }
    
    .formula-box li {
      margin-bottom: 4px;
    }
    
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
    
    .navigation-buttons {
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
    }
    
    .next-button {
      --background: var(--ion-color-success);
    }
  `],
  standalone: true,
  imports: [IonicModule, HeaderComponent]
})
export class SieveAnalysisCalculationPage {
  constructor(private router: Router) {}

  navigateNext() {
    this.router.navigate(['/sieve-analysis/summary']);
  }
}
