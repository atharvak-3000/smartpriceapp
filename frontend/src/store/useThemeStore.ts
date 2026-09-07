import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'dark' | 'light';

interface ThemeState {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  loadTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = 'smartprice_app_theme';

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark', // Default sleek dark theme
  toggleTheme: async () => {
    const nextTheme: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: nextTheme });
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
  },
  setTheme: async (theme: ThemeMode) => {
    set({ theme });
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
  },
  loadTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        set({ theme: saved });
      }
    } catch (e) {
      console.error('Failed to load theme preference', e);
    }
  },
}));
