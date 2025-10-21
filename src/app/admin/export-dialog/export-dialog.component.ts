import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { ActivityLogService } from '../services/activity-log.service';

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './export-dialog.component.html',
  styleUrls: ['./export-dialog.component.scss']
})
export class ExportDialogComponent implements OnInit {
  exportForm: FormGroup;
  isExporting = false;
  exportProgress = 0;
  showWarning = false;
  estimatedRecords = 0;

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private activityLogService: ActivityLogService
  ) {
    this.exportForm = this.fb.group({
      format: ['csv', Validators.required],
      startDate: [''],
      endDate: [''],
      userId: [''],
      action: [''],
      resourcePath: ['']
    });
  }

  ngOnInit() {
    // Listen to form changes to show warning for large datasets
    this.exportForm.valueChanges.subscribe(() => {
      this.checkEstimatedSize();
    });
  }

  checkEstimatedSize() {
    // In a real implementation, this would call an API to estimate the size
    // For now, we'll show a warning if no date range is specified
    const startDate = this.exportForm.get('startDate')?.value;
    const endDate = this.exportForm.get('endDate')?.value;
    
    if (!startDate && !endDate) {
      this.showWarning = true;
      this.estimatedRecords = 15000; // Mock value
    } else {
      this.showWarning = false;
      this.estimatedRecords = 5000; // Mock value
    }
  }

  async exportData() {
    if (this.exportForm.invalid) {
      return;
    }

    this.isExporting = true;
    this.exportProgress = 0;

    const formValue = this.exportForm.value;
    const format = formValue.format;
    
    // Build filters object
    const filters: any = {};
    if (formValue.startDate) filters.startDate = formValue.startDate;
    if (formValue.endDate) filters.endDate = formValue.endDate;
    if (formValue.userId) filters.userId = formValue.userId;
    if (formValue.action) filters.action = formValue.action;
    if (formValue.resourcePath) filters.resourcePath = formValue.resourcePath;

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      if (this.exportProgress < 90) {
        this.exportProgress += 10;
      }
    }, 200);

    this.activityLogService.exportActivities(format, filters).subscribe({
      next: (blob) => {
        clearInterval(progressInterval);
        this.exportProgress = 100;

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const timestamp = new Date().toISOString().split('T')[0];
        const extension = format === 'csv' ? 'csv' : 'json';
        link.download = `activity-logs-${timestamp}.${extension}`;
        
        link.click();
        window.URL.revokeObjectURL(url);

        setTimeout(() => {
          this.dismiss(true);
        }, 500);
      },
      error: (error) => {
        clearInterval(progressInterval);
        console.error('Export failed:', error);
        this.isExporting = false;
        this.exportProgress = 0;
        // Show error toast or alert
      }
    });
  }

  dismiss(success = false) {
    this.modalCtrl.dismiss({
      success
    });
  }
}
