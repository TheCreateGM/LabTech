import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonSpinner,
  IonIcon,
  IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { shieldCheckmarkOutline, timeOutline, keyOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

/**
 * MFA verification page component for two-factor authentication
 */
@Component({
  selector: 'app-mfa-verify',
  templateUrl: './mfa-verify.page.html',
  styleUrls: ['./mfa-verify.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
    IonSpinner,
    IonIcon,
    IonNote
  ]
})
export class MfaVerifyPage implements OnInit, OnDestroy {
  mfaForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  returnUrl = '/admin';
  timeRemaining = 30;
  private countdownInterval: any;
  useBackupCode = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    addIcons({ shieldCheckmarkOutline, timeOutline, keyOutline });
  }

  ngOnInit() {
    // Initialize MFA form with validation
    this.mfaForm = this.formBuilder.group({
      code: ['', [
        Validators.required,
        Validators.pattern(/^\d{6}$/) // 6-digit numeric code
      ]]
    });

    // Get return URL from query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin';

    // Start countdown timer
    this.startCountdown();
  }

  ngOnDestroy() {
    // Clean up countdown interval
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  /**
   * Start countdown timer for TOTP code validity
   */
  private startCountdown() {
    // Calculate seconds remaining in current 30-second window
    const now = Math.floor(Date.now() / 1000);
    this.timeRemaining = 30 - (now % 30);

    this.countdownInterval = setInterval(() => {
      this.timeRemaining--;
      
      if (this.timeRemaining <= 0) {
        // Reset to 30 seconds for next window
        this.timeRemaining = 30;
      }
    }, 1000);
  }

  /**
   * Handle form submission
   */
  onSubmit() {
    if (this.mfaForm.invalid) {
      this.markFormGroupTouched(this.mfaForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { code } = this.mfaForm.value;

    this.authService.verifyMFA(code).subscribe({
      next: () => {
        this.isLoading = false;
        // MFA verification successful, redirect to return URL
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        this.isLoading = false;
        
        // Extract error message from response
        if (error.error?.error?.message) {
          this.errorMessage = error.error.error.message;
        } else if (error.message) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = 'Invalid verification code. Please try again.';
        }

        // Clear the code input
        this.mfaForm.patchValue({ code: '' });
      }
    });
  }

  /**
   * Toggle between TOTP code and backup code input
   */
  toggleBackupCode() {
    this.useBackupCode = !this.useBackupCode;
    this.errorMessage = '';
    
    // Update validation pattern based on input type
    const codeControl = this.mfaForm.get('code');
    if (this.useBackupCode) {
      // Backup codes are typically alphanumeric
      codeControl?.setValidators([
        Validators.required,
        Validators.minLength(8)
      ]);
    } else {
      // TOTP codes are 6-digit numeric
      codeControl?.setValidators([
        Validators.required,
        Validators.pattern(/^\d{6}$/)
      ]);
    }
    codeControl?.updateValueAndValidity();
    
    // Clear the input
    this.mfaForm.patchValue({ code: '' });
  }

  /**
   * Handle cancel button click
   */
  onCancel() {
    // Logout and return to login page
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Get form control for template access
   */
  get code() {
    return this.mfaForm.get('code');
  }

  /**
   * Check if field has error and is touched
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.mfaForm.get(fieldName);
    return !!(field && field.hasError(errorType) && field.touched);
  }

  /**
   * Mark all form fields as touched to show validation errors
   */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Get countdown display color based on time remaining
   */
  get countdownColor(): string {
    if (this.timeRemaining <= 5) {
      return 'danger';
    } else if (this.timeRemaining <= 10) {
      return 'warning';
    }
    return 'success';
  }
}
