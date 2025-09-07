import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HeaderComponent } from '../../../components/header.component';

@Component({
  selector: 'app-proctor-test-procedure',
  template: `
    <app-header 
      title="Standard Proctor Compaction Test - Procedure" 
      [canGoBack]="true"
      backRoute="/proctor-test/theory">
    </app-header>
    
    <ion-content class="ion-padding">
      <div class="content-section">
        <h3>D. PROCEDURE</h3>
        
        <ol class="procedure-list">
          <li>Take approximately 3 kg of air-dried soil passing the 20 mm test sieve. If required, break down larger particles using a wooden rammer.</li>
          
          <li>Add water to the soil to give a moisture content of approximately 4% below the expected optimum moisture content. Mix thoroughly.</li>
          
          <li>Determine and record the mass of the clean, dry compaction mould with base plate (m1).</li>
          
          <li>Attach the extension collar to the mould. Place the mould on a solid foundation.</li>
          
          <li>Compact the moist soil in the mould in three equal layers, each layer receiving 25 blows from the standard rammer dropped from a height of 305 mm.</li>
          
          <li>Remove the extension collar and carefully trim the compacted soil level with the top of the mould using a straight edge.</li>
          
          <li>Determine and record the mass of the mould, base plate and compacted soil (m2).</li>
          
          <li>Remove the compacted soil from the mould. Take representative samples for moisture content determination.</li>
          
          <li>Break up the remainder of the compacted soil, add more water (about 2% increase), mix thoroughly and repeat the compaction process.</li>
          
          <li>Repeat the entire process for at least 5 different moisture contents to establish the complete compaction curve, ensuring adequate points on both sides of the optimum moisture content.</li>
        </ol>
        
        <div class="formula-section">
          <h4>Volume Calculation:</h4>
          <div class="formula-box">
            <p><strong>V = π × (D/2)² × H</strong></p>
            <p>Where:</p>
            <ul>
              <li>V = Volume of mould (cm³)</li>
              <li>D = Internal diameter of mould (cm)</li>
              <li>H = Height of mould (cm)</li>
            </ul>
          </div>
        </div>
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
    
    h4 {
      color: var(--ion-color-secondary);
      font-weight: 600;
      margin-top: 20px;
      margin-bottom: 12px;
    }
    
    .procedure-list {
      padding-left: 20px;
    }
    
    .procedure-list li {
      margin-bottom: 16px;
      line-height: 1.6;
      text-align: justify;
    }
    
    .formula-section {
      margin-top: 24px;
    }
    
    .formula-box {
      background-color: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin: 12px 0;
    }
    
    .formula-box p {
      margin-bottom: 8px;
    }
    
    .formula-box ul {
      margin: 8px 0;
      padding-left: 20px;
    }
    
    .formula-box li {
      margin-bottom: 4px;
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
export class ProctorTestProcedurePage {
  constructor(private router: Router) {}

  navigateNext() {
    this.router.navigate(['/proctor-test/data']);
  }
}
