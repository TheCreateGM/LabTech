/**
 * LabTech GeoLab - Main Renderer Script
 * Handles navigation and common functionality across all screens
 */

export interface ElectronAPI {
  navigateTo: (page: string) => Promise<void>;
  quitApp: () => void;
  getWindowBounds: () => Promise<any>;
  isDev: () => Promise<boolean>;
  onNavigate: (callback: (page: string) => void) => void;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

class LabTechRenderer {
  constructor() {
    this.initializeEventListeners();
  }

  /**
   * Initialize event listeners for the current page
   */
  private initializeEventListeners(): void {
    document.addEventListener('DOMContentLoaded', () => {
      this.setupNavigationListeners();
      this.setupPageSpecificListeners();
      console.log('LabTech GeoLab renderer initialized');
    });
  }

  /**
   * Set up navigation event listeners common to all pages
   */
  private setupNavigationListeners(): void {
    // Start button (UI1)
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.navigateToPage('homepage.html'));
    }

    // Homepage lab selection (UI2)
    const geoLabCard = document.getElementById('geo-lab');
    const techLabCard = document.getElementById('tech-lab');
    const chemLabCard = document.getElementById('chem-lab');

    if (geoLabCard) {
      geoLabCard.addEventListener('click', () => this.navigateToPage('geo-lab.html'));
    }

    if (techLabCard) {
      techLabCard.addEventListener('click', () => this.showDisabledAlert('Tech Lab'));
    }

    if (chemLabCard) {
      chemLabCard.addEventListener('click', () => this.showDisabledAlert('Chemical Lab'));
    }

    // Geotechnical lab test selection (UI3)
    const sieveBtn = document.getElementById('sieve-btn');
    const proctorBtn = document.getElementById('proctor-btn');

    if (sieveBtn) {
      sieveBtn.addEventListener('click', () => this.navigateToPage('sieve-analysis.html'));
    }

    if (proctorBtn) {
      proctorBtn.addEventListener('click', () => this.navigateToPage('proctor-test.html'));
    }

    // End screen navigation (UI6)
    const homeBtn = document.getElementById('home-btn');
    const exitBtn = document.getElementById('exit-btn');
    const endBackBtn = document.getElementById('end-back-btn');

    if (homeBtn) {
      homeBtn.addEventListener('click', () => this.navigateToPage('homepage.html'));
    }

    if (exitBtn) {
      exitBtn.addEventListener('click', () => this.quitApplication());
    }

    if (endBackBtn) {
      endBackBtn.addEventListener('click', () => this.navigateBack());
    }
  }

  /**
   * Set up page-specific event listeners
   */
  private setupPageSpecificListeners(): void {
    // This will be overridden by specific page scripts if needed
    // For now, just log that we're ready for page-specific functionality
    const pageTitle = document.title;
    console.log(`Page-specific listeners ready for: ${pageTitle}`);
  }

  /**
   * Navigate to a specific page
   */
  private async navigateToPage(page: string): Promise<void> {
    try {
      await window.electronAPI.navigateTo(page);
    } catch (error) {
      console.error('Navigation error:', error);
      this.showErrorMessage('Navigation failed. Please try again.');
    }
  }

  /**
   * Navigate back (implementation depends on context)
   */
  private navigateBack(): void {
    // In a real implementation, we'd track navigation history
    // For now, navigate to homepage as a safe fallback
    this.navigateToPage('homepage.html');
  }

  /**
   * Quit the application
   */
  private quitApplication(): void {
    const confirmed = confirm('Are you sure you want to exit LabTech GeoLab?');
    if (confirmed) {
      window.electronAPI.quitApp();
    }
  }

  /**
   * Show alert for disabled labs
   */
  private showDisabledAlert(labName: string): void {
    alert(`${labName} is not available in this version.\\nPlease use the Geotechnical Lab for testing.`);
  }

  /**
   * Show error message to user
   */
  private showErrorMessage(message: string): void {
    // In a production app, this could be a styled modal or toast
    alert(`Error: ${message}`);
  }

  /**
   * Utility method to format numbers
   */
  public static formatNumber(value: number, decimals: number = 2): string {
    if (isNaN(value)) return '';
    return value.toFixed(decimals);
  }

  /**
   * Utility method to parse number input safely
   */
  public static parseNumber(input: string | null): number {
    if (!input || input.trim() === '') return 0;
    const parsed = parseFloat(input);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Utility method to update readonly input value
   */
  public static updateReadonlyInput(element: HTMLInputElement, value: number, decimals: number = 2): void {
    if (element) {
      element.value = this.formatNumber(value, decimals);
    }
  }

  /**
   * Utility method to get input value safely
   */
  public static getInputValue(element: HTMLInputElement | null): number {
    if (!element) return 0;
    return this.parseNumber(element.value);
  }
}

// Initialize the renderer when the script loads
const labTechRenderer = new LabTechRenderer();

// Export for use by other scripts
(window as any).LabTechRenderer = LabTechRenderer;
