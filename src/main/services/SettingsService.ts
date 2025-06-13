import { PrismaClient } from '@prisma/client';
import { SecurityService } from './SecurityService';
import { DatabaseService } from './DatabaseService';
import { AppSettings } from '../../shared/types/app';

export class SettingsService {
  private databaseService: DatabaseService;
  private securityService: SecurityService;
  private cache = new Map<string, { value: any; encrypted: boolean; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(databaseService: DatabaseService, securityService: SecurityService) {
    this.databaseService = databaseService;
    this.securityService = securityService;
  }

  /**
   * Get a setting value by key
   */
  async get<T = string>(key: string, defaultValue?: T): Promise<T | undefined> {
    try {
      // Check cache first
      const cached = this.getCachedValue<T>(key);
      if (cached !== null) {
        return cached;
      }

      const prisma = this.databaseService.getPrismaClient();
      const setting = await prisma.setting.findUnique({
        where: { key },
      });

      if (!setting || setting.value === null) {
        return defaultValue;
      }

      let value: T;
      if (setting.isEncrypted) {
        const decrypted = this.securityService.decrypt(setting.value);
        value = this.parseValue<T>(decrypted);
      } else {
        value = this.parseValue<T>(setting.value);
      }

      // Cache the value
      this.setCachedValue(key, value, setting.isEncrypted);
      
      return value;
    } catch (error) {
      console.error(`Failed to get setting ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Set a setting value
   */
  async set(key: string, value: any, encrypt: boolean = false): Promise<void> {
    try {
      const stringValue = this.stringifyValue(value);
      const finalValue = encrypt ? this.securityService.encrypt(stringValue) : stringValue;

      const prisma = this.databaseService.getPrismaClient();
      await prisma.setting.upsert({
        where: { key },
        create: {
          key,
          value: finalValue,
          isEncrypted: encrypt,
        },
        update: {
          value: finalValue,
          isEncrypted: encrypt,
          updatedAt: new Date(),
        },
      });

      // Update cache
      this.setCachedValue(key, value, encrypt);
    } catch (error) {
      console.error(`Failed to set setting ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete a setting
   */
  async delete(key: string): Promise<void> {
    try {
      const prisma = this.databaseService.getPrismaClient();
      await prisma.setting.delete({
        where: { key },
      });

      // Remove from cache
      this.cache.delete(key);
    } catch (error) {
      console.error(`Failed to delete setting ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get all settings (for export/backup)
   */
  async getAll(includeEncrypted: boolean = false): Promise<Record<string, any>> {
    try {
      const prisma = this.databaseService.getPrismaClient();
      const settings = await prisma.setting.findMany();
      
      const result: Record<string, any> = {};
      
      for (const setting of settings) {
        if (!includeEncrypted && setting.isEncrypted) {
          result[setting.key] = '[ENCRYPTED]';
          continue;
        }
        
        if (setting.value === null) {
          result[setting.key] = null;
          continue;
        }
        
        try {
          if (setting.isEncrypted) {
            const decrypted = this.securityService.decrypt(setting.value);
            result[setting.key] = this.parseValue(decrypted);
          } else {
            result[setting.key] = this.parseValue(setting.value);
          }
        } catch (decryptError) {
          console.error(`Failed to decrypt setting ${setting.key}:`, decryptError);
          result[setting.key] = '[DECRYPT_ERROR]';
        }
      }
      
      return result;
    } catch (error) {
      console.error('Failed to get all settings:', error);
      throw error;
    }
  }

  /**
   * Import settings from a backup
   */
  async importSettings(settings: Record<string, any>, encryptSensitive: boolean = true): Promise<void> {
    try {
      const sensitiveKeys = this.getSensitiveKeys();
      
      for (const [key, value] of Object.entries(settings)) {
        if (value === '[ENCRYPTED]' || value === '[DECRYPT_ERROR]') {
          continue; // Skip encrypted or corrupted values
        }
        
        const shouldEncrypt = encryptSensitive && sensitiveKeys.includes(key);
        await this.set(key, value, shouldEncrypt);
      }
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw error;
    }
  }

  /**
   * Get application settings with proper typing
   */
  async getAppSettings(): Promise<Partial<AppSettings>> {
    const settings: Partial<AppSettings> = {};
    
    try {
      // API Keys (encrypted)
      settings.newsApiKey = await this.get('news_api_key');
      settings.openaiApiKey = await this.get('openai_api_key');
      settings.xApiKey = await this.get('x_api_key');
      settings.xApiSecret = await this.get('x_api_secret');
      settings.xBearerToken = await this.get('x_bearer_token');
      
      // Collection settings
      settings.autoCollectionEnabled = await this.get('auto_collection_enabled', false);
      settings.collectionInterval = await this.get('collection_interval', 24);
      settings.maxArticlesPerTheme = await this.get('max_articles_per_theme', 20);
      
      // Generation settings
      settings.defaultTone = await this.get('default_tone', 'casual') as 'casual' | 'formal' | 'explanatory';
      settings.maxCharacterCount = await this.get('max_character_count', 280);
      settings.includeHashtagSuggestions = await this.get('include_hashtag_suggestions', true);
      
      // Notification settings
      settings.enableNotifications = await this.get('enable_notifications', true);
      settings.reminderEnabled = await this.get('reminder_enabled', true);
      settings.defaultReminderMinutes = await this.get('default_reminder_minutes', 10);
      
      // UI settings
      settings.theme = await this.get('theme', 'auto') as 'light' | 'dark' | 'auto';
      settings.sidebarCollapsed = await this.get('sidebar_collapsed', false);
      settings.compactMode = await this.get('compact_mode', false);
      
      // Data management
      settings.autoBackupEnabled = await this.get('auto_backup_enabled', true);
      settings.backupInterval = await this.get('backup_interval', 7);
      settings.maxBackups = await this.get('max_backups', 5);
      
      // Security settings
      settings.sessionTimeout = await this.get('session_timeout', 30);
      settings.requireConfirmation = await this.get('require_confirmation', true);
      
      return settings;
    } catch (error) {
      console.error('Failed to get app settings:', error);
      return {};
    }
  }

  /**
   * Update application settings
   */
  async updateAppSettings(settings: Partial<AppSettings>): Promise<void> {
    try {
      const sensitiveKeys = this.getSensitiveKeys();
      
      for (const [key, value] of Object.entries(settings)) {
        if (value === undefined) continue;
        
        const settingKey = this.camelToSnakeCase(key);
        const shouldEncrypt = sensitiveKeys.includes(settingKey);
        
        await this.set(settingKey, value, shouldEncrypt);
      }
    } catch (error) {
      console.error('Failed to update app settings:', error);
      throw error;
    }
  }

  /**
   * Clear all cached values
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cached value if still valid
   */
  private getCachedValue<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.value as T;
  }

  /**
   * Set cached value
   */
  private setCachedValue(key: string, value: any, encrypted: boolean): void {
    this.cache.set(key, {
      value,
      encrypted,
      timestamp: Date.now(),
    });
  }

  /**
   * Parse string value to appropriate type
   */
  private parseValue<T>(value: string): T {
    try {
      // Try to parse as JSON first
      return JSON.parse(value) as T;
    } catch {
      // If parsing fails, return as string
      return value as unknown as T;
    }
  }

  /**
   * Convert value to string for storage
   */
  private stringifyValue(value: any): string {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value);
  }

  /**
   * Get list of sensitive setting keys that should be encrypted
   */
  private getSensitiveKeys(): string[] {
    return [
      'news_api_key',
      'openai_api_key',
      'x_api_key',
      'x_api_secret',
      'x_bearer_token',
    ];
  }

  /**
   * Convert camelCase to snake_case
   */
  private camelToSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
  }

  /**
   * Reset all settings to default values
   */
  async reset(): Promise<void> {
    try {
      const prisma = this.databaseService.getPrismaClient();
      await prisma.setting.deleteMany();
      this.clearCache();
      console.log('All settings have been reset');
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  }

  /**
   * Backup settings to file
   */
  async createBackup(): Promise<string> {
    try {
      const settings = await this.getAll(false); // Don't include encrypted values in backup
      const backup = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        settings,
      };
      
      return JSON.stringify(backup, null, 2);
    } catch (error) {
      console.error('Failed to create settings backup:', error);
      throw error;
    }
  }

  /**
   * Restore settings from backup
   */
  async restoreFromBackup(backupData: string): Promise<void> {
    try {
      const backup = JSON.parse(backupData);
      
      if (!backup.settings) {
        throw new Error('Invalid backup format');
      }
      
      await this.importSettings(backup.settings, true);
      console.log('Settings restored from backup successfully');
    } catch (error) {
      console.error('Failed to restore settings from backup:', error);
      throw error;
    }
  }
}
