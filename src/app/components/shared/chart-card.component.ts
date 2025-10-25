import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-chart-card',
  template: `
    <ion-card class="chart-card">
      <ion-card-header>
        <div class="header-content">
          <div class="title-section">
            <ion-icon *ngIf="icon" [name]="icon" class="chart-icon"></ion-icon>
            <ion-card-title>{{ title }}</ion-card-title>
          </div>
          <ion-button 
            *ngIf="exportable"
            fill="clear" 
            size="small"
            (click)="onExport()"
            aria-label="Export chart data">
            <ion-icon name="download-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </div>
        <ion-card-subtitle *ngIf="subtitle">{{ subtitle }}</ion-card-subtitle>
      </ion-card-header>
      
      <ion-card-content>
        <div class="chart-container" [class.loading]="loading">
          <!-- Loading State -->
          <div *ngIf="loading" class="loading-overlay">
            <ion-spinner name="circular" color="primary"></ion-spinner>
            <p class="loading-text">Loading chart data...</p>
          </div>
          
          <!-- Empty State -->
          <div *ngIf="!loading && isEmpty" class="empty-state">
            <ion-icon name="bar-chart-outline" class="empty-icon"></ion-icon>
            <p class="empty-text">No data available</p>
            <p class="empty-subtext">{{ emptyMessage || 'Add data to visualize results' }}</p>
          </div>
          
          <!-- Chart Content -->
          <div *ngIf="!loading && !isEmpty" class="chart-wrapper">
            <ng-content></ng-content>
          </div>
        </div>
        
        <!-- Legend (if provided) -->
        <div *ngIf="showLegend && !isEmpty && !loading" class="chart-legend">
          <div *ngFor="let item of legendItems" class="legend-item">
            <span class="legend-color" [style.background-color]="item.color"></span>
            <span class="legend-label">{{ item.label }}</span>
          </div>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .chart-card {
      --background: var(--lab-color-surface);
      border-radius: var(--lab-radius-2xl);
      box-shadow: var(--lab-shadow-soft);
      border: 1px solid var(--lab-color-outline);
      margin: var(--lab-space-base) 0;
      overflow: visible;
    }
    
    ion-card-header {
      padding: var(--lab-space-xl);
      border-bottom: 1px solid var(--lab-color-outline);
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--lab-space-base);
    }
    
    .title-section {
      display: flex;
      align-items: center;
      gap: var(--lab-space-sm);
      flex: 1;
    }
    
    .chart-icon {
      font-size: 1.5rem;
      color: var(--ion-color-primary);
    }
    
    ion-card-title {
      font-size: var(--lab-font-size-lg);
      font-weight: 600;
      color: var(--ion-text-color);
      margin: 0;
    }
    
    ion-card-subtitle {
      font-size: var(--lab-font-size-sm);
      color: var(--ion-color-medium);
      margin-top: var(--lab-space-xs);
    }
    
    ion-card-content {
      padding: var(--lab-space-xl);
    }
    
    .chart-container {
      position: relative;
      width: 100%;
      min-height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &.loading {
        background: var(--lab-color-surface-variant);
        border-radius: var(--lab-radius-lg);
      }
    }
    
    .chart-wrapper {
      width: 100%;
      height: 100%;
    }
    
    /* Loading State */
    .loading-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--lab-space-base);
      padding: var(--lab-space-2xl);
    }
    
    .loading-text {
      font-size: var(--lab-font-size-sm);
      color: var(--ion-color-medium);
      margin: 0;
    }
    
    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--lab-space-sm);
      padding: var(--lab-space-2xl);
      text-align: center;
    }
    
    .empty-icon {
      font-size: 4rem;
      color: var(--ion-color-medium);
      opacity: 0.5;
    }
    
    .empty-text {
      font-size: var(--lab-font-size-base);
      font-weight: 600;
      color: var(--ion-color-medium);
      margin: 0;
    }
    
    .empty-subtext {
      font-size: var(--lab-font-size-sm);
      color: var(--ion-color-medium);
      margin: 0;
      opacity: 0.8;
    }
    
    /* Legend */
    .chart-legend {
      display: flex;
      flex-wrap: wrap;
      gap: var(--lab-space-lg);
      padding-top: var(--lab-space-lg);
      border-top: 1px solid var(--lab-color-outline);
      margin-top: var(--lab-space-lg);
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: var(--lab-space-sm);
    }
    
    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: var(--lab-radius-sm);
      box-shadow: var(--lab-shadow-xs);
    }
    
    .legend-label {
      font-size: var(--lab-font-size-sm);
      color: var(--ion-text-color);
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      ion-card-header,
      ion-card-content {
        padding: var(--lab-space-lg);
      }
      
      .chart-container {
        min-height: 250px;
      }
      
      .chart-icon {
        font-size: 1.25rem;
      }
      
      ion-card-title {
        font-size: var(--lab-font-size-base);
      }
    }
    
    @media (max-width: 480px) {
      ion-card-header,
      ion-card-content {
        padding: var(--lab-space-base);
      }
      
      .chart-container {
        min-height: 200px;
      }
      
      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .chart-legend {
        gap: var(--lab-space-base);
      }
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, NgxChartsModule]
})
export class ChartCardComponent {
  @Input() title: string = 'Chart';
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() loading: boolean = false;
  @Input() isEmpty: boolean = false;
  @Input() emptyMessage?: string;
  @Input() exportable: boolean = false;
  @Input() showLegend: boolean = false;
  @Input() legendItems: Array<{ label: string; color: string }> = [];

  onExport() {
    // Implement export functionality
    // Could export as PNG, PDF, or CSV depending on requirements
    console.log('Export chart data');
  }
}
