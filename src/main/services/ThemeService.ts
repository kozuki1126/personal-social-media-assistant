import { PrismaClient, Theme } from '@prisma/client';
import { DatabaseService } from './DatabaseService';
import { ThemeFormData } from '../../shared/types/app';

export class ThemeService {
  private databaseService: DatabaseService;

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
  }

  private get prisma(): PrismaClient {
    return this.databaseService.getPrismaClient();
  }

  /**
   * Get all themes
   */
  async getAll(includeInactive: boolean = false): Promise<Theme[]> {
    try {
      return await this.prisma.theme.findMany({
        where: includeInactive ? undefined : { isActive: true },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          _count: {
            select: {
              collectedArticles: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Failed to get themes:', error);
      throw error;
    }
  }

  /**
   * Get theme by ID
   */
  async getById(id: number): Promise<Theme | null> {
    try {
      return await this.prisma.theme.findUnique({
        where: { id },
        include: {
          collectedArticles: {
            take: 10,
            orderBy: {
              createdAt: 'desc',
            },
          },
          _count: {
            select: {
              collectedArticles: true,
            },
          },
        },
      });
    } catch (error) {
      console.error(`Failed to get theme ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new theme
   */
  async create(data: ThemeFormData): Promise<Theme> {
    try {
      return await this.prisma.theme.create({
        data: {
          name: data.name,
          description: data.description,
          keywords: JSON.stringify(data.keywords),
          updateFrequency: data.updateFrequency,
          isActive: true,
        },
      });
    } catch (error) {
      console.error('Failed to create theme:', error);
      throw error;
    }
  }

  /**
   * Update theme
   */
  async update(id: number, data: Partial<ThemeFormData>): Promise<Theme> {
    try {
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.keywords !== undefined) updateData.keywords = JSON.stringify(data.keywords);
      if (data.updateFrequency !== undefined) updateData.updateFrequency = data.updateFrequency;

      return await this.prisma.theme.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      console.error(`Failed to update theme ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete theme (soft delete by setting isActive to false)
   */
  async delete(id: number, soft: boolean = true): Promise<void> {
    try {
      if (soft) {
        await this.prisma.theme.update({
          where: { id },
          data: {
            isActive: false,
            updatedAt: new Date(),
          },
        });
      } else {
        await this.prisma.theme.delete({
          where: { id },
        });
      }
    } catch (error) {
      console.error(`Failed to delete theme ${id}:`, error);
      throw error;
    }
  }

  /**
   * Search themes by name or keywords
   */
  async search(query: string): Promise<Theme[]> {
    try {
      return await this.prisma.theme.findMany({
        where: {
          AND: [
            { isActive: true },
            {
              OR: [
                {
                  name: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
                {
                  description: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
                {
                  keywords: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          ],
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    } catch (error) {
      console.error('Failed to search themes:', error);
      throw error;
    }
  }

  /**
   * Get themes that need article collection
   */
  async getThemesForCollection(): Promise<Theme[]> {
    try {
      return await this.prisma.theme.findMany({
        where: {
          isActive: true,
          updateFrequency: {
            in: ['daily', 'weekly'],
          },
        },
        orderBy: {
          updatedAt: 'asc', // Oldest first for collection
        },
      });
    } catch (error) {
      console.error('Failed to get themes for collection:', error);
      throw error;
    }
  }

  /**
   * Get theme statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    withArticles: number;
  }> {
    try {
      const [total, active, withArticles] = await Promise.all([
        this.prisma.theme.count(),
        this.prisma.theme.count({ where: { isActive: true } }),
        this.prisma.theme.count({
          where: {
            collectedArticles: {
              some: {},
            },
          },
        }),
      ]);

      return {
        total,
        active,
        inactive: total - active,
        withArticles,
      };
    } catch (error) {
      console.error('Failed to get theme statistics:', error);
      throw error;
    }
  }

  /**
   * Check if theme name exists
   */
  async nameExists(name: string, excludeId?: number): Promise<boolean> {
    try {
      const theme = await this.prisma.theme.findFirst({
        where: {
          name,
          id: excludeId ? { not: excludeId } : undefined,
        },
      });
      return !!theme;
    } catch (error) {
      console.error('Failed to check theme name:', error);
      throw error;
    }
  }
}
