import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AlertController } from '@ionic/angular/standalone';

/**
 * Admin guard to protect routes that require admin role
 * Checks if user is authenticated and has admin role
 */
export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const alertController = inject(AlertController);

  // Check if user is authenticated
  const isAuthenticated = await authService.isAuthenticated();
  
  if (!isAuthenticated) {
    // Redirect to login page with return URL
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Check if user has admin role
  const hasAdminRole = authService.hasRole('admin');
  
  if (!hasAdminRole) {
    // Show access denied alert
    const alert = await alertController.create({
      header: 'Access Denied',
      message: 'You do not have permission to access this page. Admin privileges are required.',
      buttons: [
        {
          text: 'OK',
          handler: () => {
            router.navigate(['/tabs/tab1']);
          }
        }
      ]
    });

    await alert.present();
    return false;
  }

  return true;
};
