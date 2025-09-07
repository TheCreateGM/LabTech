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
