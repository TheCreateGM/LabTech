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
        <!-- Equipment Image Button -->
        <div class="equipment-image-button" (click)="openImage()">
          <div class="image-overlay">
            <ion-icon name="images-outline"></ion-icon>
            <span>View Standard Proctor Equipment</span>
          </div>
        </div>
        
        <h3>A. OBJECTIVES</h3>
        <p>To determine the relationship between the dry density and moisture content of soils and to determine the maximum dry density and optimum moisture content.</p>
        
        <h3>B. THEORY</h3>
        <p>The compaction of soil is the process by which the soil grains are rearranged to decrease void space and increase the dry density. It is achieved by the expulsion of air from the voids through the application of mechanical energy.</p>
        
        <p>The Standard Proctor Compaction Test is used to determine the maximum dry density that can be achieved for a given soil with a standard amount of compactive effort. The standard Proctor test uses a 2.5 kg rammer dropped through a height of 305 mm into a mould of volume approximately 944 cm³.</p>
        
        <p>The relationship between dry density and moisture content typically shows that as moisture content increases, dry density increases to a maximum value (maximum dry density at optimum moisture content), after which further increase in moisture content causes a decrease in dry density.</p>
        
        <h3>Video Tutorial</h3>
        <div class="video-container">
          <iframe 
            src="https://www.youtube.com/embed/zubJOrbvbIg?si=Jfbz9MnhSi7glYDP" 
            title="Standard Proctor Compaction Test Tutorial"
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowfullscreen>
          </iframe>
        </div>
        <div class="video-info">
          <ion-icon name="information-circle"></ion-icon>
          <span>Watch this comprehensive tutorial on Standard Proctor Compaction Test procedure</span>
        </div>
        
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
    /* Equipment Image Button */
    .equipment-image-button {
      position: relative;
      width: 100%;
      height: 200px;
      margin-bottom: 24px;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      background: linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)),
                  url('https://www.vertexinstruments.com/wp-content/uploads/2020/02/Standard_Proctor_Compaction_Test_Apparatus-jpg-1200x900.webp') center/cover no-repeat;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      transition: all 0.3s ease;
    }
    
    .equipment-image-button:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
    }
    
    .equipment-image-button:active {
      transform: translateY(-2px);
    }
    
    .image-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 16px;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
      display: flex;
      align-items: center;
      gap: 12px;
      color: white;
    }
    
    .image-overlay ion-icon {
      font-size: 28px;
    }
    
    .image-overlay span {
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    
    .content-section {
      margin-bottom: 80px;
    }
    
    h3 {
      color: var(--ion-color-primary) !important;
      font-weight: 600;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    
    p {
      line-height: 1.6;
      margin-bottom: 16px;
      text-align: justify;
      color: var(--ion-text-color) !important;
    }
    
    /* Video Container */
    .video-container {
      position: relative;
      width: 100%;
      height: 0;
      padding-bottom: 56.25%; /* 16:9 aspect ratio */
      margin: 20px 0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      
      iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: none;
        border-radius: 12px;
      }
    }
    
    .video-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: rgba(59, 130, 246, 0.08);
      border-radius: 12px;
      margin-bottom: 20px;
      border-left: 4px solid var(--ion-color-info);
      
      ion-icon {
        color: var(--ion-color-info);
        font-size: 24px;
        flex-shrink: 0;
      }
      
      span {
        color: var(--ion-text-color) !important;
        line-height: 1.5;
        font-weight: 500;
      }
    }
    
    ul {
      padding-left: 20px;
    }
    
    li {
      margin-bottom: 8px;
      line-height: 1.5;
      color: var(--ion-text-color) !important;
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

  openImage() {
    window.open('https://www.vertexinstruments.com/wp-content/uploads/2020/02/Standard_Proctor_Compaction_Test_Apparatus-jpg-1200x900.webp', '_blank');
  }

  navigateNext() {
    this.router.navigate(['/proctor-test/procedure']);
  }
}
