import { contextBridge, ipcRenderer } from 'electron';
import { AppSettings, ThemeFormData, DraftFormData, SearchFilters, SortOptions } from '../shared/types/app';

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

  // Theme operations
  themes: {
    getAll: (includeInactive?: boolean): Promise<any[]> => 
      ipcRenderer.invoke('themes:getAll', includeInactive),
    getById: (id: number): Promise<any> => 
      ipcRenderer.invoke('themes:getById', id),
    create: (data: ThemeFormData): Promise<any> => 
      ipcRenderer.invoke('themes:create', data),
    update: (id: number, data: Partial<ThemeFormData>): Promise<any> => 
      ipcRenderer.invoke('themes:update', id, data),
    delete: (id: number, soft?: boolean): Promise<void> => 
      ipcRenderer.invoke('themes:delete', id, soft),
    search: (query: string): Promise<any[]> => 
      ipcRenderer.invoke('themes:search', query),
    getForCollection: (): Promise<any[]> => 
      ipcRenderer.invoke('themes:getForCollection'),
    getStatistics: (): Promise<{ total: number; active: number; inactive: number; withArticles: number }> => 
      ipcRenderer.invoke('themes:getStatistics'),
    nameExists: (name: string, excludeId?: number): Promise<boolean> => 
      ipcRenderer.invoke('themes:nameExists', name, excludeId),
  },

  // Draft operations
  drafts: {
    getAll: (filters?: SearchFilters, sort?: SortOptions, pagination?: { page: number; limit: number }): Promise<any> => 
      ipcRenderer.invoke('drafts:getAll', filters, sort, pagination),
    getById: (id: number): Promise<any> => 
      ipcRenderer.invoke('drafts:getById', id),
    create: (data: DraftFormData): Promise<any> => 
      ipcRenderer.invoke('drafts:create', data),
    update: (id: number, data: Partial<DraftFormData>): Promise<any> => 
      ipcRenderer.invoke('drafts:update', id, data),
    delete: (id: number): Promise<void> => 
      ipcRenderer.invoke('drafts:delete', id),
    duplicate: (id: number): Promise<any> => 
      ipcRenderer.invoke('drafts:duplicate', id),
    getScheduled: (date?: string): Promise<any[]> => 
      ipcRenderer.invoke('drafts:getScheduled', date),
    getByCategory: (category: string): Promise<any[]> => 
      ipcRenderer.invoke('drafts:getByCategory', category),
    getCategories: (): Promise<string[]> => 
      ipcRenderer.invoke('drafts:getCategories'),
    search: (query: string): Promise<any[]> => 
      ipcRenderer.invoke('drafts:search', query),
    getStatistics: (): Promise<{ total: number; scheduled: number; templates: number; categories: number }> => 
      ipcRenderer.invoke('drafts:getStatistics'),
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
