import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AppState, AppSettings, Notification, AppView } from '../../shared/types/app';
import { isDev } from '../../shared/utils/environment';

interface AppStore extends AppState {
  // Actions
  initialize: () => Promise<void>;
  setCurrentView: (view: AppView) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setLoading: (loading: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  clearAllNotifications: () => void;
}

const defaultSettings: AppSettings = {
  // API Keys
  newsApiKey: undefined,
  openaiApiKey: undefined,
  xApiKey: undefined,
  xApiSecret: undefined,
  xBearerToken: undefined,
  
  // Collection settings
  autoCollectionEnabled: false,
  collectionInterval: 24, // hours
  maxArticlesPerTheme: 20,
  
  // Generation settings
  defaultTone: 'casual',
  maxCharacterCount: 280,
  includeHashtagSuggestions: true,
  
  // Notification settings
  enableNotifications: true,
  reminderEnabled: true,
  defaultReminderMinutes: 10,
  
  // UI settings
  theme: 'auto',
  sidebarCollapsed: false,
  compactMode: false,
  
  // Data management
  autoBackupEnabled: true,
  backupInterval: 7, // days
  maxBackups: 5,
  
  // Security settings
  sessionTimeout: 30, // minutes
  requireConfirmation: true,
};

export const useAppStore = create<AppStore>()()
  devtools(
    (set, get) => ({
      // Initial state
      isLoading: false,
      currentView: 'dashboard',
      sidebarCollapsed: false,
      theme: 'auto',
      notifications: [],
      settings: defaultSettings,

      // Actions
      initialize: async () => {
        set({ isLoading: true });
        
        try {
          // Load settings from storage if available
          // This would be implemented with actual storage later
          console.log('Initializing app store...');
          
          // Apply theme
          const { theme } = get().settings;
          document.documentElement.setAttribute('data-theme', theme);
          
          // Add welcome notification
          get().addNotification({
            type: 'info',
            title: 'ようこそ',
            message: 'Personal Social Media Assistant へようこそ！',
          });
          
          console.log('App store initialized successfully');
        } catch (error) {
          console.error('Failed to initialize app store:', error);
          get().addNotification({
            type: 'error',
            title: '初期化エラー',
            message: 'アプリケーションの初期化に失敗しました。',
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      setCurrentView: (view: AppView) => {
        set({ currentView: view });
      },

      toggleSidebar: () => {
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
          settings: {
            ...state.settings,
            sidebarCollapsed: !state.sidebarCollapsed,
          },
        }));
      },

      setTheme: (theme: 'light' | 'dark' | 'auto') => {
        set((state) => ({
          theme,
          settings: { ...state.settings, theme },
        }));
        
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          read: false,
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
        }));
        
        // Auto-remove info notifications after 5 seconds
        if (notification.type === 'info') {
          setTimeout(() => {
            get().removeNotification(newNotification.id);
          }, 5000);
        }
      },

      removeNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      markNotificationRead: (id: string) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      updateSettings: (newSettings: Partial<AppSettings>) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
        
        // Apply theme if it changed
        if (newSettings.theme) {
          document.documentElement.setAttribute('data-theme', newSettings.theme);
        }
      },

      clearAllNotifications: () => {
        set({ notifications: [] });
      },
    }),
    {
      name: 'app-store',
      enabled: isDev,
    }
  )
);
