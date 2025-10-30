import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../components/header.component';
import { TestDataService } from '../../../services/test-data.service';

interface SieveData {
  sieveSize: number;
  massRetained: number | null;
  massPassing: number | null;
  percentRetained: number | null;
  cumulativePercentRetained: number | null;
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
        
        <div class="input-section">
          <h4>Initial Sample Data:</h4>
          <div class="input-row">
            <label>Total mass of soil sample:</label>
            <ion-input 
              type="number"
              inputmode="decimal"
              step="any"
              placeholder="0.0" 
              [(ngModel)]="totalMass"
              (ionChange)="onTotalMassChange()"
              class="input-field">
            </ion-input>
            <span>g</span>
          </div>
        </div>
        
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Sieve Size (mm)</th>
                <th>Mass Retained (g)</th>
                <th>% Retained</th>
                <th>Cumulative % Retained</th>
                <th>% Passing</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of sieveData; let i = index" [class.has-error]="row.massRetained !== null && row.massRetained < 0">
                <td>{{ row.sieveSize }}</td>
                <td>
                  <ion-input 
                    type="number"
                    inputmode="decimal"
                    step="any"
                    placeholder="0.0"
                    [(ngModel)]="row.massRetained"
                    (ionChange)="calculateValues()">
                  </ion-input>
                </td>
                <td class="calculated-cell">
                  {{ row.percentRetained !== null ? (row.percentRetained | number:'1.2-2') : '-' }}
                </td>
                <td class="calculated-cell">
                  {{ row.cumulativePercentRetained !== null ? (row.cumulativePercentRetained | number:'1.2-2') : '-' }}
                </td>
                <td class="calculated-cell">
                  {{ row.cumulativePercentPassing !== null ? (row.cumulativePercentPassing | number:'1.2-2') : '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="calculation-summary" *ngIf="showCalculations">
          <h4>Calculation Summary</h4>
          
          <ion-card class="summary-card">
            <ion-card-content>
              <div class="summary-grid">
                <div class="summary-item">
                  <span class="label">Total Sample Mass:</span>
                  <span class="value">{{ totalMass | number:'1.2-2' }} g</span>
                </div>
                <div class="summary-item">
                  <span class="label">Total Mass Retained:</span>
                  <span class="value">{{ totalMassRetained | number:'1.2-2' }} g</span>
                </div>
                <div class="summary-item">
                  <span class="label">Losses:</span>
                  <span class="value" [class.warning]="lossPercentage > 2">
                    {{ losses | number:'1.2-2' }} g ({{ lossPercentage | number:'1.2-2' }}%)
                  </span>
                </div>
                <div class="summary-item" *ngIf="lossPercentage > 2">
                  <ion-icon name="warning" color="warning"></ion-icon>
                  <span class="warning-text">Losses exceed 2% - test accuracy may be affected</span>
                </div>
              </div>
              
              <div class="grain-classification" *ngIf="grainClassification">
                <h5>Grain Size Classification:</h5>
                <div class="classification-grid">
                  <div class="classification-item" *ngFor="let item of grainClassification">
                    <span class="class-label">{{ item.name }}:</span>
                    <span class="class-value">{{ item.percentage | number:'1.1-1' }}%</span>
                  </div>
                </div>
              </div>
            </ion-card-content>
          </ion-card>
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
    
    h4 {
      color: var(--ion-color-secondary);
      font-weight: 600;
      margin: 16px 0 12px 0;
    }
    
    h5 {
      color: var(--ion-color-tertiary);
      font-weight: 600;
      margin: 12px 0 8px 0;
      font-size: 14px;
    }
    
    .input-section {
      margin-bottom: 20px;
      padding: 16px;
      background: var(--lab-color-surface);
      border-radius: 12px;
      border: 1px solid var(--lab-color-outline);
    }
    
    .input-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .input-row label {
      flex: 1;
      font-weight: 500;
    }
    
    .input-field {
      width: 120px;
      --background: var(--ion-color-light);
      --padding: 8px;
      border-radius: 8px;
    }
    
    .table-container {
      overflow-x: auto;
      margin-bottom: 24px;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    
    .data-table th,
    .data-table td {
      border: 1px solid var(--lab-color-outline);
      padding: 6px;
      text-align: center;
    }
    
    .data-table th {
      background-color: var(--ion-color-primary);
      color: white;
      font-weight: 600;
      font-size: 10px;
    }
    
    .data-table td:first-child {
      background: var(--lab-color-surface);
      color: var(--ion-text-color);
      font-weight: 500;
    }
    
    .data-table td ion-input {
      --background: var(--ion-color-light);
      --color: var(--ion-text-color);
      --placeholder-color: var(--ion-color-medium);
      --padding: 4px;
      font-size: 11px;
      border-radius: 4px;
    }
    
    .calculated-cell {
      background: rgba(var(--ion-color-success-rgb), 0.1);
      color: var(--ion-text-color);
      font-weight: 500;
    }
    
    .has-error {
      background: rgba(var(--ion-color-danger-rgb), 0.1);
    }
    
    .calculation-summary {
      margin: 24px 0;
    }
    
    .summary-card {
      margin: 0;
    }
    
    .summary-grid {
      display: grid;
      gap: 12px;
    }
    
    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid var(--lab-color-outline);
    }
    
    .summary-item:last-child {
      border-bottom: none;
    }
    
    .summary-item .label {
      font-weight: 500;
      color: var(--ion-color-medium);
    }
    
    .summary-item .value {
      font-weight: 600;
      color: var(--ion-color-primary);
    }
    
    .summary-item .value.warning {
      color: var(--ion-color-warning);
    }
    
    .warning-text {
      color: var(--ion-color-warning);
      font-size: 12px;
      margin-left: 8px;
    }
    
    .grain-classification {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 2px solid var(--lab-color-outline);
    }
    
    .classification-grid {
      display: grid;
      gap: 8px;
      margin-top: 8px;
    }
    
    .classification-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 12px;
      background: rgba(var(--ion-color-primary-rgb), 0.05);
      border-radius: 8px;
    }
    
    .class-label {
      font-weight: 500;
    }
    
    .class-value {
      font-weight: 600;
      color: var(--ion-color-primary);
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
export class SieveAnalysisDataPage implements OnInit {
  sieveData: SieveData[] = [
    { sieveSize: 63, massRetained: null, massPassing: null, percentRetained: null, cumulativePercentRetained: null, cumulativePercentPassing: null },
    { sieveSize: 37.5, massRetained: null, massPassing: null, percentRetained: null, cumulativePercentRetained: null, cumulativePercentPassing: null },
    { sieveSize: 20, massRetained: null, massPassing: null, percentRetained: null, cumulativePercentRetained: null, cumulativePercentPassing: null },
    { sieveSize: 14, massRetained: null, massPassing: null, percentRetained: null, cumulativePercentRetained: null, cumulativePercentPassing: null },
    { sieveSize: 10, massRetained: null, massPassing: null, percentRetained: null, cumulativePercentRetained: null, cumulativePercentPassing: null },
    { sieveSize: 6.3, massRetained: null, massPassing: null, percentRetained: null, cumulativePercentRetained: null, cumulativePercentPassing: null },
    { sieveSize: 5, massRetained: null, massPassing: null, percentRetained: null, cumulativePercentRetained: null, cumulativePercentPassing: null },
    { sieveSize: 3.35, massRetained: null, massPassing: null, percentRetained: null, cumulativePercentRetained: null, cumulativePercentPassing: null },
    { sieveSize: 2, massRetained: null, massPassing: null, percentRetained: null, cumulativePercentRetained: null, cumulativePercentPassing: null },
    { sieveSize: 1.18, massRetained: null, massPassing: null, percentRetained: null, cumulativePercentRetained: null, cumulativePercentPassing: null },
    { sieveSize: 0.6, massRetained: null, massPassing: null, percentRetained: null, cumulativePercentRetained: null, cumulativePercentPassing: null },
    { sieveSize: 0.425, massRetained: null, massPassing: null, percentRetained: null, cumulativePercentRetained: null, cumulativePercentPassing: null },
    { sieveSize: 0.3, massRetained: null, massPassing: null, percentRetained: null, cumulativePercentRetained: null, cumulativePercentPassing: null },
    { sieveSize: 0.212, massRetained: null, massPassing: null, percentRetained: null, cumulativePercentRetained: null, cumulativePercentPassing: null },
    { sieveSize: 0.15, massRetained: null, massPassing: null, percentRetained: null, cumulativePercentRetained: null, cumulativePercentPassing: null },
    { sieveSize: 0.075, massRetained: null, massPassing: null, percentRetained: null, cumulativePercentRetained: null, cumulativePercentPassing: null }
  ];

  totalMass: number | null = null;
  totalMassRetained: number = 0;
  losses: number = 0;
  lossPercentage: number = 0;
  showCalculations: boolean = false;
  grainClassification: Array<{ name: string, percentage: number }> | null = null;

  constructor(
    private router: Router,
    private testDataService: TestDataService
  ) { }

  ngOnInit() {
    // Load saved data if available
    const savedData = this.testDataService.getSieveData();
    if (savedData) {
      this.sieveData = savedData.sieveData || this.sieveData;
      this.totalMass = savedData.totalMass || null;
      this.calculateValues();
    }
  }

  onTotalMassChange() {
    this.calculateValues();
  }

  /**
   * Calculate all derived values based on mass retained inputs
   * Formulas:
   * 1. % Retained = (Mass Retained / Total Mass) × 100
   * 2. Cumulative % Retained = Sum of all % retained up to current sieve
   * 3. % Passing = 100 - Cumulative % Retained
   * 4. Mass Passing = Total Mass - Cumulative Mass Retained
   */
  calculateValues() {
    if (!this.totalMass || this.totalMass <= 0) {
      this.showCalculations = false;
      return;
    }

    let cumulativeMassRetained = 0;
    let cumulativePercentRetained = 0;

    // Calculate values for each sieve
    for (let i = 0; i < this.sieveData.length; i++) {
      const row = this.sieveData[i];

      if (row.massRetained !== null && row.massRetained >= 0) {
        // Calculate percentage retained on this sieve
        row.percentRetained = (row.massRetained / this.totalMass) * 100;

        // Calculate cumulative values
        cumulativeMassRetained += row.massRetained;
        cumulativePercentRetained += row.percentRetained;

        row.cumulativePercentRetained = cumulativePercentRetained;
        row.cumulativePercentPassing = 100 - cumulativePercentRetained;

        // Calculate mass passing
        row.massPassing = this.totalMass - cumulativeMassRetained;
      } else {
        row.percentRetained = null;
        row.cumulativePercentRetained = cumulativePercentRetained;
        row.cumulativePercentPassing = 100 - cumulativePercentRetained;
        row.massPassing = this.totalMass - cumulativeMassRetained;
      }
    }

    // Calculate summary values
    this.totalMassRetained = cumulativeMassRetained;
    this.losses = this.totalMass - this.totalMassRetained;
    this.lossPercentage = (this.losses / this.totalMass) * 100;

    // Calculate grain size classification
    this.calculateGrainClassification();

    this.showCalculations = true;

    // Save data
    this.saveData();
  }

  /**
   * Classify soil based on grain size distribution
   * Gravel: > 2mm
   * Sand: 0.075mm - 2mm
   * Fines (Silt & Clay): < 0.075mm
   */
  calculateGrainClassification() {
    if (!this.totalMass) return;

    let gravelPercentage = 0;
    let sandPercentage = 0;
    let finesPercentage = 0;

    for (const row of this.sieveData) {
      if (row.massRetained !== null && row.massRetained >= 0) {
        const percentage = (row.massRetained / this.totalMass) * 100;

        if (row.sieveSize > 2) {
          gravelPercentage += percentage;
        } else if (row.sieveSize >= 0.075) {
          sandPercentage += percentage;
        } else {
          finesPercentage += percentage;
        }
      }
    }

    this.grainClassification = [
      { name: 'Gravel (> 2mm)', percentage: gravelPercentage },
      { name: 'Sand (0.075-2mm)', percentage: sandPercentage },
      { name: 'Fines (< 0.075mm)', percentage: finesPercentage }
    ];
  }

  saveData() {
    this.testDataService.saveSieveData({
      sieveData: this.sieveData,
      totalMass: this.totalMass,
      totalMassRetained: this.totalMassRetained,
      losses: this.losses,
      lossPercentage: this.lossPercentage,
      grainClassification: this.grainClassification
    });
  }

  navigateNext() {
    if (!this.totalMass || this.totalMass <= 0) {
      alert('Please enter the total mass of soil sample before proceeding.');
      return;
    }

    this.saveData();
    this.router.navigate(['/sieve-analysis/calculation']);
  }
}
