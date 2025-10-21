import { Component, EnvironmentInjector, inject, OnInit } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, flaskOutline, libraryOutline, lockClosedOutline } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, CommonModule],
})
export class TabsPage implements OnInit {
  public environmentInjector = inject(EnvironmentInjector);
  private authService = inject(AuthService);
  
  isAdmin = false;

  constructor() {
    addIcons({ homeOutline, flaskOutline, libraryOutline, lockClosedOutline });
  }

  async ngOnInit() {
    // Check if user has admin role
    this.isAdmin = this.authService.hasRole('admin');
    
    // Subscribe to auth state changes to update admin tab visibility
    this.authService.currentUser$.subscribe(user => {
      this.isAdmin = user?.role === 'admin';
    });
  }
}
