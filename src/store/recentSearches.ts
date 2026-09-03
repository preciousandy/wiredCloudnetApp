import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const KEY = 'cn.recent-searches';
const MAX = 8;

interface RecentSearchState {
  queries: string[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  remember: (query: string) => void;
  forget: (query: string) => void;
  clear: () => void;
}

/**
 * Recent searches, on the device only.
 *
 * What someone searched for is not something to send to a server before we have
 * a reason to. This stays local and the user can clear it.
 */
export const useRecentSearches = create<RecentSearchState>((set, get) => ({
  queries: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      set({ queries: raw ? (JSON.parse(raw) as string[]) : [], hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  remember: (query) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    // Move an existing term to the top rather than duplicating it.
    const next = [trimmed, ...get().queries.filter((q) => q.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX);
    set({ queries: next });
    void AsyncStorage.setItem(KEY, JSON.stringify(next));
  },

  forget: (query) => {
    const next = get().queries.filter((q) => q !== query);
    set({ queries: next });
    void AsyncStorage.setItem(KEY, JSON.stringify(next));
  },

  clear: () => {
    set({ queries: [] });
    void AsyncStorage.removeItem(KEY);
  },
}));
