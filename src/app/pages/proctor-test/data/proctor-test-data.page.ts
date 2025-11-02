import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../components/header.component';
import { TestDataService } from '../../../services/test-data.service';

interface DensityData {
  testNumber: number;
  massOfMoldBase: number | null;
  massTotal: number | null;
  massSpecimen: number | null;
  bulkDensity: number | null;
  dryDensity: number | null;
}

interface MoistureData {
  containerNumber: number;
  massContainer: number | null;
  massContainerWetSoil: number | null;
  massContainerDrySoil: number | null;
  massMoisture: number | null;
  massDrySoil: number | null;
  moistureContent: number | null;
}

@Component({
  selector: 'app-proctor-test-data',
  template: `
    <app-header 
      title="Standard Proctor Test - Data" 
      [canGoBack]="true"
      backRoute="/proctor-test/procedure">
    </app-header>
    
    <ion-content class="ion-padding">
      <div class="data-section">
        <h3>E. DATA / RESULTS</h3>
        
        <div class="input-section">
          <h4>Mould Specifications:</h4>
          <div class="input-row">
            <label>Volume of mould (V):</label>
            <ion-input 
              type="number"
              inputmode="decimal"
              step="any"
              placeholder="0.001"
              [(ngModel)]="mouldVolume"
              (ionInput)="calculateAllValues()"
              class="input-field">
            </ion-input>
            <span>m³</span>
          </div>
          <p class="hint">Standard mould volume is typically 0.001 m³ (1000 cm³)</p>
        </div>
        
        <div class="table-section">
          <h4>Dry Density / Moisture Content Relationship</h4>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th *ngFor="let test of densityData">Test {{ test.testNumber }}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Mass of mold + base (m1) kg</td>
                  <td *ngFor="let test of densityData">
                    <ion-input type="number" inputmode="decimal" step="any" placeholder="0.0" [(ngModel)]="test.massOfMoldBase" (ionInput)="calculateDensityValues(test)"></ion-input>
                  </td>
                </tr>
                <tr>
                  <td>Mass total (m2) kg</td>
                  <td *ngFor="let test of densityData">
                    <ion-input type="number" inputmode="decimal" step="any" placeholder="0.0" [(ngModel)]="test.massTotal" (ionInput)="calculateDensityValues(test)"></ion-input>
                  </td>
                </tr>
                <tr>
                  <td>Mass specimen (m2-m1) kg</td>
                  <td *ngFor="let test of densityData" class="calculated-cell">
                    {{ test.massSpecimen !== null ? (test.massSpecimen | number:'1.3-3') : '-' }}
                  </td>
                </tr>
                <tr>
                  <td>Bulk density, ρb (Mg/m³)</td>
                  <td *ngFor="let test of densityData" class="calculated-cell">
                    {{ test.bulkDensity !== null ? (test.bulkDensity | number:'1.3-3') : '-' }}
                  </td>
                </tr>
                <tr>
                  <td>Dry density, ρd (Mg/m³)</td>
                  <td *ngFor="let test of densityData" class="calculated-cell">
                    {{ test.dryDensity !== null ? (test.dryDensity | number:'1.3-3') : '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="table-section">
          <h4>Moisture Content, w</h4>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th *ngFor="let container of moistureData">Container {{ container.containerNumber }}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Mass of container (c1) g</td>
                  <td *ngFor="let container of moistureData">
                    <ion-input type="number" inputmode="decimal" step="any" placeholder="0.0" [(ngModel)]="container.massContainer" (ionInput)="calculateMoistureValues(container)"></ion-input>
                  </td>
                </tr>
                <tr>
                  <td>Mass container + wet soil (c2) g</td>
                  <td *ngFor="let container of moistureData">
                    <ion-input type="number" inputmode="decimal" step="any" placeholder="0.0" [(ngModel)]="container.massContainerWetSoil" (ionInput)="calculateMoistureValues(container)"></ion-input>
                  </td>
                </tr>
                <tr>
                  <td>Mass container + dry soil (c3) g</td>
                  <td *ngFor="let container of moistureData">
                    <ion-input type="number" inputmode="decimal" step="any" placeholder="0.0" [(ngModel)]="container.massContainerDrySoil" (ionInput)="calculateMoistureValues(container)"></ion-input>
                  </td>
                </tr>
                <tr>
                  <td>Mass moisture (c2-c3) g</td>
                  <td *ngFor="let container of moistureData" class="calculated-cell">
                    {{ container.massMoisture !== null ? (container.massMoisture | number:'1.2-2') : '-' }}
                  </td>
                </tr>
                <tr>
                  <td>Mass dry soil (c3-c1) g</td>
                  <td *ngFor="let container of moistureData" class="calculated-cell">
                    {{ container.massDrySoil !== null ? (container.massDrySoil | number:'1.2-2') : '-' }}
                  </td>
                </tr>
                <tr>
                  <td>Moisture content, w (%)</td>
                  <td *ngFor="let container of moistureData" class="calculated-cell">
                    {{ container.moistureContent !== null ? (container.moistureContent | number:'1.2-2') : '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="calculation-summary" *ngIf="showSummary">
          <h4>Compaction Test Summary</h4>
          
          <ion-card class="summary-card">
            <ion-card-content>
              <div class="summary-grid">
                <div class="summary-item" *ngIf="maxDryDensity !== null">
                  <span class="label">Maximum Dry Density:</span>
                  <span class="value highlight">{{ maxDryDensity | number:'1.3-3' }} Mg/m³</span>
                </div>
                <div class="summary-item" *ngIf="optimumMoistureContent !== null">
                  <span class="label">Optimum Moisture Content:</span>
                  <span class="value highlight">{{ optimumMoistureContent | number:'1.2-2' }}%</span>
                </div>
                <div class="summary-item">
                  <span class="label">Number of Tests Completed:</span>
                  <span class="value">{{ completedTests }} / 5</span>
                </div>
              </div>
              
              <div class="info-box" *ngIf="completedTests >= 3">
                <ion-icon name="information-circle"></ion-icon>
                <span>Sufficient data points collected for compaction curve analysis</span>
              </div>
              <div class="warning-box" *ngIf="completedTests < 3">
                <ion-icon name="warning"></ion-icon>
                <span>At least 3 test points recommended for accurate results</span>
              </div>
            </ion-card-content>
          </ion-card>
        </div>
      </div>
      
      <div class="navigation-buttons">
        <ion-button expand="block" (click)="navigateNext()" class="next-button">
          Next: Calculation
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .data-section { margin-bottom: 80px; }
    h3 { color: var(--ion-color-primary); font-weight: 600; margin-bottom: 16px; }
    h4 { color: var(--ion-color-secondary); font-weight: 600; margin: 16px 0 12px 0; }
    
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
      margin-bottom: 8px;
    }
    
    .input-row label {
      flex: 1;
      font-weight: 500;
    }
    
    .input-field {
      width: 100px;
      --background: var(--ion-color-light);
      --padding: 8px;
      border-radius: 8px;
    }
    
    .hint {
      font-size: 12px;
      color: var(--ion-color-medium);
      margin-top: 4px;
      font-style: italic;
    }
    
    .table-section { margin-bottom: 24px; }
    .table-container { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .data-table th, .data-table td { border: 1px solid var(--lab-color-outline); padding: 8px; text-align: center; }
    .data-table th { background-color: var(--ion-color-primary); color: white; font-weight: 600; font-size: 11px; }
    .data-table td:first-child { 
      background: var(--lab-color-surface); 
      color: var(--ion-text-color); 
      font-weight: 500; 
      text-align: left; 
      white-space: nowrap;
      font-size: 12px;
    }
    .data-table td ion-input { 
      --padding: 8px; 
      font-size: 14px; 
      --background: var(--ion-color-light); 
      --color: var(--ion-text-color); 
      --placeholder-color: var(--ion-color-medium); 
      border-radius: 4px;
      min-height: 40px;
    }
    
    .calculated-cell {
      background: rgba(var(--ion-color-success-rgb), 0.1);
      color: var(--ion-text-color);
      font-weight: 600;
      font-size: 12px;
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
    
    .summary-item .value.highlight {
      color: var(--ion-color-success);
      font-size: 16px;
    }
    
    .info-box, .warning-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      border-radius: 8px;
      margin-top: 12px;
      font-size: 13px;
    }
    
    .info-box {
      background: rgba(var(--ion-color-primary-rgb), 0.1);
      color: var(--ion-color-primary);
    }
    
    .warning-box {
      background: rgba(var(--ion-color-warning-rgb), 0.1);
      color: var(--ion-color-warning);
    }
    
    .navigation-buttons { position: fixed; bottom: 20px; left: 20px; right: 20px; }
    .next-button { --background: var(--ion-color-success); }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, HeaderComponent]
})
export class ProctorTestDataPage implements OnInit {
  densityData: DensityData[] = Array.from({length: 5}, (_, i) => ({
    testNumber: i + 1,
    massOfMoldBase: null,
    massTotal: null,
    massSpecimen: null,
    bulkDensity: null,
    dryDensity: null
  }));

  moistureData: MoistureData[] = Array.from({length: 5}, (_, i) => ({
    containerNumber: i + 1,
    massContainer: null,
    massContainerWetSoil: null,
    massContainerDrySoil: null,
    massMoisture: null,
    massDrySoil: null,
    moistureContent: null
  }));

  mouldVolume: number = 0.001; // Standard mould volume in m³
  maxDryDensity: number | null = null;
  optimumMoistureContent: number | null = null;
  completedTests: number = 0;
  showSummary: boolean = false;

  constructor(
    private router: Router,
    private testDataService: TestDataService
  ) {}

  ngOnInit() {
    // Load saved data if available
    const savedData = this.testDataService.getProctorData();
    if (savedData) {
      this.densityData = savedData.densityData || this.densityData;
      this.moistureData = savedData.moistureData || this.moistureData;
      this.mouldVolume = savedData.mouldVolume || 0.001;
      this.calculateAllValues();
    }
  }

  /**
   * Calculate density values for a specific test
   * Formulas:
   * 1. Mass Specimen = m2 - m1
   * 2. Bulk Density (ρb) = Mass Specimen / Volume
   * 3. Dry Density (ρd) = ρb / (1 + w/100)
   */
  calculateDensityValues(test: DensityData) {
    // Convert string inputs to numbers if needed
    const m1 = test.massOfMoldBase !== null && test.massOfMoldBase !== undefined ? 
      (typeof test.massOfMoldBase === 'string' ? parseFloat(test.massOfMoldBase) : test.massOfMoldBase) : null;
    const m2 = test.massTotal !== null && test.massTotal !== undefined ? 
      (typeof test.massTotal === 'string' ? parseFloat(test.massTotal) : test.massTotal) : null;
    
    // Update the values back to the object
    test.massOfMoldBase = m1;
    test.massTotal = m2;
    
    // Check if we have valid numbers
    if (m1 !== null && m2 !== null && !isNaN(m1) && !isNaN(m2) && m1 >= 0 && m2 > m1) {
      // Calculate mass of specimen
      test.massSpecimen = m2 - m1;
      
      // Calculate bulk density (ρb = mass / volume)
      const volume = typeof this.mouldVolume === 'string' ? parseFloat(this.mouldVolume) : this.mouldVolume;
      if (volume > 0) {
        test.bulkDensity = test.massSpecimen / volume;
        
        // Calculate dry density if moisture content is available
        const moistureContent = this.moistureData[test.testNumber - 1]?.moistureContent;
        if (moistureContent !== null && moistureContent !== undefined && !isNaN(moistureContent)) {
          test.dryDensity = test.bulkDensity / (1 + moistureContent / 100);
        } else {
          // If no moisture content yet, set dry density to null
          test.dryDensity = null;
        }
      }
    } else {
      test.massSpecimen = null;
      test.bulkDensity = null;
      test.dryDensity = null;
    }
    
    this.updateSummary();
    this.saveData();
  }

  /**
   * Calculate moisture content values
   * Formulas:
   * 1. Mass Moisture = c2 - c3
   * 2. Mass Dry Soil = c3 - c1
   * 3. Moisture Content (w) = [(c2 - c3) / (c3 - c1)] × 100
   */
  calculateMoistureValues(container: MoistureData) {
    // Convert string inputs to numbers if needed
    const c1 = container.massContainer !== null && container.massContainer !== undefined ? 
      (typeof container.massContainer === 'string' ? parseFloat(container.massContainer) : container.massContainer) : null;
    const c2 = container.massContainerWetSoil !== null && container.massContainerWetSoil !== undefined ? 
      (typeof container.massContainerWetSoil === 'string' ? parseFloat(container.massContainerWetSoil) : container.massContainerWetSoil) : null;
    const c3 = container.massContainerDrySoil !== null && container.massContainerDrySoil !== undefined ? 
      (typeof container.massContainerDrySoil === 'string' ? parseFloat(container.massContainerDrySoil) : container.massContainerDrySoil) : null;
    
    // Update the values back to the object
    container.massContainer = c1;
    container.massContainerWetSoil = c2;
    container.massContainerDrySoil = c3;
    
    // Check if all required values are present and valid
    if (c1 !== null && c2 !== null && c3 !== null && 
        !isNaN(c1) && !isNaN(c2) && !isNaN(c3)) {
      
      // Calculate mass of moisture (c2 - c3)
      container.massMoisture = c2 - c3;
      
      // Calculate mass of dry soil (c3 - c1)
      container.massDrySoil = c3 - c1;
      
      // Calculate moisture content only if mass of dry soil is positive
      if (container.massDrySoil > 0 && container.massMoisture >= 0) {
        container.moistureContent = (container.massMoisture / container.massDrySoil) * 100;
        
        // Update corresponding dry density
        const densityTest = this.densityData[container.containerNumber - 1];
        if (densityTest && densityTest.bulkDensity !== null && !isNaN(densityTest.bulkDensity)) {
          densityTest.dryDensity = densityTest.bulkDensity / (1 + container.moistureContent / 100);
        }
      } else {
        container.moistureContent = null;
      }
    } else {
      // Reset calculated values if inputs are incomplete
      container.massMoisture = null;
      container.massDrySoil = null;
      container.moistureContent = null;
    }
    
    this.updateSummary();
    this.saveData();
  }

  calculateAllValues() {
    // Recalculate all density values
    this.densityData.forEach(test => this.calculateDensityValues(test));
    
    // Recalculate all moisture values
    this.moistureData.forEach(container => this.calculateMoistureValues(container));
    
    this.updateSummary();
  }

  /**
   * Update summary statistics
   * Find maximum dry density and corresponding optimum moisture content
   */
  updateSummary() {
    // Count completed tests
    this.completedTests = this.densityData.filter(test => 
      test.dryDensity !== null && 
      this.moistureData[test.testNumber - 1]?.moistureContent !== null
    ).length;
    
    if (this.completedTests > 0) {
      this.showSummary = true;
      
      // Find maximum dry density
      let maxDensity = -Infinity;
      let maxDensityIndex = -1;
      
      this.densityData.forEach((test, index) => {
        if (test.dryDensity !== null && test.dryDensity > maxDensity) {
          maxDensity = test.dryDensity;
          maxDensityIndex = index;
        }
      });
      
      if (maxDensityIndex >= 0) {
        this.maxDryDensity = maxDensity;
        this.optimumMoistureContent = this.moistureData[maxDensityIndex]?.moistureContent || null;
      }
    } else {
      this.showSummary = false;
      this.maxDryDensity = null;
      this.optimumMoistureContent = null;
    }
  }

  saveData() {
    this.testDataService.saveProctorData({
      densityData: this.densityData,
      moistureData: this.moistureData,
      mouldVolume: this.mouldVolume,
      maxDryDensity: this.maxDryDensity,
      optimumMoistureContent: this.optimumMoistureContent,
      completedTests: this.completedTests
    });
  }

  navigateNext() {
    // Convert mould volume to number if it's a string
    if (typeof this.mouldVolume === 'string') {
      this.mouldVolume = parseFloat(this.mouldVolume as any) || 0.001;
    }
    
    // Validate mould volume
    if (!this.mouldVolume || this.mouldVolume <= 0) {
      alert('Please enter a valid Volume of mould (V).\n\nStandard mould volume is typically 0.001 m³ (1000 cm³)');
      return;
    }
    
    // Check if at least one test has basic data filled in
    const hasAnyTestData = this.densityData.some(test => {
      const m1 = test.massOfMoldBase !== null && test.massOfMoldBase !== undefined && String(test.massOfMoldBase).trim() !== '';
      const m2 = test.massTotal !== null && test.massTotal !== undefined && String(test.massTotal).trim() !== '';
      return m1 && m2;
    });
    
    const hasAnyMoistureData = this.moistureData.some(container => {
      const c1 = container.massContainer !== null && container.massContainer !== undefined && String(container.massContainer).trim() !== '';
      const c2 = container.massContainerWetSoil !== null && container.massContainerWetSoil !== undefined && String(container.massContainerWetSoil).trim() !== '';
      const c3 = container.massContainerDrySoil !== null && container.massContainerDrySoil !== undefined && String(container.massContainerDrySoil).trim() !== '';
      return c1 && c2 && c3;
    });
    
    if (!hasAnyTestData || !hasAnyMoistureData) {
      alert('Please complete at least one test before proceeding.\n\nTo complete a test, you need to:\n1. Fill in Mass of mold + base (m1)\n2. Fill in Mass total (m2)\n3. Fill in all three container masses (c1, c2, c3)\n\nThis will calculate the dry density and moisture content for that test.');
      return;
    }
    
    this.saveData();
    this.router.navigate(['/proctor-test/calculation']);
  }
}
