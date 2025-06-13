/**
 * Application-specific types
 */

// Application state
export interface AppState {
  isLoading: boolean;
  currentView: AppView;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'auto';
  notifications: Notification[];
  settings: AppSettings;
}

export type AppView = 
  | 'dashboard'
  | 'themes'
  | 'articles'
  | 'samples'
  | 'drafts'
  | 'templates'
  | 'calendar'
  | 'analytics'
  | 'settings';

export interface AppSettings {
  // API Keys (stored encrypted)
  newsApiKey?: string;
  openaiApiKey?: string;
  xApiKey?: string;
  xApiSecret?: string;
  xBearerToken?: string;
  
  // Collection settings
  autoCollectionEnabled: boolean;
  collectionInterval: number; // hours
  maxArticlesPerTheme: number;
  
  // Generation settings
  defaultTone: 'casual' | 'formal' | 'explanatory';
  maxCharacterCount: number;
  includeHashtagSuggestions: boolean;
  
  // Notification settings
  enableNotifications: boolean;
  reminderEnabled: boolean;
  defaultReminderMinutes: number;
  
  // UI settings
  theme: 'light' | 'dark' | 'auto';
  sidebarCollapsed: boolean;
  compactMode: boolean;
  
  // Data management
  autoBackupEnabled: boolean;
  backupInterval: number; // days
  maxBackups: number;
  
  // Security settings
  sessionTimeout: number; // minutes
  requireConfirmation: boolean;
}

// Notification system
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: string;
  primary?: boolean;
}

// Form types
export interface ThemeFormData {
  name: string;
  description?: string;
  keywords: string[];
  updateFrequency: 'daily' | 'weekly';
}

export interface DraftFormData {
  title?: string;
  content: string;
  hashtags: string[];
  mediaUrls: string[];
  category?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  reminderMinutes: number;
}

export interface TemplateFormData {
  name: string;
  content: string;
  category?: string;
  hashtags: string[];
}

// Analytics types
export interface PerformanceMetrics {
  totalPosts: number;
  totalLikes: number;
  totalRetweets: number;
  totalReplies: number;
  totalImpressions: number;
  averageEngagement: number;
  engagementRate: number;
  topPerformingPosts: PostHistory[];
}

export interface EngagementTrend {
  date: string;
  likes: number;
  retweets: number;
  replies: number;
  impressions: number;
}

export interface TimeAnalysis {
  hour: number;
  averageEngagement: number;
  postCount: number;
}

export interface ThemePerformance {
  themeId: number;
  themeName: string;
  postCount: number;
  totalEngagement: number;
  averageEngagement: number;
}

// Calendar types
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  type: 'draft' | 'reminder' | 'collection' | 'custom';
  relatedId?: number;
  color?: string;
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  tone?: string;
  isFavorite?: boolean;
  tags?: string[];
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Export/Import types
export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf';
  includeMedia: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
  categories?: string[];
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

// Error handling
export interface AppError {
  code: string;
  message: string;
  context?: string;
  timestamp: Date;
  handled: boolean;
}
