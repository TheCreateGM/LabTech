import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBack, home } from 'ionicons/icons';

@Component({
  selector: 'app-header',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="goBack()" [disabled]="!canGoBack">
            <ion-icon name="arrow-back"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ title }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="goHome()">
            <ion-icon name="home"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
  `,
  standalone: true,
  imports: [IonicModule]
})
export class HeaderComponent {
  @Input() title: string = '';
  @Input() canGoBack: boolean = true;
  @Input() backRoute: string = '';

  constructor(private router: Router) {
    addIcons({ arrowBack, home });
  }

  goBack() {
    if (this.backRoute) {
      this.router.navigate([this.backRoute]);
    } else {
      window.history.back();
    }
  }

  goHome() {
    this.router.navigate(['/home']);
  }
}
