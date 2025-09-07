"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
/**
 * Preload script to securely expose IPC functionality to renderer process
 * This runs in a privileged context and bridges the gap between main and renderer
 */
// Define the API that will be exposed to the renderer process
const electronAPI = {
    // Navigation functions
    navigateTo: (page) => electron_1.ipcRenderer.invoke('navigate-to', page),
    // Application control
    quitApp: () => electron_1.ipcRenderer.send('quit-app'),
    // Utility functions
    getWindowBounds: () => electron_1.ipcRenderer.invoke('get-window-bounds'),
    isDev: () => electron_1.ipcRenderer.invoke('is-dev'),
    // Event listeners for renderer
    onNavigate: (callback) => {
        electron_1.ipcRenderer.on('navigate', (_event, page) => callback(page));
    },
    removeAllListeners: (channel) => {
        electron_1.ipcRenderer.removeAllListeners(channel);
    }
};
// Expose the API to the renderer process
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
