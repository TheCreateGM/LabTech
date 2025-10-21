import { Component, EventEmitter, OnInit, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, Platform } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-activity-filter',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './activity-filter.component.html',
  styleUrls: ['./activity-filter.component.scss']
})
export class ActivityFilterComponent implements OnInit, OnDestroy {
  @Output() filtersApplied = new EventEmitter<any>();
  @Output() filtersClear = new EventEmitter<void>();

  filterForm: FormGroup;
  isMobile = false;
  private destroy$ = new Subject<void>();
  
  actionTypes = [
    { value: 'read', label: 'Read' },
    { value: 'write', label: 'Write' },
    { value: 'delete', label: 'Delete' },
    { value: 'open', label: 'Open' },
    { value: 'download', label: 'Download' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private platform: Platform
  ) {
    this.filterForm = this.fb.group({
      userId: [''],
      startDate: [''],
      endDate: [''],
      action: [''],
      resourcePath: ['']
    });
    
    // Detect mobile platform
    this.isMobile = this.platform.width() < 768;
  }

  ngOnInit() {
    // Load filters from URL query parameters
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (Object.keys(params).length > 0) {
          this.filterForm.patchValue({
            userId: params['userId'] || '',
            startDate: params['startDate'] || '',
            endDate: params['endDate'] || '',
            action: params['action'] || '',
            resourcePath: params['resourcePath'] || ''
          });
        }
      });
    
    // Update isMobile on window resize
    this.platform.resize
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isMobile = this.platform.width() < 768;
      });

    // Add debouncing to resourcePath input (300ms)
    this.filterForm.get('resourcePath')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Auto-apply filters when resourcePath changes (after debounce)
        if (this.filterForm.get('resourcePath')?.value) {
          this.applyFilters();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilters() {
    const filters = this.filterForm.value;
    
    // Remove empty values
    const cleanFilters = Object.keys(filters).reduce((acc: any, key) => {
      if (filters[key]) {
        acc[key] = filters[key];
      }
      return acc;
    }, {});

    // Update URL query parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: cleanFilters,
      queryParamsHandling: 'merge'
    });

    this.filtersApplied.emit(cleanFilters);
  }

  clearFilters() {
    this.filterForm.reset();
    
    // Clear URL query parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {}
    });

    this.filtersClear.emit();
  }

  hasActiveFilters(): boolean {
    const values = this.filterForm.value;
    return Object.values(values).some(value => value !== '' && value !== null);
  }
}
