/**
 * LabTech GeoLab - Proctor Compaction Test Module
 * Handles section navigation and complex data calculations for Standard Proctor Compaction Test
 */
declare class ProctorTestController {
    private currentSectionIndex;
    private sections;
    constructor();
    /**
     * Initialize event listeners for proctor test
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
     * Set up calculation logic
     */
    private setupCalculations;
    /**
     * Calculate dry density table data
     */
    private calculateDryDensityData;
    /**
     * Calculate moisture content table data
     */
    private calculateMoistureContentData;
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
    /**
     * Export data for analysis (could be extended for data persistence)
     */
    exportData(): any;
    /**
     * Calculate optimal moisture content and maximum dry density
     */
    getOptimalValues(): {
        optimalMoisture: number;
        maxDryDensity: number;
    };
}
