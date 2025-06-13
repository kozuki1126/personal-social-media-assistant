import { create } from 'zustand';
import { Theme } from '../../shared/types/database';
import { ThemeFormData } from '../../shared/types/app';

interface ThemeState {
  themes: Theme[];
  currentTheme: Theme | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  filteredThemes: Theme[];
  
  // Actions
  loadThemes: (includeInactive?: boolean) => Promise<void>;
  getThemeById: (id: number) => Promise<void>;
  createTheme: (data: ThemeFormData) => Promise<Theme>;
  updateTheme: (id: number, data: Partial<ThemeFormData>) => Promise<Theme>;
  deleteTheme: (id: number, soft?: boolean) => Promise<void>;
  searchThemes: (query: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  clearError: () => void;
  clearCurrentTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  themes: [],
  currentTheme: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  filteredThemes: [],

  loadThemes: async (includeInactive = false) => {
    set({ isLoading: true, error: null });
    try {
      const themes = await window.electronAPI.themes.getAll(includeInactive);
      set({ 
        themes, 
        filteredThemes: themes,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'テーマの読み込みに失敗しました',
        isLoading: false 
      });
    }
  },

  getThemeById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const theme = await window.electronAPI.themes.getById(id);
      set({ 
        currentTheme: theme,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'テーマの取得に失敗しました',
        isLoading: false 
      });
    }
  },

  createTheme: async (data: ThemeFormData) => {
    set({ isLoading: true, error: null });
    try {
      const newTheme = await window.electronAPI.themes.create(data);
      const { themes } = get();
      const updatedThemes = [newTheme, ...themes];
      set({ 
        themes: updatedThemes,
        filteredThemes: updatedThemes,
        isLoading: false 
      });
      return newTheme;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'テーマの作成に失敗しました';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      throw error;
    }
  },

  updateTheme: async (id: number, data: Partial<ThemeFormData>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTheme = await window.electronAPI.themes.update(id, data);
      const { themes } = get();
      const updatedThemes = themes.map(theme => 
        theme.id === id ? updatedTheme : theme
      );
      set({ 
        themes: updatedThemes,
        filteredThemes: updatedThemes,
        currentTheme: updatedTheme,
        isLoading: false 
      });
      return updatedTheme;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'テーマの更新に失敗しました';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      throw error;
    }
  },

  deleteTheme: async (id: number, soft = true) => {
    set({ isLoading: true, error: null });
    try {
      await window.electronAPI.themes.delete(id, soft);
      const { themes } = get();
      let updatedThemes;
      
      if (soft) {
        // For soft delete, mark as inactive
        updatedThemes = themes.map(theme => 
          theme.id === id ? { ...theme, isActive: false } : theme
        );
      } else {
        // For hard delete, remove from list
        updatedThemes = themes.filter(theme => theme.id !== id);
      }
      
      set({ 
        themes: updatedThemes,
        filteredThemes: updatedThemes,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'テーマの削除に失敗しました',
        isLoading: false 
      });
    }
  },

  searchThemes: async (query: string) => {
    set({ isLoading: true, error: null, searchQuery: query });
    try {
      if (query.trim() === '') {
        // If empty query, show all themes
        const { themes } = get();
        set({ 
          filteredThemes: themes,
          isLoading: false 
        });
      } else {
        // Search using API
        const searchResults = await window.electronAPI.themes.search(query);
        set({ 
          filteredThemes: searchResults,
          isLoading: false 
        });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '検索に失敗しました',
        isLoading: false 
      });
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    
    // Filter locally if query is provided
    if (query.trim() === '') {
      const { themes } = get();
      set({ filteredThemes: themes });
    } else {
      const { themes } = get();
      const filtered = themes.filter(theme => 
        theme.name.toLowerCase().includes(query.toLowerCase()) ||
        (theme.description?.toLowerCase().includes(query.toLowerCase())) ||
        (theme.keywords && theme.keywords.toLowerCase().includes(query.toLowerCase()))
      );
      set({ filteredThemes: filtered });
    }
  },

  clearError: () => set({ error: null }),

  clearCurrentTheme: () => set({ currentTheme: null }),
}));
