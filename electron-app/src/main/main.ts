import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';

class LabTechGeoLabApp {
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.initializeApp();
  }

  /**
   * Initialize the Electron application
   */
  private initializeApp(): void {
    // This method will be called when Electron has finished initialization
    app.whenReady().then(() => {
      this.createWindow();

      // On macOS, re-create a window when the dock icon is clicked
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow();
        }
      });
    });

    // Quit when all windows are closed, except on macOS
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // Set up IPC handlers
    this.setupIpcHandlers();
  }

  /**
   * Create the main application window
   */
  private createWindow(): void {
    // Create the browser window with mobile-like dimensions
    this.mainWindow = new BrowserWindow({
      width: 420,
      height: 880,
      resizable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../renderer/ts/preload.js')
      },
      titleBarStyle: 'default',
      title: 'LabTech GeoLab',
      icon: path.join(__dirname, '../renderer/assets/icons/app-icon.png')
    });

    // Load the index.html file (UI1 - START screen)
    const rendererPath = isDev 
      ? path.join(__dirname, '../../src/renderer')
      : path.join(__dirname, '../renderer');
      
    this.mainWindow.loadFile(path.join(rendererPath, 'index.html'));

    // Open DevTools in development
    if (isDev) {
      this.mainWindow.webContents.openDevTools();
    }

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  /**
   * Set up IPC (Inter-Process Communication) handlers
   */
  private setupIpcHandlers(): void {
    // Handle navigation requests from renderer process
    ipcMain.handle('navigate-to', (event, page: string) => {
      if (this.mainWindow) {
        const rendererPath = isDev 
          ? path.join(__dirname, '../../src/renderer')
          : path.join(__dirname, '../renderer');
        const pagePath = path.join(rendererPath, page);
        this.mainWindow.loadFile(pagePath);
      }
    });

    // Handle application quit request
    ipcMain.on('quit-app', () => {
      app.quit();
    });

    // Handle window management requests
    ipcMain.handle('get-window-bounds', () => {
      return this.mainWindow?.getBounds();
    });

    // Handle development mode check
    ipcMain.handle('is-dev', () => {
      return isDev;
    });
  }

  /**
   * Get the main window instance
   */
  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }
}

// Create and start the application
const labTechApp = new LabTechGeoLabApp();

// Handle certificate errors in development
if (isDev) {
  app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    event.preventDefault();
    callback(true);
  });
}

export default labTechApp;
