import { contextBridge, ipcRenderer } from 'electron';
import { AppSettings } from '../shared/types/app';

// Define the API that will be exposed to the renderer process
const electronAPI = {
  // App methods
  app: {
    getVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),
    getPlatform: (): Promise<string> => ipcRenderer.invoke('app:getPlatform'),
    reportError: (error: any): Promise<void> => ipcRenderer.invoke('app:reportError', error),
  },

  // System methods
  system: {
    getInfo: (): Promise<any> => ipcRenderer.invoke('system:getInfo'),
  },

  // Window controls
  window: {
    minimize: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
    maximize: (): Promise<void> => ipcRenderer.invoke('window:maximize'),
    close: (): Promise<void> => ipcRenderer.invoke('window:close'),
  },

  // Database operations
  database: {
    query: (query: string, params?: any[]): Promise<any> => 
      ipcRenderer.invoke('db:query', query, params),
    getStats: (): Promise<any> => ipcRenderer.invoke('db:stats'),
    healthCheck: (): Promise<boolean> => ipcRenderer.invoke('db:healthCheck'),
  },

  // Settings operations
  settings: {
    get: <T = any>(key: string, defaultValue?: T): Promise<T | undefined> => 
      ipcRenderer.invoke('settings:get', key, defaultValue),
    set: (key: string, value: any, encrypt?: boolean): Promise<void> => 
      ipcRenderer.invoke('settings:set', key, value, encrypt),
    delete: (key: string): Promise<void> => 
      ipcRenderer.invoke('settings:delete', key),
    getAppSettings: (): Promise<Partial<AppSettings>> => 
      ipcRenderer.invoke('settings:getAppSettings'),
    updateAppSettings: (settings: Partial<AppSettings>): Promise<void> => 
      ipcRenderer.invoke('settings:updateAppSettings', settings),
    createBackup: (): Promise<string> => 
      ipcRenderer.invoke('settings:createBackup'),
    restoreFromBackup: (backupData: string): Promise<void> => 
      ipcRenderer.invoke('settings:restoreFromBackup', backupData),
    reset: (): Promise<void> => 
      ipcRenderer.invoke('settings:reset'),
  },

  // Security operations
  security: {
    encrypt: (data: string): Promise<string> => 
      ipcRenderer.invoke('security:encrypt', data),
    decrypt: (encryptedData: string): Promise<string> => 
      ipcRenderer.invoke('security:decrypt', encryptedData),
    hash: (data: string, salt?: string): Promise<{ hash: string; salt: string }> => 
      ipcRenderer.invoke('security:hash', data, salt),
    verifyHash: (data: string, hash: string, salt: string): Promise<boolean> => 
      ipcRenderer.invoke('security:verifyHash', data, hash, salt),
  },

  // Notifications (handled by renderer)
  notifications: {
    show: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): Promise<void> => {
      // This will be handled by the renderer process notification system
      return Promise.resolve();
    },
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for TypeScript
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
