import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ThemeService, ThemeInfo } from '../services/theme.service';
import { addIcons } from 'ionicons';
import { 
  arrowBack, 
  home, 
  sunny, 
  sunnyOutline, 
  moon, 
  moonOutline, 
  phonePortraitOutline,
  ellipsisVertical,
  settings,
  arrowForward
} from 'ionicons/icons';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-header',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button 
            (click)="goBack()" 
            [disabled]="!canGoBack"
            *ngIf="showBackButton">
            <ion-icon name="arrow-back" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        
        <ion-title>{{ getPageTitle() }}</ion-title>
        
        <ion-buttons slot="end">
          <!-- Home button -->
          <ion-button 
            (click)="goHome()" 
            *ngIf="showHomeButton">
            <ion-icon name="home" slot="icon-only"></ion-icon>
          </ion-button>
          
          <!-- Theme toggle -->
          <ion-button 
            (click)="toggleTheme()"
            [title]="'Switch to ' + getNextTheme().displayName + ' mode'">
            <ion-icon [name]="currentTheme.icon" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      
      <!-- Progress indicator for test pages -->
      <div class="progress-container" *ngIf="showProgress">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            [style.width.%]="progressPercentage">
          </div>
        </div>
        <div class="progress-text">
          Step {{ currentStep }} of {{ totalSteps }}
        </div>
      </div>
    </ion-header>
  `,
  styles: [`
    ion-header {
      ion-toolbar {
        --background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary));
        --color: white;
        --border-width: 0;
        --min-height: 64px;
        border-radius: 0 0 var(--lab-radius-xl) var(--lab-radius-xl);
        box-shadow: var(--lab-shadow-medium);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
      }
      
      ion-title {
        font-size: var(--lab-font-size-xl);
        font-weight: 600;
        letter-spacing: -0.02em;
      }
      
      ion-button {
        --border-radius: var(--lab-radius-full);
        --padding: var(--lab-space-sm);
        font-weight: 500;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        
        &:hover {
          --background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }
        
        &[disabled] {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
      
      ion-icon {
        font-size: 1.5rem;
      }
    }
    
    .progress-container {
      padding: var(--lab-space-sm) var(--lab-space-lg);
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    
    .progress-bar {
      height: 4px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: var(--lab-radius-full);
      overflow: hidden;
      margin-bottom: var(--lab-space-xs);
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #ffffff, rgba(255, 255, 255, 0.8));
      border-radius: var(--lab-radius-full);
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .progress-text {
      font-size: var(--lab-font-size-sm);
      color: rgba(255, 255, 255, 0.9);
      text-align: center;
      font-weight: 500;
    }
    
    @media (max-width: 768px) {
      ion-header ion-toolbar {
        --min-height: 56px;
      }
      
      ion-title {
        font-size: var(--lab-font-size-lg);
      }
      
      ion-icon {
        font-size: 1.25rem;
      }
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class AppHeaderComponent implements OnInit, OnDestroy {
  @Input() title: string = '';
  @Input() showBackButton: boolean = true;
  @Input() showHomeButton: boolean = true;
  @Input() showProgress: boolean = false;
  @Input() currentStep: number = 1;
  @Input() totalSteps: number = 1;
  @Input() customBackRoute: string = '';

  public canGoBack: boolean = false;
  public currentTheme: ThemeInfo = { name: 'auto', displayName: 'Auto', icon: 'phone-portrait-outline' };
  
  private destroy$ = new Subject<void>();
  
  // Page titles mapping
  private pageTitles: { [key: string]: string } = {
    '/tabs/tab1': 'LabTech GeoLab',
    '/tabs/tab2': 'Lab Tests',
    '/tabs/tab3': 'References',
    '/tabs/start': 'Welcome',
    '/tabs/home': 'Select Lab',
    '/tabs/geotechnical-lab': 'Geotechnical Lab',
    '/tabs/sieve-analysis/theory': 'Sieve Analysis - Theory',
    '/tabs/sieve-analysis/procedure': 'Sieve Analysis - Procedure',
    '/tabs/sieve-analysis/data': 'Sieve Analysis - Data Entry',
    '/tabs/sieve-analysis/calculation': 'Sieve Analysis - Calculations',
    '/tabs/sieve-analysis/summary': 'Sieve Analysis - Summary',
    '/tabs/proctor-test/theory': 'Proctor Test - Theory',
    '/tabs/proctor-test/procedure': 'Proctor Test - Procedure',
    '/tabs/proctor-test/data': 'Proctor Test - Data Entry',
    '/tabs/proctor-test/calculation': 'Proctor Test - Calculations',
    '/tabs/proctor-test/discussion': 'Proctor Test - Discussion',
    '/tabs/proctor-test/conclusion': 'Proctor Test - Conclusion',
    '/tabs/end': 'Test Complete'
  };

  constructor(
    private router: Router,
    private location: Location,
    private themeService: ThemeService
  ) {
    addIcons({ 
      arrowBack, 
      home, 
      sunny, 
      sunnyOutline, 
      moon, 
      moonOutline, 
      phonePortraitOutline,
      ellipsisVertical,
      settings,
      arrowForward
    });
  }

  ngOnInit() {
    // Listen to route changes to update navigation state
    this.router.events
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.updateNavigationState();
          this.updateProgressState();
        }
      });

    // Listen to theme changes
    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => {
        this.currentTheme = theme;
      });

    this.updateNavigationState();
    this.updateProgressState();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateNavigationState() {
    const currentUrl = this.router.url;
    this.canGoBack = !this.isRootPage(currentUrl);
  }

  private updateProgressState() {
    const currentUrl = this.router.url;
    
    if (currentUrl.includes('sieve-analysis')) {
      this.showProgress = true;
      this.totalSteps = 5;
      this.currentStep = this.getSieveAnalysisStep(currentUrl);
    } else if (currentUrl.includes('proctor-test')) {
      this.showProgress = true;
      this.totalSteps = 6;
      this.currentStep = this.getProctorTestStep(currentUrl);
    } else {
      this.showProgress = false;
    }
  }

  private getSieveAnalysisStep(url: string): number {
    if (url.includes('theory')) return 1;
    if (url.includes('procedure')) return 2;
    if (url.includes('data')) return 3;
    if (url.includes('calculation')) return 4;
    if (url.includes('summary')) return 5;
    return 1;
  }

  private getProctorTestStep(url: string): number {
    if (url.includes('theory')) return 1;
    if (url.includes('procedure')) return 2;
    if (url.includes('data')) return 3;
    if (url.includes('calculation')) return 4;
    if (url.includes('discussion')) return 5;
    if (url.includes('conclusion')) return 6;
    return 1;
  }

  public get progressPercentage(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  private isRootPage(url: string): boolean {
    const rootPages = ['/tabs/tab1', '/tabs/start', '/tabs/home'];
    return rootPages.includes(url);
  }

  public getPageTitle(): string {
    if (this.title) {
      return this.title;
    }
    
    const currentUrl = this.router.url;
    return this.pageTitles[currentUrl] || 'LabTech GeoLab';
  }

  public goBack() {
    if (this.customBackRoute) {
      this.router.navigate([this.customBackRoute]);
    } else if (this.canGoBack) {
      this.location.back();
    }
  }

  public goHome() {
    this.router.navigate(['/tabs/tab1']);
  }

  public toggleTheme() {
    this.themeService.toggleTheme();
  }

  public getNextTheme(): ThemeInfo {
    const currentIndex = this.themeService.themes.findIndex(t => t.name === this.currentTheme.name);
    const nextIndex = (currentIndex + 1) % this.themeService.themes.length;
    return this.themeService.themes[nextIndex];
  }
}
