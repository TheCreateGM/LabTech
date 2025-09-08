import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../components/header.component';

@Component({
  selector: 'app-proctor-test-conclusion',
  template: `
    <app-header title="Standard Proctor Test - Conclusion" [canGoBack]="true" backRoute="/proctor-test/discussion"></app-header>
    
    <ion-content class="ion-padding">
      <div class="content-section">
        <h3>H. CONCLUSION</h3>
        
        <p>Please provide your conclusion based on the Standard Proctor Compaction Test results:</p>
        
        <ion-textarea placeholder="Enter your conclusion here..." rows="10" [(ngModel)]="conclusion" class="conclusion-textarea"></ion-textarea>
        
        <div class="suggestions-box">
          <h4>Suggested items to conclude:</h4>
          <ul>
            <li>State the maximum dry density and optimum moisture content</li>
            <li>Assess achievement of test objectives</li>
            <li>Summarize key findings</li>
            <li>Recommendations for practical applications</li>
            <li>Limitations of the test results</li>
          </ul>
        </div>
      </div>
      
      <div class="navigation-buttons">
        <ion-button expand="block" (click)="finishTest()" class="finish-button">Finish Test</ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .content-section { margin-bottom: 80px; }
    h3 { color: var(--ion-color-primary); font-weight: 600; margin-bottom: 16px; }
    h4 { color: var(--ion-color-secondary); font-weight: 600; margin-bottom: 8px; }
    p { line-height: 1.6; margin-bottom: 16px; }

    /* Theme-aware textarea for good contrast in dark mode */
    .conclusion-textarea {
      --background: var(--lab-color-surface);
      --color: var(--ion-text-color);
      --placeholder-color: var(--ion-color-medium);
      border: 1px solid var(--lab-color-outline);
      border-radius: 12px;
      margin-bottom: 20px;
      --padding: 12px;
    }

    /* Theme-aware suggestions box surface */
    .suggestions-box {
      background: var(--lab-color-surface);
      color: var(--ion-text-color);
      padding: 16px;
      border-radius: 12px;
      border: 1px solid var(--lab-color-outline);
      margin-top: 16px;
      box-shadow: var(--lab-shadow-soft);
    }
    .suggestions-box ul { margin: 8px 0; padding-left: 20px; }
    .suggestions-box li { margin-bottom: 6px; line-height: 1.4; }
    .navigation-buttons { position: fixed; bottom: 20px; left: 20px; right: 20px; }
    .finish-button { --background: var(--ion-color-warning); }
  `],
  standalone: true,
  imports: [IonicModule, FormsModule, HeaderComponent]
})
export class ProctorTestConclusionPage {
  conclusion: string = '';
  constructor(private router: Router) {}
  finishTest() { this.router.navigate(['/end']); }
}
