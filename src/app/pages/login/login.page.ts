import { Component, OnInit } from '@angular/core';
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
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logInOutline, personOutline, lockClosedOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

/**
 * Login page component for user authentication
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
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
    IonIcon
  ]
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  returnUrl = '/admin';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    addIcons({ logInOutline, personOutline, lockClosedOutline });
  }

  ngOnInit() {
    // Initialize login form with validation
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });

    // Get return URL from query params or default to admin
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin';
  }

  /**
   * Handle form submission
   */
  onSubmit() {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.mfaRequired) {
          // Redirect to MFA verification page
          this.router.navigate(['/mfa-verify'], {
            queryParams: { returnUrl: this.returnUrl }
          });
        } else {
          // Login successful, redirect to return URL
          this.router.navigate([this.returnUrl]);
        }
      },
      error: (error) => {
        this.isLoading = false;
        
        // Extract error message from response
        if (error.error?.error?.message) {
          this.errorMessage = error.error.error.message;
        } else if (error.message) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }
      }
    });
  }

  /**
   * Get form control for template access
   */
  get username() {
    return this.loginForm.get('username');
  }

  /**
   * Get form control for template access
   */
  get password() {
    return this.loginForm.get('password');
  }

  /**
   * Check if field has error and is touched
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.loginForm.get(fieldName);
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
   * Handle forgot password click (placeholder for future implementation)
   */
  onForgotPassword() {
    // TODO: Implement forgot password functionality
    console.log('Forgot password clicked');
  }
}
