import { PrismaClient } from '@prisma/client';
import path from 'path';
import { app } from 'electron';
import { isDev } from '../../shared/utils/environment';

export class DatabaseService {
  private prisma: PrismaClient | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Set database path based on environment
      const dbPath = this.getDatabasePath();
      
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: `file:${dbPath}`,
          },
        },
        log: isDev ? ['query', 'info', 'warn', 'error'] : ['error'],
      });

      // Test connection
      await this.prisma.$connect();
      
      // Run any pending migrations in production
      if (!isDev) {
        // Note: In production, we might want to run migrations differently
        console.log('Database connected successfully');
      }

      this.isInitialized = true;
      console.log('Database service initialized');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private getDatabasePath(): string {
    if (isDev) {
      return path.join(process.cwd(), 'prisma', 'dev.db');
    } else {
      // In production, store database in user data directory
      const userDataPath = app.getPath('userData');
      return path.join(userDataPath, 'database.db');
    }
  }

  async query(sql: string, params?: any[]): Promise<any> {
    if (!this.prisma) {
      throw new Error('Database not initialized');
    }

    try {
      return await this.prisma.$queryRawUnsafe(sql, ...(params || []));
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  getPrismaClient(): PrismaClient {
    if (!this.prisma) {
      throw new Error('Database not initialized');
    }
    return this.prisma;
  }

  async close(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.prisma = null;
      this.isInitialized = false;
      console.log('Database connection closed');
    }
  }

  // Helper methods for common operations
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.prisma) return false;
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async getTableInfo(tableName: string): Promise<any> {
    if (!this.prisma) {
      throw new Error('Database not initialized');
    }

    return await this.prisma.$queryRawUnsafe(
      `PRAGMA table_info(${tableName})`
    );
  }

  async vacuum(): Promise<void> {
    if (!this.prisma) {
      throw new Error('Database not initialized');
    }

    await this.prisma.$executeRaw`VACUUM`;
  }

  async getStats(): Promise<any> {
    if (!this.prisma) {
      throw new Error('Database not initialized');
    }

    const stats = await Promise.all([
      this.prisma.theme.count(),
      this.prisma.collectedArticle.count(),
      this.prisma.generatedSample.count(),
      this.prisma.draft.count(),
      this.prisma.template.count(),
      this.prisma.postHistory.count(),
      this.prisma.hashtagHistory.count(),
    ]);

    return {
      themes: stats[0],
      articles: stats[1],
      samples: stats[2],
      drafts: stats[3],
      templates: stats[4],
      posts: stats[5],
      hashtags: stats[6],
    };
  }
}
