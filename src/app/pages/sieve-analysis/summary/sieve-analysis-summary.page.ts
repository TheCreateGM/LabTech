import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../components/header.component';

@Component({
  selector: 'app-sieve-analysis-summary',
  template: `
    <app-header 
      title="Grain Size Sieve Analysis - Summary" 
      [canGoBack]="true"
      backRoute="/sieve-analysis/calculation">
    </app-header>
    
    <ion-content class="ion-padding">
      <div class="content-section">
        <h3>SUMMARY</h3>
        
        <div class="summary-input-section">
          <p>Please enter your summary and observations for the Grain Size Sieve Analysis test:</p>
          
          <ion-textarea
            placeholder="Enter your summary here..."
            rows="10"
            [(ngModel)]="summary"
            class="summary-textarea">
          </ion-textarea>
          
          <div class="suggestions-box">
            <h4>Suggested items to include in summary:</h4>
            <ul>
              <li>Description of soil sample and source</li>
              <li>Initial sample mass and final masses</li>
              <li>Percentage of losses and its significance</li>
              <li>Grain size distribution characteristics</li>
              <li>Dominant particle sizes observed</li>
              <li>Classification of soil based on particle size distribution</li>
              <li>Any unusual observations during testing</li>
              <li>Quality of results and reliability</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="navigation-buttons">
        <ion-button 
          expand="block" 
          (click)="finishTest()"
          class="finish-button">
          Finish Test
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
      margin-bottom: 8px;
    }
    
    p {
      line-height: 1.6;
      margin-bottom: 16px;
    }
    
    .summary-textarea {
      /* Theme-aware input surface for good contrast in dark mode */
      --background: var(--lab-color-surface);
      --color: var(--ion-text-color);
      --placeholder-color: var(--ion-color-medium);
      border: 1px solid var(--lab-color-outline);
      border-radius: 12px;
      margin-bottom: 20px;
      --padding: 12px;
    }
    
    .suggestions-box {
      background: var(--lab-color-surface);
      color: var(--ion-text-color);
      padding: 16px;
      border-radius: 12px;
      border: 1px solid var(--lab-color-outline);
      margin-top: 16px;
      box-shadow: var(--lab-shadow-soft);
    }
    
    .suggestions-box ul {
      margin: 8px 0;
      padding-left: 20px;
    }
    
    .suggestions-box li {
      margin-bottom: 6px;
      line-height: 1.4;
    }
    
    .navigation-buttons {
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
    }
    
    .finish-button {
      --background: var(--ion-color-warning);
    }
  `],
  standalone: true,
  imports: [IonicModule, FormsModule, HeaderComponent]
})
export class SieveAnalysisSummaryPage {
  summary: string = '';

  constructor(private router: Router) {}

  finishTest() {
    this.router.navigate(['/end']);
  }
}
