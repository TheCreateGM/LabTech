import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../components/header.component';

@Component({
  selector: 'app-proctor-test-discussion',
  template: `
    <app-header title="Standard Proctor Test - Discussion" [canGoBack]="true" backRoute="/proctor-test/calculation"></app-header>
    
    <ion-content class="ion-padding">
      <div class="content-section">
        <h3>G. DISCUSSION</h3>
        
        <p>Please provide your discussion and analysis of the Standard Proctor Compaction Test results:</p>
        
        <ion-textarea placeholder="Enter your discussion here..." rows="12" [(ngModel)]="discussion" class="discussion-textarea"></ion-textarea>
        
        <div class="suggestions-box">
          <h4>Suggested items to discuss:</h4>
          <ul>
            <li>Shape and characteristics of the compaction curve</li>
            <li>Maximum dry density and optimum moisture content values</li>
            <li>Comparison with typical values for similar soil types</li>
            <li>Factors affecting compaction behavior</li>
            <li>Quality of test results and any anomalies observed</li>
            <li>Practical implications for field compaction</li>
            <li>Relationship between laboratory and field compaction</li>
          </ul>
        </div>
      </div>
      
      <div class="navigation-buttons">
        <ion-button expand="block" (click)="navigateNext()" class="next-button">Next: Conclusion</ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .content-section { margin-bottom: 80px; }
    h3 { color: var(--ion-color-primary); font-weight: 600; margin-bottom: 16px; }
    h4 { color: var(--ion-color-secondary); font-weight: 600; margin-bottom: 8px; }
    p { line-height: 1.6; margin-bottom: 16px; }

    /* Theme-aware textarea for good contrast in dark mode */
    .discussion-textarea {
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
    .next-button { --background: var(--ion-color-success); }
  `],
  standalone: true,
  imports: [IonicModule, FormsModule, HeaderComponent]
})
export class ProctorTestDiscussionPage {
  discussion: string = '';
  constructor(private router: Router) {}
  navigateNext() { this.router.navigate(['/proctor-test/conclusion']); }
}
