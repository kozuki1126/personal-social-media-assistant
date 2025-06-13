/**
 * Environment utilities for determining runtime context
 */

// Check if running in development mode
export const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

// Check if running in Electron
export const isElectron = typeof window !== 'undefined' && window.electronAPI;

// Check if running in browser
export const isBrowser = typeof window !== 'undefined' && !window.electronAPI;

// Get app version
export const getAppVersion = (): string => {
  if (isElectron) {
    return window.electronAPI.app.getVersion();
  }
  return process.env.npm_package_version || '1.0.0';
};

// Get platform
export const getPlatform = (): string => {
  if (isElectron) {
    return window.electronAPI.app.getPlatform();
  }
  return process.platform;
};

// Environment-specific configuration
export const config = {
  isDev,
  isElectron,
  isBrowser,
  logLevel: isDev ? 'debug' : 'error',
  apiTimeout: 30000, // 30 seconds
  dbTimeout: 10000, // 10 seconds
  cacheTimeout: 30 * 60 * 1000, // 30 minutes
};
