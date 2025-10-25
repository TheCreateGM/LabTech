import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AppHeaderComponent } from '../../../components/app-header.component';

@Component({
  selector: 'app-sieve-analysis-theory',
  template: `
    <app-header></app-header>
    
    <ion-content class="theory-content">
      <div class="page-content">
        
        <!-- Objectives Card -->
        <ion-card class="content-card animate-fade-in-up">
          <ion-card-header>
            <div class="section-header">
              <div class="section-icon objectives-icon">
                <ion-icon name="flag-outline"></ion-icon>
              </div>
              <ion-card-title>A. Objectives</ion-card-title>
            </div>
          </ion-card-header>
          <ion-card-content>
            <div class="text-content">
              <p>To determine the <strong>grain size distribution</strong> of soils using sieve analysis method.</p>
              
              <div class="info-box info">
                <ion-icon name="information-circle"></ion-icon>
                <div>
                  <strong>Purpose:</strong> This test helps classify soil particles by size and determine their distribution characteristics.
                </div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
        
        <!-- Theory Card -->
        <ion-card class="content-card animate-fade-in-up stagger-1">
          <ion-card-header>
            <div class="section-header">
              <div class="section-icon theory-icon">
                <ion-icon name="book-outline"></ion-icon>
              </div>
              <ion-card-title>B. Theory</ion-card-title>
            </div>
          </ion-card-header>
          <ion-card-content>
            <div class="text-content">
              <p><strong>Grain size analysis</strong> is the determination of the size range of particles present in a soil, expressed as a percentage of the total dry weight. Sieve analysis is used to find the distribution of particles which are larger than <strong>0.075mm</strong> in diameter.</p>
              
              <p>The mechanical or sieve analysis is conducted by taking a weighed sample of dry soil and passing it through a stack of sieves with progressively smaller openings and weighing the soil retained on each sieve.</p>
              
              <p>The results of sieve analysis are generally presented in the form of a <strong>grain size distribution curve</strong>, plotted on semi-logarithmic paper with particle size as abscissa (log scale) and percentage finer as ordinate (arithmetic scale).</p>
            </div>
          </ion-card-content>
        </ion-card>
        
        <!-- Apparatus & Material Card -->
        <ion-card class="content-card animate-fade-in-up stagger-2">
          <ion-card-header>
            <div class="section-header">
              <div class="section-icon apparatus-icon">
                <ion-icon name="construct-outline"></ion-icon>
              </div>
              <ion-card-title>C. Apparatus & Material</ion-card-title>
            </div>
          </ion-card-header>
          <ion-card-content>
            <div class="text-content">
              <ul class="equipment-list">
                <li>
                  <ion-icon name="checkbox-outline"></ion-icon>
                  <span>A set of test sieves conforming to BS 410, with aperture sizes: 63, 37.5, 20, 14, 10, 6.3, 5, 3.35, 2, 1.18, 0.6, 0.425, 0.3, 0.212, 0.15, 0.075 mm</span>
                </li>
                <li>
                  <ion-icon name="checkbox-outline"></ion-icon>
                  <span>A balance readable to 0.1% of the sample mass</span>
                </li>
                <li>
                  <ion-icon name="checkbox-outline"></ion-icon>
                  <span>Oven for drying samples</span>
                </li>
                <li>
                  <ion-icon name="checkbox-outline"></ion-icon>
                  <span>Sample containers</span>
                </li>
                <li>
                  <ion-icon name="checkbox-outline"></ion-icon>
                  <span>Brush for cleaning sieves</span>
                </li>
                <li>
                  <ion-icon name="checkbox-outline"></ion-icon>
                  <span>Mechanical sieve shaker (if available)</span>
                </li>
              </ul>
              
              <div class="info-box warning">
                <ion-icon name="warning-outline"></ion-icon>
                <div>
                  <strong>Safety Note:</strong> Ensure all equipment is properly calibrated before starting the test.
                </div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
        
        <!-- Navigation Buttons -->
        <div class="nav-buttons animate-fade-in-up stagger-3">
          <ion-button 
            expand="block"
            size="large"
            (click)="navigateNext()"
            class="next-button">
            Next: Procedure
            <ion-icon name="arrow-forward" slot="end"></ion-icon>
          </ion-button>
        </div>
        
      </div>
    </ion-content>
  `,
  styles: [`
    .theory-content {
      --background: linear-gradient(180deg, 
        #FAFBFC 0%, 
        #F0F4FF 100%
      );
    }
    
    .content-card {
      margin-bottom: var(--lab-space-xl);
      background: var(--lab-color-surface);
      border: 1.5px solid var(--lab-color-outline);
      transition: all var(--lab-transition-base);
      
      &:hover {
        box-shadow: var(--lab-shadow-medium);
        transform: translateY(-2px);
      }
    }
    
    /* Section Header with Icon */
    .section-header {
      display: flex;
      align-items: center;
      gap: var(--lab-space-base);
    }
    
    .section-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--lab-radius-lg);
      
      ion-icon {
        font-size: 24px;
        color: white;
      }
    }
    
    .objectives-icon {
      background: linear-gradient(135deg, 
        var(--ion-color-info), 
        var(--lab-color-accent-blue)
      );
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    
    .theory-icon {
      background: linear-gradient(135deg, 
        var(--ion-color-primary), 
        var(--ion-color-secondary)
      );
      box-shadow: var(--lab-shadow-primary);
    }
    
    .apparatus-icon {
      background: linear-gradient(135deg, 
        var(--ion-color-tertiary), 
        var(--lab-color-accent-purple)
      );
      box-shadow: 0 4px 12px rgba(167, 139, 250, 0.3);
    }
    
    /* Info Boxes */
    .info-box {
      display: flex;
      gap: var(--lab-space-base);
      padding: var(--lab-space-lg);
      border-radius: var(--lab-radius-lg);
      margin: var(--lab-space-lg) 0;
      border-left: 4px solid;
      
      ion-icon {
        font-size: 24px;
        flex-shrink: 0;
        margin-top: 2px;
      }
      
      &.info {
        background: var(--lab-badge-info-bg);
        border-color: var(--ion-color-info);
        
        ion-icon {
          color: var(--ion-color-info);
        }
        
        div {
          color: var(--ion-text-color);
        }
        
        strong {
          color: var(--ion-color-info-shade);
        }
      }
      
      &.warning {
        background: var(--lab-badge-warning-bg);
        border-color: var(--ion-color-warning);
        
        ion-icon {
          color: var(--ion-color-warning);
        }
        
        div {
          color: var(--ion-text-color);
        }
        
        strong {
          color: var(--ion-color-warning-shade);
        }
      }
    }
    
    /* Equipment List */
    .equipment-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: var(--lab-space-base);
      
      li {
        display: flex;
        gap: var(--lab-space-base);
        align-items: start;
        padding: var(--lab-space-base);
        background: var(--lab-color-surface-variant);
        border-radius: var(--lab-radius-base);
        transition: all var(--lab-transition-fast);
        
        &:hover {
          background: var(--lab-glass-primary);
          transform: translateX(4px);
        }
        
        ion-icon {
          color: var(--ion-color-success);
          font-size: 20px;
          flex-shrink: 0;
          margin-top: 2px;
        }
        
        span {
          flex: 1;
          line-height: var(--lab-line-height-relaxed);
          color: var(--ion-text-color);
        }
      }
    }
    
    /* Navigation Buttons */
    .nav-buttons {
      display: flex;
      gap: var(--lab-space-base);
      margin-top: var(--lab-space-2xl);
      padding-bottom: var(--lab-space-xl);
      
      ion-button {
        flex: 1;
      }
    }
    
    .next-button {
      --background: linear-gradient(135deg, 
        var(--ion-color-primary), 
        var(--ion-color-secondary)
      );
      --box-shadow: var(--lab-shadow-primary);
      font-weight: 600;
      letter-spacing: 0.5px;
      
      &:hover {
        --box-shadow: var(--lab-shadow-medium);
        transform: translateY(-2px);
      }
      
      &:active {
        transform: translateY(0);
      }
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .section-icon {
        width: 40px;
        height: 40px;
        
        ion-icon {
          font-size: 20px;
        }
      }
      
      .info-box {
        flex-direction: column;
        
        ion-icon {
          font-size: 20px;
        }
      }
      
      .equipment-list li {
        ion-icon {
          font-size: 18px;
        }
      }
    }
    
    @media (max-width: 480px) {
      .content-card {
        margin-bottom: var(--lab-space-lg);
      }
      
      .section-header {
        flex-direction: row;
        align-items: center;
      }
      
      .nav-buttons {
        flex-direction: column;
      }
    }
  `],
  standalone: true,
  imports: [IonicModule, AppHeaderComponent]
})
export class SieveAnalysisTheoryPage {
  constructor(private router: Router) {}

  navigateNext() {
    this.router.navigate(['/tabs/sieve-analysis/procedure']);
  }
}
