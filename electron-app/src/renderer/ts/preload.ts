import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload script to securely expose IPC functionality to renderer process
 * This runs in a privileged context and bridges the gap between main and renderer
 */

// Define the API that will be exposed to the renderer process
const electronAPI = {
  // Navigation functions
  navigateTo: (page: string) => ipcRenderer.invoke('navigate-to', page),
  
  // Application control
  quitApp: () => ipcRenderer.send('quit-app'),
  
  // Utility functions
  getWindowBounds: () => ipcRenderer.invoke('get-window-bounds'),
  isDev: () => ipcRenderer.invoke('is-dev'),
  
  // Event listeners for renderer
  onNavigate: (callback: (page: string) => void) => {
    ipcRenderer.on('navigate', (_event, page) => callback(page));
  },
  
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Export the type for consistency
export type ElectronAPIType = typeof electronAPI;
