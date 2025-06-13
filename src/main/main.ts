import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import { isDev } from '../shared/utils/environment';
import { DatabaseService } from './services/DatabaseService';
import { SecurityService } from './services/SecurityService';

class ElectronApp {
  private mainWindow: BrowserWindow | null = null;
  private databaseService: DatabaseService;
  private securityService: SecurityService;

  constructor() {
    this.databaseService = new DatabaseService();
    this.securityService = new SecurityService();
    this.initializeApp();
  }

  private initializeApp(): void {
    // Ensure single instance
    if (!app.requestSingleInstanceLock()) {
      app.quit();
      return;
    }

    app.whenReady().then(async () => {
      try {
        await this.initializeServices();
        await this.createWindow();
        this.setupMenu();
        this.setupAutoUpdater();
        this.setupIPC();
      } catch (error) {
        console.error('Failed to initialize app:', error);
        app.quit();
      }
    });

    app.on('second-instance', () => {
      // Someone tried to run a second instance, focus our window instead
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) this.mainWindow.restore();
        this.mainWindow.focus();
      }
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await this.createWindow();
      }
    });

    app.on('before-quit', async () => {
      await this.cleanup();
    });
  }

  private async initializeServices(): Promise<void> {
    await this.databaseService.initialize();
    this.securityService.initialize();
  }

  private async createWindow(): Promise<void> {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      show: false, // Don't show until ready
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        sandbox: false,
        webSecurity: !isDev,
      },
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      icon: process.platform === 'linux' ? path.join(__dirname, '../../assets/icon.png') : undefined,
    });

    // Load the app
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../index.html'));
    }

    // Show window when ready to prevent visual flash
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private setupMenu(): void {
    if (process.platform === 'darwin') {
      const template = [
        {
          label: app.getName(),
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideothers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' },
          ],
        },
        {
          label: 'Edit',
          submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'selectall' },
          ],
        },
        {
          label: 'View',
          submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' },
          ],
        },
      ];
      
      Menu.setApplicationMenu(Menu.buildFromTemplate(template as any));
    } else {
      Menu.setApplicationMenu(null);
    }
  }

  private setupAutoUpdater(): void {
    if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  }

  private setupIPC(): void {
    // App info
    ipcMain.handle('app:getVersion', () => {
      return app.getVersion();
    });

    ipcMain.handle('app:getPlatform', () => {
      return process.platform;
    });

    // Window controls
    ipcMain.handle('window:minimize', () => {
      this.mainWindow?.minimize();
    });

    ipcMain.handle('window:maximize', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow?.maximize();
      }
    });

    ipcMain.handle('window:close', () => {
      this.mainWindow?.close();
    });

    // Database operations
    ipcMain.handle('db:query', async (event, query: string, params?: any[]) => {
      return this.databaseService.query(query, params);
    });

    // Security operations
    ipcMain.handle('security:encrypt', async (event, data: string) => {
      return this.securityService.encrypt(data);
    });

    ipcMain.handle('security:decrypt', async (event, encryptedData: string) => {
      return this.securityService.decrypt(encryptedData);
    });

    // Error handling
    ipcMain.handle('app:reportError', (event, error: any) => {
      console.error('Renderer process error:', error);
    });
  }

  private async cleanup(): Promise<void> {
    try {
      await this.databaseService.close();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Initialize the application
new ElectronApp();
