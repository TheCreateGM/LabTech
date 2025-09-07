import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { LabCardComponent } from '../components/lab-card.component';
import { addIcons } from 'ionicons';
import { analytics, flask, filter, hammer, checkmarkCircle, time, trendingUp } from 'ionicons/icons';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonButton, 
    IonIcon, 
    IonGrid, 
    IonRow, 
    IonCol,
    LabCardComponent
  ],
})
export class Tab1Page {
  constructor(private router: Router) {
    // Register only the icons used on this page to ensure they render on mobile
    addIcons({ analytics, flask, filter, hammer, checkmarkCircle, time, trendingUp });
  }
  
  navigateToTest(testType: string) {
    if (testType === 'sieve') {
      this.router.navigate(['/tabs/sieve-analysis/theory']);
    } else if (testType === 'proctor') {
      this.router.navigate(['/tabs/proctor-test/theory']);
    }
  }
  
  navigateToHome() {
    this.router.navigate(['/tabs/home']);
  }
}
