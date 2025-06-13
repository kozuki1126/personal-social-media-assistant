// Service exports for easy importing
export { DatabaseService } from './DatabaseService';
export { SecurityService } from './SecurityService';
export { SettingsService } from './SettingsService';
export { ThemeService } from './ThemeService';
export { DraftService } from './DraftService';

// Service factory for dependency injection
export class ServiceContainer {
  private static instance: ServiceContainer;
  private services = new Map<string, any>();

  private constructor() {}

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }
    return service as T;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }

  clear(): void {
    this.services.clear();
  }
}

// Service names constants
export const SERVICE_NAMES = {
  DATABASE: 'database',
  SECURITY: 'security',
  SETTINGS: 'settings',
  THEME: 'theme',
  DRAFT: 'draft',
} as const;
