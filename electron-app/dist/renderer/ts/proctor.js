"use strict";
/**
 * LabTech GeoLab - Proctor Compaction Test Module
 * Handles section navigation and complex data calculations for Standard Proctor Compaction Test
 */
class ProctorTestController {
    constructor() {
        this.currentSectionIndex = 0;
        this.sections = [
            'objectives',
            'theory',
            'apparatus',
            'procedure',
            'data-results',
            'calculation',
            'discussion',
            'conclusion'
        ];
        this.initializeEventListeners();
        this.setupCalculations();
    }
    /**
     * Initialize event listeners for proctor test
     */
    initializeEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupNavigationButtons();
            this.setupDataInputListeners();
            console.log('Proctor Test controller initialized');
        });
    }
    /**
     * Set up navigation button event listeners
     */
    setupNavigationButtons() {
        const backBtn = document.getElementById('proctor-back-btn');
        const nextBtn = document.getElementById('proctor-next-btn');
        const homeBtn = document.getElementById('proctor-home-btn');
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
    setupDataInputListeners() {
        // Listen for changes in dry density table inputs
        const m1Inputs = document.querySelectorAll('.m1');
        const m2Inputs = document.querySelectorAll('.m2');
        const volumeInputs = document.querySelectorAll('.volume');
        [m1Inputs, m2Inputs, volumeInputs].forEach(nodeList => {
            nodeList.forEach(input => {
                input.addEventListener('input', () => this.calculateDryDensityData());
            });
        });
        // Listen for changes in moisture content table inputs
        const c1Inputs = document.querySelectorAll('.c1');
        const c2Inputs = document.querySelectorAll('.c2');
        const c3Inputs = document.querySelectorAll('.c3');
        [c1Inputs, c2Inputs, c3Inputs].forEach(nodeList => {
            nodeList.forEach(input => {
                input.addEventListener('input', () => this.calculateMoistureContentData());
            });
        });
    }
    /**
     * Navigate to previous section
     */
    navigateBack() {
        if (this.currentSectionIndex > 0) {
            this.currentSectionIndex--;
            this.showCurrentSection();
            this.updateNavigationButtons();
        }
    }
    /**
     * Navigate to next section
     */
    navigateNext() {
        if (this.currentSectionIndex < this.sections.length - 1) {
            this.currentSectionIndex++;
            this.showCurrentSection();
            this.updateNavigationButtons();
        }
        else {
            // Navigate to end screen after last section
            this.navigateToEnd();
        }
    }
    /**
     * Navigate to homepage
     */
    async navigateHome() {
        try {
            await window.electronAPI.navigateTo('homepage.html');
        }
        catch (error) {
            console.error('Navigation error:', error);
        }
    }
    /**
     * Navigate to end screen
     */
    async navigateToEnd() {
        try {
            await window.electronAPI.navigateTo('end.html');
        }
        catch (error) {
            console.error('Navigation error:', error);
        }
    }
    /**
     * Show the current section and hide others
     */
    showCurrentSection() {
        this.sections.forEach((sectionId, index) => {
            const section = document.getElementById(sectionId);
            if (section) {
                if (index === this.currentSectionIndex) {
                    section.classList.add('active');
                    section.style.display = 'block';
                }
                else {
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
    updateNavigationButtons() {
        const backBtn = document.getElementById('proctor-back-btn');
        const nextBtn = document.getElementById('proctor-next-btn');
        if (backBtn) {
            backBtn.disabled = this.currentSectionIndex === 0;
            if (this.currentSectionIndex === 0) {
                backBtn.classList.add('disabled');
            }
            else {
                backBtn.classList.remove('disabled');
            }
        }
        if (nextBtn) {
            if (this.currentSectionIndex === this.sections.length - 1) {
                nextBtn.textContent = 'Finish';
            }
            else {
                nextBtn.textContent = 'Next';
            }
        }
    }
    /**
     * Set up calculation logic
     */
    setupCalculations() {
        // Calculations will be triggered by input events
        console.log('Proctor calculations ready');
    }
    /**
     * Calculate dry density table data
     */
    calculateDryDensityData() {
        const m1Inputs = document.querySelectorAll('.m1');
        const m2Inputs = document.querySelectorAll('.m2');
        const volumeInputs = document.querySelectorAll('.volume');
        const specimenMassInputs = document.querySelectorAll('.specimen-mass');
        const bulkDensityInputs = document.querySelectorAll('.bulk-density');
        const dryDensityInputs = document.querySelectorAll('.dry-density');
        const moistureContentDisplayInputs = document.querySelectorAll('.moisture-content-display');
        // Process each test (column)
        for (let i = 0; i < 5; i++) {
            if (m1Inputs[i] && m2Inputs[i] && volumeInputs[i]) {
                const m1 = this.parseNumber(m1Inputs[i].value);
                const m2 = this.parseNumber(m2Inputs[i].value);
                const volume = this.parseNumber(volumeInputs[i].value);
                // Calculate specimen mass (m2 - m1)
                const specimenMass = m2 - m1;
                if (specimenMassInputs[i]) {
                    specimenMassInputs[i].value = this.formatNumber(specimenMass);
                }
                // Calculate bulk density (specimen mass / volume) - convert to g/cm³
                let bulkDensity = 0;
                if (volume > 0) {
                    bulkDensity = (specimenMass * 1000) / volume; // Convert kg to g and divide by cm³
                }
                if (bulkDensityInputs[i]) {
                    bulkDensityInputs[i].value = this.formatNumber(bulkDensity, 3);
                }
                // Get moisture content from moisture content table for dry density calculation
                const moistureContentInputs = document.querySelectorAll('.moisture-content');
                let moistureContent = 0;
                if (moistureContentInputs[i]) {
                    moistureContent = this.parseNumber(moistureContentInputs[i].value);
                }
                // Display moisture content in dry density table
                if (moistureContentDisplayInputs[i]) {
                    moistureContentDisplayInputs[i].value = this.formatNumber(moistureContent);
                }
                // Calculate dry density: ρd = ρb / (1 + w)
                // where w is moisture content as decimal (percentage / 100)
                const w = moistureContent / 100;
                const dryDensity = bulkDensity / (1 + w);
                if (dryDensityInputs[i]) {
                    dryDensityInputs[i].value = this.formatNumber(dryDensity, 3);
                }
            }
        }
    }
    /**
     * Calculate moisture content table data
     */
    calculateMoistureContentData() {
        const c1Inputs = document.querySelectorAll('.c1');
        const c2Inputs = document.querySelectorAll('.c2');
        const c3Inputs = document.querySelectorAll('.c3');
        const massMoistureInputs = document.querySelectorAll('.mass-moisture');
        const massDrySoilInputs = document.querySelectorAll('.mass-dry-soil');
        const moistureContentInputs = document.querySelectorAll('.moisture-content');
        // Process each container (column)
        for (let i = 0; i < 5; i++) {
            if (c1Inputs[i] && c2Inputs[i] && c3Inputs[i]) {
                const c1 = this.parseNumber(c1Inputs[i].value); // Mass of container
                const c2 = this.parseNumber(c2Inputs[i].value); // Mass of container + wet soil
                const c3 = this.parseNumber(c3Inputs[i].value); // Mass of container + dry soil
                // Calculate mass of moisture (c2 - c3)
                const massMoisture = c2 - c3;
                if (massMoistureInputs[i]) {
                    massMoistureInputs[i].value = this.formatNumber(massMoisture);
                }
                // Calculate mass of dry soil (c3 - c1)
                const massDrySoil = c3 - c1;
                if (massDrySoilInputs[i]) {
                    massDrySoilInputs[i].value = this.formatNumber(massDrySoil);
                }
                // Calculate moisture content: w = (c2 - c3) / (c3 - c1) × 100%
                let moistureContent = 0;
                if (massDrySoil > 0) {
                    moistureContent = (massMoisture / massDrySoil) * 100;
                }
                if (moistureContentInputs[i]) {
                    moistureContentInputs[i].value = this.formatNumber(moistureContent);
                }
            }
        }
        // Trigger dry density recalculation since moisture content changed
        this.calculateDryDensityData();
    }
    /**
     * Parse number input safely
     */
    parseNumber(input) {
        if (!input || input.trim() === '')
            return 0;
        const parsed = parseFloat(input);
        return isNaN(parsed) ? 0 : parsed;
    }
    /**
     * Format number for display
     */
    formatNumber(value, decimals = 2) {
        if (isNaN(value))
            return '';
        return value.toFixed(decimals);
    }
    /**
     * Get current section name for debugging
     */
    getCurrentSection() {
        return this.sections[this.currentSectionIndex];
    }
    /**
     * Jump to specific section (for debugging/testing)
     */
    jumpToSection(sectionIndex) {
        if (sectionIndex >= 0 && sectionIndex < this.sections.length) {
            this.currentSectionIndex = sectionIndex;
            this.showCurrentSection();
            this.updateNavigationButtons();
        }
    }
    /**
     * Export data for analysis (could be extended for data persistence)
     */
    exportData() {
        const data = {
            dryDensityData: [],
            moistureContentData: [],
            timestamp: new Date().toISOString()
        };
        // Collect dry density data
        const m1Inputs = document.querySelectorAll('.m1');
        const m2Inputs = document.querySelectorAll('.m2');
        const volumeInputs = document.querySelectorAll('.volume');
        const dryDensityInputs = document.querySelectorAll('.dry-density');
        for (let i = 0; i < 5; i++) {
            data.dryDensityData.push({
                testNumber: i + 1,
                m1: this.parseNumber(m1Inputs[i]?.value || '0'),
                m2: this.parseNumber(m2Inputs[i]?.value || '0'),
                volume: this.parseNumber(volumeInputs[i]?.value || '1000'),
                dryDensity: this.parseNumber(dryDensityInputs[i]?.value || '0')
            });
        }
        // Collect moisture content data
        const moistureContentInputs = document.querySelectorAll('.moisture-content');
        for (let i = 0; i < 5; i++) {
            data.moistureContentData.push({
                containerNumber: i + 1,
                moistureContent: this.parseNumber(moistureContentInputs[i]?.value || '0')
            });
        }
        return data;
    }
    /**
     * Calculate optimal moisture content and maximum dry density
     */
    getOptimalValues() {
        const moistureContentInputs = document.querySelectorAll('.moisture-content');
        const dryDensityInputs = document.querySelectorAll('.dry-density');
        let maxDryDensity = 0;
        let optimalMoisture = 0;
        for (let i = 0; i < 5; i++) {
            const moisture = this.parseNumber(moistureContentInputs[i]?.value || '0');
            const dryDensity = this.parseNumber(dryDensityInputs[i]?.value || '0');
            if (dryDensity > maxDryDensity) {
                maxDryDensity = dryDensity;
                optimalMoisture = moisture;
            }
        }
        return { optimalMoisture, maxDryDensity };
    }
}
// Initialize the proctor test controller when the script loads
document.addEventListener('DOMContentLoaded', () => {
    const proctorController = new ProctorTestController();
    // Make it available globally for debugging
    window.proctorController = proctorController;
});
