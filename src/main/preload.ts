import { contextBridge, ipcRenderer } from 'electron';

// Define the API that will be exposed to the renderer process
const electronAPI = {
  // App methods
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
    reportError: (error: any) => ipcRenderer.invoke('app:reportError', error),
  },

  // Window controls
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
  },

  // Database operations
  database: {
    query: (query: string, params?: any[]) => ipcRenderer.invoke('db:query', query, params),
  },

  // Security operations
  security: {
    encrypt: (data: string) => ipcRenderer.invoke('security:encrypt', data),
    decrypt: (encryptedData: string) => ipcRenderer.invoke('security:decrypt', encryptedData),
  },

  // Notifications
  notifications: {
    show: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
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
