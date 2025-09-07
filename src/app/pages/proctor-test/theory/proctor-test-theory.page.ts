import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HeaderComponent } from '../../../components/header.component';

@Component({
  selector: 'app-proctor-test-theory',
  template: `
    <app-header 
      title="Standard Proctor Compaction Test - Theory" 
      [canGoBack]="true"
      backRoute="/geotechnical-lab">
    </app-header>
    
    <ion-content class="ion-padding">
      <div class="content-section">
        <h3>A. OBJECTIVES</h3>
        <p>To determine the relationship between the dry density and moisture content of soils and to determine the maximum dry density and optimum moisture content.</p>
        
        <h3>B. THEORY</h3>
        <p>The compaction of soil is the process by which the soil grains are rearranged to decrease void space and increase the dry density. It is achieved by the expulsion of air from the voids through the application of mechanical energy.</p>
        
        <p>The Standard Proctor Compaction Test is used to determine the maximum dry density that can be achieved for a given soil with a standard amount of compactive effort. The standard Proctor test uses a 2.5 kg rammer dropped through a height of 305 mm into a mould of volume approximately 944 cm³.</p>
        
        <p>The relationship between dry density and moisture content typically shows that as moisture content increases, dry density increases to a maximum value (maximum dry density at optimum moisture content), after which further increase in moisture content causes a decrease in dry density.</p>
        
        <h3>C. APPARATUS & MATERIAL</h3>
        <ul>
          <li>Standard Proctor mould with detachable collar and base plate (internal diameter 101.6 mm, height 116.4 mm)</li>
          <li>Standard rammer (mass 2.5 kg, circular face diameter 50 mm)</li>
          <li>Sample extruder (if available)</li>
          <li>Balance accurate to 1 g</li>
          <li>Balance accurate to 0.1 g</li>
          <li>Oven capable of maintaining temperature at 105-110°C</li>
          <li>Mixing tools (spoon, trowel)</li>
          <li>Containers for moisture content determination</li>
          <li>Straight edge for trimming</li>
          <li>Protective base for mould</li>
        </ul>
      </div>
      
      <div class="navigation-buttons">
        <ion-button 
          expand="block" 
          (click)="navigateNext()"
          class="next-button">
          Next: Procedure
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .content-section {
      margin-bottom: 80px;
    }
    
    h3 {
      color: var(--ion-color-primary);
      font-weight: 600;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    
    p {
      line-height: 1.6;
      margin-bottom: 16px;
      text-align: justify;
    }
    
    ul {
      padding-left: 20px;
    }
    
    li {
      margin-bottom: 8px;
      line-height: 1.5;
    }
    
    .navigation-buttons {
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
    }
    
    .next-button {
      --background: var(--ion-color-success);
    }
  `],
  standalone: true,
  imports: [IonicModule, HeaderComponent]
})
export class ProctorTestTheoryPage {
  constructor(private router: Router) {}

  navigateNext() {
    this.router.navigate(['/proctor-test/procedure']);
  }
}
