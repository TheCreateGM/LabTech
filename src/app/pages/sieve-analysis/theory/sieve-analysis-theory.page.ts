import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AppHeaderComponent } from '../../../components/app-header.component';

@Component({
  selector: 'app-sieve-analysis-theory',
  template: `
    <app-header></app-header>
    
    <ion-content class="ion-padding">
      <div class="page-content">
        <div class="text-content">
          <h2>A. OBJECTIVES</h2>
          <p>To determine the grain size distribution of soils using sieve analysis method.</p>
          
          <div class="info-box">
            <p><strong>Purpose:</strong> This test helps classify soil particles by size and determine their distribution characteristics.</p>
          </div>
          
          <h2>B. THEORY</h2>
          <p>Grain size analysis is the determination of the size range of particles present in a soil, expressed as a percentage of the total dry weight. Sieve analysis is used to find the distribution of particles which are larger than 0.075mm in diameter.</p>
          
          <p>The mechanical or sieve analysis is conducted by taking a weighed sample of dry soil and passing it through a stack of sieves with progressively smaller openings and weighing the soil retained on each sieve.</p>
          
          <p>The results of sieve analysis are generally presented in the form of a grain size distribution curve, plotted on semi-logarithmic paper with particle size as abscissa (log scale) and percentage finer as ordinate (arithmetic scale).</p>
          
          <h2>C. APPARATUS & MATERIAL</h2>
          <ul>
            <li>A set of test sieves conforming to BS 410, with aperture sizes: 63, 37.5, 20, 14, 10, 6.3, 5, 3.35, 2, 1.18, 0.6, 0.425, 0.3, 0.212, 0.15, 0.075 mm</li>
            <li>A balance readable to 0.1% of the sample mass</li>
            <li>Oven for drying samples</li>
            <li>Sample containers</li>
            <li>Brush for cleaning sieves</li>
            <li>Mechanical sieve shaker (if available)</li>
          </ul>
          
          <div class="info-box warning">
            <p><strong>Safety Note:</strong> Ensure all equipment is properly calibrated before starting the test.</p>
          </div>
        </div>
      </div>
      
      <div class="floating-nav">
        <ion-button 
          fill="solid" 
          (click)="navigateNext()"
          class="next-button">
          <ion-icon name="arrow-forward" slot="end"></ion-icon>
          Next: Procedure
        </ion-button>
      </div>
    </ion-content>
  `,
  standalone: true,
  imports: [IonicModule, AppHeaderComponent]
})
export class SieveAnalysisTheoryPage {
  constructor(private router: Router) {}

  navigateNext() {
    this.router.navigate(['/tabs/sieve-analysis/procedure']);
  }
}
