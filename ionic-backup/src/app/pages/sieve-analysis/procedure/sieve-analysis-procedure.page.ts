import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HeaderComponent } from '../../../components/header.component';

@Component({
  selector: 'app-sieve-analysis-procedure',
  template: `
    <app-header 
      title="Grain Size Sieve Analysis - Procedure" 
      [canGoBack]="true"
      backRoute="/sieve-analysis/theory">
    </app-header>
    
    <ion-content class="ion-padding">
      <div class="content-section">
        <h3>D. PROCEDURE</h3>
        
        <ol class="procedure-list">
          <li>Obtain a representative sample of the soil to be tested. The minimum mass of sample should be in accordance with BS 1377.</li>
          
          <li>Dry the soil sample in an oven at 105-110°C until constant mass is achieved. Allow the sample to cool to room temperature.</li>
          
          <li>Weigh the total mass of the dried soil sample and record it.</li>
          
          <li>Select appropriate sieves for the analysis. Arrange the sieves in descending order of aperture size, with the largest aperture sieve at the top.</li>
          
          <li>Place the weighed soil sample on the top sieve. Fit the lid on the top sieve and place the receiver pan at the bottom.</li>
          
          <li>If using a mechanical sieve shaker, secure the stack of sieves and shake for 10-15 minutes. If sieving manually, shake each sieve individually with a to-and-fro and rotary motion.</li>
          
          <li>Remove each sieve from the stack and weigh the soil retained on each sieve. Record these masses. Clean the sieves thoroughly after use.</li>
        </ol>
      </div>
      
      <div class="navigation-buttons">
        <ion-button 
          expand="block" 
          (click)="navigateNext()"
          class="next-button">
          Next: Data Entry
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
    
    .procedure-list {
      padding-left: 20px;
    }
    
    .procedure-list li {
      margin-bottom: 16px;
      line-height: 1.6;
      text-align: justify;
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
export class SieveAnalysisProcedurePage {
  constructor(private router: Router) {}

  navigateNext() {
    this.router.navigate(['/sieve-analysis/data']);
  }
}
