/**
 * LabTech GeoLab - Sieve Analysis Module
 * Handles section navigation and data calculations for grain size sieve analysis
 */
declare class SieveAnalysisController {
    private currentSectionIndex;
    private sections;
    constructor();
    /**
     * Initialize event listeners for sieve analysis
     */
    private initializeEventListeners;
    /**
     * Set up navigation button event listeners
     */
    private setupNavigationButtons;
    /**
     * Set up data input event listeners for calculations
     */
    private setupDataInputListeners;
    /**
     * Navigate to previous section
     */
    private navigateBack;
    /**
     * Navigate to next section
     */
    private navigateNext;
    /**
     * Navigate to homepage
     */
    private navigateHome;
    /**
     * Navigate to end screen
     */
    private navigateToEnd;
    /**
     * Show the current section and hide others
     */
    private showCurrentSection;
    /**
     * Update navigation button states
     */
    private updateNavigationButtons;
    /**
     * Set up calculation logic for sieve data
     */
    private setupCalculations;
    /**
     * Calculate sieve analysis data when inputs change
     */
    private calculateSieveData;
    /**
     * Update summary fields (total mass after sieving and losses)
     */
    private updateSummaryFields;
    /**
     * Clear all calculated values
     */
    private clearCalculatedValues;
    /**
     * Get input value safely
     */
    private getInputValue;
    /**
     * Parse number input safely
     */
    private parseNumber;
    /**
     * Format number for display
     */
    private formatNumber;
    /**
     * Get current section name for debugging
     */
    getCurrentSection(): string;
    /**
     * Jump to specific section (for debugging/testing)
     */
    jumpToSection(sectionIndex: number): void;
}
