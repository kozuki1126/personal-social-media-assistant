import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import { isDev } from '../shared/utils/environment';
import { DatabaseService, SecurityService, SettingsService, ServiceContainer, SERVICE_NAMES } from './services';

class ElectronApp {
  private mainWindow: BrowserWindow | null = null;
  private serviceContainer: ServiceContainer;
  private databaseService!: DatabaseService;
  private securityService!: SecurityService;
  private settingsService!: SettingsService;

  constructor() {
    this.serviceContainer = ServiceContainer.getInstance();
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
    console.log('Initializing services...');
    
    // Initialize database service
    this.databaseService = new DatabaseService();
    await this.databaseService.initialize();
    this.serviceContainer.register(SERVICE_NAMES.DATABASE, this.databaseService);
    
    // Initialize security service
    this.securityService = new SecurityService();
    this.securityService.initialize();
    this.serviceContainer.register(SERVICE_NAMES.SECURITY, this.securityService);
    
    // Initialize settings service
    this.settingsService = new SettingsService(this.databaseService, this.securityService);
    this.serviceContainer.register(SERVICE_NAMES.SETTINGS, this.settingsService);
    
    console.log('All services initialized successfully');
  }

  private async createWindow(): Promise<void> {
    // Get window settings
    const windowWidth = await this.settingsService.get('window_width', 1200);
    const windowHeight = await this.settingsService.get('window_height', 800);
    const windowX = await this.settingsService.get('window_x');
    const windowY = await this.settingsService.get('window_y');
    const isMaximized = await this.settingsService.get('window_maximized', false);

    this.mainWindow = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x: windowX,
      y: windowY,
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

    // Restore window state
    if (isMaximized) {
      this.mainWindow.maximize();
    }

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

    // Save window state on changes
    this.mainWindow.on('resize', () => this.saveWindowState());
    this.mainWindow.on('move', () => this.saveWindowState());
    this.mainWindow.on('maximize', () => this.saveWindowState());
    this.mainWindow.on('unmaximize', () => this.saveWindowState());

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private async saveWindowState(): Promise<void> {
    if (!this.mainWindow || !this.settingsService) return;

    try {
      const bounds = this.mainWindow.getBounds();
      const isMaximized = this.mainWindow.isMaximized();

      await Promise.all([
        this.settingsService.set('window_width', bounds.width),
        this.settingsService.set('window_height', bounds.height),
        this.settingsService.set('window_x', bounds.x),
        this.settingsService.set('window_y', bounds.y),
        this.settingsService.set('window_maximized', isMaximized),
      ]);
    } catch (error) {
      console.error('Failed to save window state:', error);
    }
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

    ipcMain.handle('db:stats', async () => {
      return this.databaseService.getStats();
    });

    ipcMain.handle('db:healthCheck', async () => {
      return this.databaseService.healthCheck();
    });

    // Settings operations
    ipcMain.handle('settings:get', async (event, key: string, defaultValue?: any) => {
      return this.settingsService.get(key, defaultValue);
    });

    ipcMain.handle('settings:set', async (event, key: string, value: any, encrypt?: boolean) => {
      return this.settingsService.set(key, value, encrypt);
    });

    ipcMain.handle('settings:delete', async (event, key: string) => {
      return this.settingsService.delete(key);
    });

    ipcMain.handle('settings:getAppSettings', async () => {
      return this.settingsService.getAppSettings();
    });

    ipcMain.handle('settings:updateAppSettings', async (event, settings: any) => {
      return this.settingsService.updateAppSettings(settings);
    });

    ipcMain.handle('settings:createBackup', async () => {
      return this.settingsService.createBackup();
    });

    ipcMain.handle('settings:restoreFromBackup', async (event, backupData: string) => {
      return this.settingsService.restoreFromBackup(backupData);
    });

    ipcMain.handle('settings:reset', async () => {
      return this.settingsService.reset();
    });

    // Security operations
    ipcMain.handle('security:encrypt', async (event, data: string) => {
      return this.securityService.encrypt(data);
    });

    ipcMain.handle('security:decrypt', async (event, encryptedData: string) => {
      return this.securityService.decrypt(encryptedData);
    });

    ipcMain.handle('security:hash', async (event, data: string, salt?: string) => {
      return this.securityService.hash(data, salt);
    });

    ipcMain.handle('security:verifyHash', async (event, data: string, hash: string, salt: string) => {
      return this.securityService.verifyHash(data, hash, salt);
    });

    // Error handling
    ipcMain.handle('app:reportError', (event, error: any) => {
      const sanitizedError = this.securityService.sanitizeForLogging(error);
      console.error('Renderer process error:', sanitizedError);
    });

    // System info
    ipcMain.handle('system:getInfo', () => {
      return {
        platform: process.platform,
        arch: process.arch,
        version: process.version,
        electronVersion: process.versions.electron,
        chromeVersion: process.versions.chrome,
      };
    });
  }

  private async cleanup(): Promise<void> {
    try {
      console.log('Cleaning up services...');
      
      // Save final window state
      await this.saveWindowState();
      
      // Close services
      await this.databaseService.close();
      this.serviceContainer.clear();
      
      console.log('Cleanup completed successfully');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Initialize the application
new ElectronApp();
