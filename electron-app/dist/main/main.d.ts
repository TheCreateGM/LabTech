import { BrowserWindow } from 'electron';
declare class LabTechGeoLabApp {
    private mainWindow;
    constructor();
    /**
     * Initialize the Electron application
     */
    private initializeApp;
    /**
     * Create the main application window
     */
    private createWindow;
    /**
     * Set up IPC (Inter-Process Communication) handlers
     */
    private setupIpcHandlers;
    /**
     * Get the main window instance
     */
    getMainWindow(): BrowserWindow | null;
}
declare const labTechApp: LabTechGeoLabApp;
export default labTechApp;
