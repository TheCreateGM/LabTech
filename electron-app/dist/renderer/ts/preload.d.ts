/**
 * Preload script to securely expose IPC functionality to renderer process
 * This runs in a privileged context and bridges the gap between main and renderer
 */
declare const electronAPI: {
    navigateTo: (page: string) => Promise<any>;
    quitApp: () => void;
    getWindowBounds: () => Promise<any>;
    isDev: () => Promise<any>;
    onNavigate: (callback: (page: string) => void) => void;
    removeAllListeners: (channel: string) => void;
};
export type ElectronAPIType = typeof electronAPI;
export {};
