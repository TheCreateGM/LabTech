"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const isDev = __importStar(require("electron-is-dev"));
class LabTechGeoLabApp {
    constructor() {
        this.mainWindow = null;
        this.initializeApp();
    }
    /**
     * Initialize the Electron application
     */
    initializeApp() {
        // This method will be called when Electron has finished initialization
        electron_1.app.whenReady().then(() => {
            this.createWindow();
            // On macOS, re-create a window when the dock icon is clicked
            electron_1.app.on('activate', () => {
                if (electron_1.BrowserWindow.getAllWindows().length === 0) {
                    this.createWindow();
                }
            });
        });
        // Quit when all windows are closed, except on macOS
        electron_1.app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                electron_1.app.quit();
            }
        });
        // Set up IPC handlers
        this.setupIpcHandlers();
    }
    /**
     * Create the main application window
     */
    createWindow() {
        // Create the browser window with mobile-like dimensions
        this.mainWindow = new electron_1.BrowserWindow({
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
    setupIpcHandlers() {
        // Handle navigation requests from renderer process
        electron_1.ipcMain.handle('navigate-to', (event, page) => {
            if (this.mainWindow) {
                const rendererPath = isDev
                    ? path.join(__dirname, '../../src/renderer')
                    : path.join(__dirname, '../renderer');
                const pagePath = path.join(rendererPath, page);
                this.mainWindow.loadFile(pagePath);
            }
        });
        // Handle application quit request
        electron_1.ipcMain.on('quit-app', () => {
            electron_1.app.quit();
        });
        // Handle window management requests
        electron_1.ipcMain.handle('get-window-bounds', () => {
            return this.mainWindow?.getBounds();
        });
        // Handle development mode check
        electron_1.ipcMain.handle('is-dev', () => {
            return isDev;
        });
    }
    /**
     * Get the main window instance
     */
    getMainWindow() {
        return this.mainWindow;
    }
}
// Create and start the application
const labTechApp = new LabTechGeoLabApp();
// Handle certificate errors in development
if (isDev) {
    electron_1.app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
        event.preventDefault();
        callback(true);
    });
}
exports.default = labTechApp;
