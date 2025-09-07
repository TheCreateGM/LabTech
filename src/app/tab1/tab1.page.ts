import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { LabCardComponent } from '../components/lab-card.component';

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
  constructor() {}
  
  navigateToTest(testType: string) {
    console.log(`Navigating to ${testType} test`);
    // TODO: Implement navigation to test pages
    // This would typically use Angular Router
    // this.router.navigate(['/test', testType]);
  }
}
