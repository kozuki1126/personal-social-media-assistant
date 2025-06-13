import { PrismaClient, Draft } from '@prisma/client';
import { DatabaseService } from './DatabaseService';
import { DraftFormData, SearchFilters, SortOptions, PaginationInfo } from '../../shared/types/app';

export class DraftService {
  private databaseService: DatabaseService;

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
  }

  private get prisma(): PrismaClient {
    return this.databaseService.getPrismaClient();
  }

  /**
   * Get all drafts with filtering and pagination
   */
  async getAll(
    filters?: SearchFilters,
    sort?: SortOptions,
    pagination?: { page: number; limit: number }
  ): Promise<{ drafts: Draft[]; pagination: PaginationInfo }> {
    try {
      const where = this.buildWhereClause(filters);
      const orderBy = this.buildOrderBy(sort);
      
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const skip = (page - 1) * limit;

      const [drafts, total] = await Promise.all([
        this.prisma.draft.findMany({
          where,
          orderBy,
          skip,
          take: limit,
        }),
        this.prisma.draft.count({ where }),
      ]);

      return {
        drafts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Failed to get drafts:', error);
      throw error;
    }
  }

  /**
   * Get draft by ID
   */
  async getById(id: number): Promise<Draft | null> {
    try {
      return await this.prisma.draft.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error(`Failed to get draft ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new draft
   */
  async create(data: DraftFormData): Promise<Draft> {
    try {
      return await this.prisma.draft.create({
        data: {
          title: data.title,
          content: data.content,
          hashtags: JSON.stringify(data.hashtags),
          mediaUrls: JSON.stringify(data.mediaUrls),
          category: data.category,
          scheduledDate: data.scheduledDate,
          scheduledTime: data.scheduledTime,
          reminderMinutes: data.reminderMinutes,
          isTemplate: false,
        },
      });
    } catch (error) {
      console.error('Failed to create draft:', error);
      throw error;
    }
  }

  /**
   * Update draft
   */
  async update(id: number, data: Partial<DraftFormData>): Promise<Draft> {
    try {
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (data.title !== undefined) updateData.title = data.title;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.hashtags !== undefined) updateData.hashtags = JSON.stringify(data.hashtags);
      if (data.mediaUrls !== undefined) updateData.mediaUrls = JSON.stringify(data.mediaUrls);
      if (data.category !== undefined) updateData.category = data.category;
      if (data.scheduledDate !== undefined) updateData.scheduledDate = data.scheduledDate;
      if (data.scheduledTime !== undefined) updateData.scheduledTime = data.scheduledTime;
      if (data.reminderMinutes !== undefined) updateData.reminderMinutes = data.reminderMinutes;

      return await this.prisma.draft.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      console.error(`Failed to update draft ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete draft
   */
  async delete(id: number): Promise<void> {
    try {
      await this.prisma.draft.delete({
        where: { id },
      });
    } catch (error) {
      console.error(`Failed to delete draft ${id}:`, error);
      throw error;
    }
  }

  /**
   * Duplicate draft
   */
  async duplicate(id: number): Promise<Draft> {
    try {
      const original = await this.getById(id);
      if (!original) {
        throw new Error('Draft not found');
      }

      const { id: _, createdAt, updatedAt, ...draftData } = original;
      
      return await this.prisma.draft.create({
        data: {
          ...draftData,
          title: draftData.title ? `${draftData.title} (コピー)` : null,
          scheduledDate: null, // Clear scheduled date for copy
          scheduledTime: null,
        },
      });
    } catch (error) {
      console.error(`Failed to duplicate draft ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get scheduled drafts
   */
  async getScheduled(date?: string): Promise<Draft[]> {
    try {
      const where: any = {
        scheduledDate: {
          not: null,
        },
      };

      if (date) {
        where.scheduledDate = date;
      }

      return await this.prisma.draft.findMany({
        where,
        orderBy: [
          { scheduledDate: 'asc' },
          { scheduledTime: 'asc' },
        ],
      });
    } catch (error) {
      console.error('Failed to get scheduled drafts:', error);
      throw error;
    }
  }

  /**
   * Get drafts by category
   */
  async getByCategory(category: string): Promise<Draft[]> {
    try {
      return await this.prisma.draft.findMany({
        where: { category },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    } catch (error) {
      console.error(`Failed to get drafts by category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const result = await this.prisma.draft.findMany({
        select: {
          category: true,
        },
        where: {
          category: {
            not: null,
          },
        },
        distinct: ['category'],
      });

      return result
        .map(item => item.category)
        .filter(Boolean) as string[];
    } catch (error) {
      console.error('Failed to get draft categories:', error);
      throw error;
    }
  }

  /**
   * Search drafts
   */
  async search(query: string): Promise<Draft[]> {
    try {
      return await this.prisma.draft.findMany({
        where: {
          OR: [
            {
              title: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              content: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              category: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    } catch (error) {
      console.error('Failed to search drafts:', error);
      throw error;
    }
  }

  /**
   * Get draft statistics
   */
  async getStatistics(): Promise<{
    total: number;
    scheduled: number;
    templates: number;
    categories: number;
  }> {
    try {
      const [total, scheduled, templates, categories] = await Promise.all([
        this.prisma.draft.count(),
        this.prisma.draft.count({
          where: {
            scheduledDate: {
              not: null,
            },
          },
        }),
        this.prisma.draft.count({ where: { isTemplate: true } }),
        this.getCategories().then(cats => cats.length),
      ]);

      return {
        total,
        scheduled,
        templates,
        categories,
      };
    } catch (error) {
      console.error('Failed to get draft statistics:', error);
      throw error;
    }
  }

  /**
   * Build where clause for filtering
   */
  private buildWhereClause(filters?: SearchFilters): any {
    if (!filters) return {};

    const where: any = {};

    if (filters.query) {
      where.OR = [
        {
          title: {
            contains: filters.query,
            mode: 'insensitive',
          },
        },
        {
          content: {
            contains: filters.query,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    return where;
  }

  /**
   * Build order by clause
   */
  private buildOrderBy(sort?: SortOptions): any {
    if (!sort) {
      return { updatedAt: 'desc' };
    }

    return {
      [sort.field]: sort.direction,
    };
  }
}
