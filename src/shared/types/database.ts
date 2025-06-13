/**
 * Database types matching Prisma models
 */

export interface Theme {
  id: number;
  name: string;
  description?: string;
  keywords?: string; // JSON string
  updateFrequency?: 'daily' | 'weekly';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  collectedArticles?: CollectedArticle[];
}

export interface CollectedArticle {
  id: number;
  themeId: number;
  title: string;
  content?: string;
  summary?: string;
  sourceUrl?: string;
  sourceName?: string;
  publishedAt?: Date;
  relevanceScore: number;
  isProcessed: boolean;
  createdAt: Date;
  theme?: Theme;
  generatedSamples?: GeneratedSample[];
}

export interface GeneratedSample {
  id: number;
  articleId: number;
  content: string;
  tone: 'casual' | 'formal' | 'explanatory';
  characterCount: number;
  hashtags?: string; // JSON string
  isFavorite: boolean;
  createdAt: Date;
  article?: CollectedArticle;
}

export interface Draft {
  id: number;
  title?: string;
  content: string;
  hashtags?: string; // JSON string
  mediaUrls?: string; // JSON string
  category?: string;
  scheduledDate?: string; // DATE format
  scheduledTime?: string; // TIME format
  reminderMinutes: number;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Template {
  id: number;
  name: string;
  content: string;
  category?: string;
  hashtags?: string; // JSON string
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostHistory {
  id: number;
  content: string;
  hashtags?: string; // JSON string
  mediaUrls?: string; // JSON string
  postedAt: Date;
  likesCount: number;
  retweetsCount: number;
  repliesCount: number;
  impressionsCount: number;
  lastUpdated: Date;
  createdAt: Date;
}

export interface Setting {
  id: number;
  key: string;
  value?: string;
  isEncrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HashtagHistory {
  id: number;
  hashtag: string;
  usageCount: number;
  lastUsed: Date;
  createdAt: Date;
}

// Helper types for JSON fields
export type KeywordArray = string[];
export type HashtagArray = string[];
export type MediaUrlArray = string[];

// Database operation types
export interface DatabaseStats {
  themes: number;
  articles: number;
  samples: number;
  drafts: number;
  templates: number;
  posts: number;
  hashtags: number;
}

// Query builder types
export interface QueryFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'notIn';
  value: any;
}

export interface QueryOptions {
  filters?: QueryFilter[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
