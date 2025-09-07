/**
 * LabTech GeoLab - Sieve Analysis Module
 * Handles section navigation and data calculations for grain size sieve analysis
 */

class SieveAnalysisController {
  private currentSectionIndex: number = 0;
  private sections: string[] = [
    'objectives',
    'theory', 
    'apparatus',
    'procedure',
    'data-results',
    'calculation',
    'summary'
  ];

  constructor() {
    this.initializeEventListeners();
    this.setupCalculations();
  }

  /**
   * Initialize event listeners for sieve analysis
   */
  private initializeEventListeners(): void {
    document.addEventListener('DOMContentLoaded', () => {
      this.setupNavigationButtons();
      this.setupDataInputListeners();
      console.log('Sieve Analysis controller initialized');
    });
  }

  /**
   * Set up navigation button event listeners
   */
  private setupNavigationButtons(): void {
    const backBtn = document.getElementById('sieve-back-btn');
    const nextBtn = document.getElementById('sieve-next-btn');
    const homeBtn = document.getElementById('sieve-home-btn');

    if (backBtn) {
      backBtn.addEventListener('click', () => this.navigateBack());
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.navigateNext());
    }

    if (homeBtn) {
      homeBtn.addEventListener('click', () => this.navigateHome());
    }

    this.updateNavigationButtons();
  }

  /**
   * Set up data input event listeners for calculations
   */
  private setupDataInputListeners(): void {
    // Listen for changes in mass retained inputs
    const massRetainedInputs = document.querySelectorAll('.mass-retained');
    massRetainedInputs.forEach(input => {
      input.addEventListener('input', () => this.calculateSieveData());
    });

    // Listen for changes in total mass of soil
    const totalMassInput = document.getElementById('total-mass-soil');
    if (totalMassInput) {
      totalMassInput.addEventListener('input', () => this.calculateSieveData());
    }
  }

  /**
   * Navigate to previous section
   */
  private navigateBack(): void {
    if (this.currentSectionIndex > 0) {
      this.currentSectionIndex--;
      this.showCurrentSection();
      this.updateNavigationButtons();
    }
  }

  /**
   * Navigate to next section
   */
  private navigateNext(): void {
    if (this.currentSectionIndex < this.sections.length - 1) {
      this.currentSectionIndex++;
      this.showCurrentSection();
      this.updateNavigationButtons();
    } else {
      // Navigate to end screen after last section
      this.navigateToEnd();
    }
  }

  /**
   * Navigate to homepage
   */
  private async navigateHome(): Promise<void> {
    try {
      await window.electronAPI.navigateTo('homepage.html');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  /**
   * Navigate to end screen
   */
  private async navigateToEnd(): Promise<void> {
    try {
      await window.electronAPI.navigateTo('end.html');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  /**
   * Show the current section and hide others
   */
  private showCurrentSection(): void {
    this.sections.forEach((sectionId, index) => {
      const section = document.getElementById(sectionId);
      if (section) {
        if (index === this.currentSectionIndex) {
          section.classList.add('active');
          section.style.display = 'block';
        } else {
          section.classList.remove('active');
          section.style.display = 'none';
        }
      }
    });

    // Add fade-in animation
    const activeSection = document.getElementById(this.sections[this.currentSectionIndex]);
    if (activeSection) {
      activeSection.classList.add('fade-in');
      setTimeout(() => {
        activeSection.classList.remove('fade-in');
      }, 300);
    }
  }

  /**
   * Update navigation button states
   */
  private updateNavigationButtons(): void {
    const backBtn = document.getElementById('sieve-back-btn') as HTMLButtonElement;
    const nextBtn = document.getElementById('sieve-next-btn') as HTMLButtonElement;

    if (backBtn) {
      backBtn.disabled = this.currentSectionIndex === 0;
      if (this.currentSectionIndex === 0) {
        backBtn.classList.add('disabled');
      } else {
        backBtn.classList.remove('disabled');
      }
    }

    if (nextBtn) {
      if (this.currentSectionIndex === this.sections.length - 1) {
        nextBtn.textContent = 'Finish';
      } else {
        nextBtn.textContent = 'Next';
      }
    }
  }

  /**
   * Set up calculation logic for sieve data
   */
  private setupCalculations(): void {
    // Calculations will be triggered by input events
    console.log('Sieve calculations ready');
  }

  /**
   * Calculate sieve analysis data when inputs change
   */
  private calculateSieveData(): void {
    const totalMassSoil = this.getInputValue('total-mass-soil');
    
    if (totalMassSoil <= 0) {
      this.clearCalculatedValues();
      return;
    }

    const massRetainedInputs = document.querySelectorAll('.mass-retained') as NodeListOf<HTMLInputElement>;
    const massPassingInputs = document.querySelectorAll('.mass-passing') as NodeListOf<HTMLInputElement>;
    const cumulativePercentageInputs = document.querySelectorAll('.cumulative-percentage') as NodeListOf<HTMLInputElement>;

    let cumulativeMassRetained = 0;
    let totalMassRetained = 0;

    // Calculate values for each sieve
    massRetainedInputs.forEach((input, index) => {
      const massRetained = this.parseNumber(input.value);
      totalMassRetained += massRetained;
      cumulativeMassRetained += massRetained;
      
      // Mass passing = Total mass - Cumulative mass retained
      const massPassing = totalMassSoil - cumulativeMassRetained;
      
      // Cumulative percentage passing
      const cumulativePercentage = (massPassing / totalMassSoil) * 100;

      // Update readonly inputs
      if (massPassingInputs[index]) {
        massPassingInputs[index].value = this.formatNumber(Math.max(0, massPassing));
      }

      if (cumulativePercentageInputs[index]) {
        cumulativePercentageInputs[index].value = this.formatNumber(Math.max(0, cumulativePercentage));
      }
    });

    // Update summary fields
    this.updateSummaryFields(totalMassSoil, totalMassRetained);
  }

  /**
   * Update summary fields (total mass after sieving and losses)
   */
  private updateSummaryFields(totalMassSoil: number, totalMassRetained: number): void {
    const totalMassAfterInput = document.getElementById('total-mass-after') as HTMLInputElement;
    const lossesInput = document.getElementById('losses') as HTMLInputElement;

    if (totalMassAfterInput) {
      totalMassAfterInput.value = this.formatNumber(totalMassRetained);
    }

    if (lossesInput) {
      const losses = totalMassSoil - totalMassRetained;
      lossesInput.value = this.formatNumber(Math.max(0, losses));
    }
  }

  /**
   * Clear all calculated values
   */
  private clearCalculatedValues(): void {
    const massPassingInputs = document.querySelectorAll('.mass-passing') as NodeListOf<HTMLInputElement>;
    const cumulativePercentageInputs = document.querySelectorAll('.cumulative-percentage') as NodeListOf<HTMLInputElement>;
    const totalMassAfterInput = document.getElementById('total-mass-after') as HTMLInputElement;
    const lossesInput = document.getElementById('losses') as HTMLInputElement;

    massPassingInputs.forEach(input => input.value = '');
    cumulativePercentageInputs.forEach(input => input.value = '');
    
    if (totalMassAfterInput) totalMassAfterInput.value = '';
    if (lossesInput) lossesInput.value = '';
  }

  /**
   * Get input value safely
   */
  private getInputValue(elementId: string): number {
    const element = document.getElementById(elementId) as HTMLInputElement;
    return element ? this.parseNumber(element.value) : 0;
  }

  /**
   * Parse number input safely
   */
  private parseNumber(input: string): number {
    if (!input || input.trim() === '') return 0;
    const parsed = parseFloat(input);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Format number for display
   */
  private formatNumber(value: number, decimals: number = 2): string {
    if (isNaN(value)) return '';
    return value.toFixed(decimals);
  }

  /**
   * Get current section name for debugging
   */
  public getCurrentSection(): string {
    return this.sections[this.currentSectionIndex];
  }

  /**
   * Jump to specific section (for debugging/testing)
   */
  public jumpToSection(sectionIndex: number): void {
    if (sectionIndex >= 0 && sectionIndex < this.sections.length) {
      this.currentSectionIndex = sectionIndex;
      this.showCurrentSection();
      this.updateNavigationButtons();
    }
  }
}

// Initialize the sieve analysis controller when the script loads
document.addEventListener('DOMContentLoaded', () => {
  const sieveController = new SieveAnalysisController();
  
  // Make it available globally for debugging
  (window as any).sieveController = sieveController;
});
