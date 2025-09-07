import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../components/header.component';

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
                    <ion-input type="number" placeholder="0.0" [(ngModel)]="test.massOfMoldBase"></ion-input>
                  </td>
                </tr>
                <tr>
                  <td>Mass total (m2) kg</td>
                  <td *ngFor="let test of densityData">
                    <ion-input type="number" placeholder="0.0" [(ngModel)]="test.massTotal"></ion-input>
                  </td>
                </tr>
                <tr>
                  <td>Mass specimen (m2-m1) kg</td>
                  <td *ngFor="let test of densityData">
                    <ion-input type="number" placeholder="0.0" [(ngModel)]="test.massSpecimen"></ion-input>
                  </td>
                </tr>
                <tr>
                  <td>Bulk density, ρb</td>
                  <td *ngFor="let test of densityData">
                    <ion-input type="number" placeholder="0.0" [(ngModel)]="test.bulkDensity"></ion-input>
                  </td>
                </tr>
                <tr>
                  <td>Dry density, ρd</td>
                  <td *ngFor="let test of densityData">
                    <ion-input type="number" placeholder="0.0" [(ngModel)]="test.dryDensity"></ion-input>
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
                    <ion-input type="number" placeholder="0.0" [(ngModel)]="container.massContainer"></ion-input>
                  </td>
                </tr>
                <tr>
                  <td>Mass container + wet soil (c2) g</td>
                  <td *ngFor="let container of moistureData">
                    <ion-input type="number" placeholder="0.0" [(ngModel)]="container.massContainerWetSoil"></ion-input>
                  </td>
                </tr>
                <tr>
                  <td>Mass container + dry soil (c3) g</td>
                  <td *ngFor="let container of moistureData">
                    <ion-input type="number" placeholder="0.0" [(ngModel)]="container.massContainerDrySoil"></ion-input>
                  </td>
                </tr>
                <tr>
                  <td>Mass moisture (c2-c3) g</td>
                  <td *ngFor="let container of moistureData">
                    <ion-input type="number" placeholder="0.0" [(ngModel)]="container.massMoisture"></ion-input>
                  </td>
                </tr>
                <tr>
                  <td>Mass dry soil (c3-c1) g</td>
                  <td *ngFor="let container of moistureData">
                    <ion-input type="number" placeholder="0.0" [(ngModel)]="container.massDrySoil"></ion-input>
                  </td>
                </tr>
                <tr>
                  <td>Moisture content, w</td>
                  <td *ngFor="let container of moistureData">
                    <ion-input type="number" placeholder="0.0" [(ngModel)]="container.moistureContent"></ion-input>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
    h4 { color: var(--ion-color-secondary); font-weight: 600; margin: 20px 0 12px 0; }
    .table-section { margin-bottom: 24px; }
    .table-container { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .data-table th, .data-table td { border: 1px solid #ddd; padding: 6px; text-align: center; }
    .data-table th { background-color: var(--ion-color-primary); color: white; font-weight: 600; }
    .data-table td:first-child { background-color: #f9f9f9; font-weight: 500; text-align: left; white-space: nowrap; }
    .data-table td ion-input { --padding: 2px; font-size: 10px; }
    .navigation-buttons { position: fixed; bottom: 20px; left: 20px; right: 20px; }
    .next-button { --background: var(--ion-color-success); }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, HeaderComponent]
})
export class ProctorTestDataPage {
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

  constructor(private router: Router) {}

  navigateNext() {
    this.router.navigate(['/proctor-test/calculation']);
  }
}
