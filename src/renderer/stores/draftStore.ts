import { create } from 'zustand';

export interface Draft {
  id: number;
  title?: string;
  content: string;
  hashtags: string[];
  mediaUrls: string[];
  category?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  reminderMinutes: number;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
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
  isTemplate: boolean;
}

interface DraftStore {
  // State
  drafts: Draft[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  categoryFilter: string;
  sortBy: 'newest' | 'oldest' | 'title' | 'category';
  
  // Actions
  loadDrafts: () => Promise<void>;
  createDraft: (data: DraftFormData) => Promise<Draft | null>;
  updateDraft: (id: number, data: Partial<DraftFormData>) => Promise<Draft | null>;
  deleteDraft: (id: number) => Promise<boolean>;
  duplicateDraft: (id: number) => Promise<Draft | null>;
  searchDrafts: (query: string) => void;
  filterByCategory: (category: string) => void;
  setSortBy: (sortBy: 'newest' | 'oldest' | 'title' | 'category') => void;
  clearError: () => void;
  
  // Computed getters
  getFilteredDrafts: () => Draft[];
  getDraftById: (id: number) => Draft | undefined;
  getCategories: () => string[];
  getCharacterCount: (content: string) => number;
  getWordCount: (content: string) => number;
}

export const useDraftStore = create<DraftStore>((set, get) => ({
  // Initial state
  drafts: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  categoryFilter: '',
  sortBy: 'newest',

  // Actions
  loadDrafts: async () => {
    set({ isLoading: true, error: null });
    try {
      const drafts = await window.electronAPI.drafts.getAll();
      set({ drafts, isLoading: false });
    } catch (error) {
      console.error('Failed to load drafts:', error);
      set({ 
        error: 'Failed to load drafts. Please try again.',
        isLoading: false 
      });
    }
  },

  createDraft: async (data: DraftFormData) => {
    set({ isLoading: true, error: null });
    try {
      const newDraft = await window.electronAPI.drafts.create(data);
      set(state => ({
        drafts: [newDraft, ...state.drafts],
        isLoading: false
      }));
      return newDraft;
    } catch (error) {
      console.error('Failed to create draft:', error);
      set({ 
        error: 'Failed to create draft. Please try again.',
        isLoading: false 
      });
      return null;
    }
  },

  updateDraft: async (id: number, data: Partial<DraftFormData>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedDraft = await window.electronAPI.drafts.update(id, data);
      set(state => ({
        drafts: state.drafts.map(draft => 
          draft.id === id ? updatedDraft : draft
        ),
        isLoading: false
      }));
      return updatedDraft;
    } catch (error) {
      console.error('Failed to update draft:', error);
      set({ 
        error: 'Failed to update draft. Please try again.',
        isLoading: false 
      });
      return null;
    }
  },

  deleteDraft: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const success = await window.electronAPI.drafts.delete(id);
      if (success) {
        set(state => ({
          drafts: state.drafts.filter(draft => draft.id !== id),
          isLoading: false
        }));
      }
      return success;
    } catch (error) {
      console.error('Failed to delete draft:', error);
      set({ 
        error: 'Failed to delete draft. Please try again.',
        isLoading: false 
      });
      return false;
    }
  },

  duplicateDraft: async (id: number) => {
    const draft = get().getDraftById(id);
    if (!draft) return null;

    const duplicateData: DraftFormData = {
      title: draft.title ? `${draft.title} (Copy)` : undefined,
      content: draft.content,
      hashtags: [...draft.hashtags],
      mediaUrls: [...draft.mediaUrls],
      category: draft.category,
      scheduledDate: undefined, // Clear scheduling for duplicates
      scheduledTime: undefined,
      reminderMinutes: draft.reminderMinutes,
      isTemplate: false, // Duplicates should not be templates by default
    };

    return await get().createDraft(duplicateData);
  },

  searchDrafts: (query: string) => {
    set({ searchQuery: query });
  },

  filterByCategory: (category: string) => {
    set({ categoryFilter: category });
  },

  setSortBy: (sortBy: 'newest' | 'oldest' | 'title' | 'category') => {
    set({ sortBy });
  },

  clearError: () => {
    set({ error: null });
  },

  // Computed getters
  getFilteredDrafts: () => {
    const { drafts, searchQuery, categoryFilter, sortBy } = get();
    
    let filtered = drafts;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(draft => 
        draft.title?.toLowerCase().includes(query) ||
        draft.content.toLowerCase().includes(query) ||
        draft.hashtags.some(tag => tag.toLowerCase().includes(query)) ||
        draft.category?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (categoryFilter && categoryFilter !== '') {
      filtered = filtered.filter(draft => draft.category === categoryFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title':
          const titleA = a.title || '';
          const titleB = b.title || '';
          return titleA.localeCompare(titleB);
        case 'category':
          const categoryA = a.category || '';
          const categoryB = b.category || '';
          return categoryA.localeCompare(categoryB);
        default:
          return 0;
      }
    });

    return filtered;
  },

  getDraftById: (id: number) => {
    return get().drafts.find(draft => draft.id === id);
  },

  getCategories: () => {
    const drafts = get().drafts;
    const categories = new Set<string>();
    
    drafts.forEach(draft => {
      if (draft.category) {
        categories.add(draft.category);
      }
    });

    return Array.from(categories).sort();
  },

  getCharacterCount: (content: string) => {
    return content.length;
  },

  getWordCount: (content: string) => {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  },
}));
