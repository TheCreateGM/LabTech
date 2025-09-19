import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../components/header.component';

interface SieveData {
  sieveSize: number;
  massRetained: number | null;
  massPassing: number | null;
  cumulativePercentPassing: number | null;
}

@Component({
  selector: 'app-sieve-analysis-data',
  template: `
    <app-header 
      title="Grain Size Sieve Analysis - Data" 
      [canGoBack]="true"
      backRoute="/sieve-analysis/procedure">
    </app-header>
    
    <ion-content class="ion-padding">
      <div class="data-section">
        <h3>E. DATA / RESULTS</h3>
        
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>BS test sieve size (mm)</th>
                <th>Mass retained (g)</th>
                <th>Mass Passing (g)</th>
                <th>Cumulative % Passing</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of sieveData; let i = index">
                <td>{{ row.sieveSize }}</td>
                <td>
                  <ion-input 
                    type="number"
                    inputmode="decimal"
                    step="any"
                    placeholder="0.0"
                    [(ngModel)]="row.massRetained"
                    (ionInput)="calculateValues(i)">
                  </ion-input>
                </td>
                <td>
                  <ion-input 
                    type="number"
                    inputmode="decimal"
                    step="any"
                    placeholder="0.0"
                    [(ngModel)]="row.massPassing">
                  </ion-input>
                </td>
                <td>
                  <ion-input 
                    type="number"
                    inputmode="decimal"
                    step="any"
                    placeholder="0.0"
                    [(ngModel)]="row.cumulativePercentPassing">
                  </ion-input>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="summary-section">
          <h4>Summary Data:</h4>
          <div class="summary-row">
            <label>Total mass of soil:</label>
            <ion-input 
              type="number"
              inputmode="decimal"
              step="any"
              placeholder="0.0" 
              [(ngModel)]="totalMass"
              class="summary-input">
            </ion-input>
            <span>g</span>
          </div>
          <div class="summary-row">
            <label>Total mass after sieving:</label>
            <ion-input 
              type="number"
              inputmode="decimal"
              step="any"
              placeholder="0.0" 
              [(ngModel)]="totalMassAfterSieving"
              class="summary-input">
            </ion-input>
            <span>g</span>
          </div>
          <div class="summary-row">
            <label>Losses:</label>
            <ion-input 
              type="number"
              inputmode="decimal"
              step="any"
              placeholder="0.0" 
              [(ngModel)]="losses"
              class="summary-input">
            </ion-input>
            <span>g</span>
          </div>
        </div>
      </div>
      
      <div class="navigation-buttons">
        <ion-button 
          expand="block" 
          (click)="navigateNext()"
          class="next-button">
          Next: Calculation
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .data-section {
      margin-bottom: 80px;
    }
    
    h3 {
      color: var(--ion-color-primary);
      font-weight: 600;
      margin-bottom: 16px;
    }
    
    .table-container {
      overflow-x: auto;
      margin-bottom: 24px;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    
    .data-table th,
    .data-table td {
      border: 1px solid var(--lab-color-outline);
      padding: 8px;
      text-align: center;
    }
    
    .data-table th {
      background-color: var(--ion-color-primary);
      color: white;
      font-weight: 600;
    }
    
    /* Ensure inputs are readable and focusable in dark mode */
    .data-table td ion-input {
      --background: var(--lab-color-surface);
      --color: var(--ion-text-color);
      --placeholder-color: var(--ion-color-medium);
      --padding: 6px;
      font-size: 12px;
      border-radius: var(--lab-radius-lg);
      width: 100%;
    }

    /* Make first column (labels) use surface for contrast */
    .data-table td:first-child {
      background: var(--lab-color-surface);
      color: var(--ion-text-color);
      font-weight: 500;
      text-align: left;
      white-space: nowrap;
    }
    
    .summary-section {
      margin-top: 24px;
    }
    
    .summary-section h4 {
      color: var(--ion-color-primary);
      font-weight: 600;
      margin-bottom: 12px;
    }
    
    .summary-row {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      gap: 8px;
    }
    
    .summary-row label {
      flex: 1;
      font-weight: 500;
    }
    
    .summary-input {
      width: 100px;
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
  imports: [CommonModule, IonicModule, FormsModule, HeaderComponent]
})
export class SieveAnalysisDataPage {
  sieveData: SieveData[] = [
    { sieveSize: 63, massRetained: null, massPassing: null, cumulativePercentPassing: null },
    { sieveSize: 37.5, massRetained: null, massPassing: null, cumulativePercentPassing: null },
    { sieveSize: 20, massRetained: null, massPassing: null, cumulativePercentPassing: null },
    { sieveSize: 14, massRetained: null, massPassing: null, cumulativePercentPassing: null },
    { sieveSize: 10, massRetained: null, massPassing: null, cumulativePercentPassing: null },
    { sieveSize: 6.3, massRetained: null, massPassing: null, cumulativePercentPassing: null },
    { sieveSize: 5, massRetained: null, massPassing: null, cumulativePercentPassing: null },
    { sieveSize: 3.35, massRetained: null, massPassing: null, cumulativePercentPassing: null },
    { sieveSize: 2, massRetained: null, massPassing: null, cumulativePercentPassing: null },
    { sieveSize: 1.18, massRetained: null, massPassing: null, cumulativePercentPassing: null },
    { sieveSize: 0.6, massRetained: null, massPassing: null, cumulativePercentPassing: null },
    { sieveSize: 0.425, massRetained: null, massPassing: null, cumulativePercentPassing: null },
    { sieveSize: 0.3, massRetained: null, massPassing: null, cumulativePercentPassing: null },
    { sieveSize: 0.212, massRetained: null, massPassing: null, cumulativePercentPassing: null },
    { sieveSize: 0.15, massRetained: null, massPassing: null, cumulativePercentPassing: null },
    { sieveSize: 0.075, massRetained: null, massPassing: null, cumulativePercentPassing: null }
  ];

  totalMass: number | null = null;
  totalMassAfterSieving: number | null = null;
  losses: number | null = null;

  constructor(private router: Router) {}

  calculateValues(index: number) {
    // Auto-calculate mass passing and cumulative percentage if possible
    // This would involve more complex calculations based on all previous values
    // For now, we'll leave this for manual entry
  }

  navigateNext() {
    this.router.navigate(['/sieve-analysis/calculation']);
  }
}
