import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'smartprice_auth_token';
const USER_KEY = 'smartprice_user_data';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'staff';
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
  isOwner: () => boolean;
  isStaff: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (token, user) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      set({ token, user, isAuthenticated: true });
    } catch (e) {
      console.error('Failed to save auth credentials', e);
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      set({ token: null, user: null, isAuthenticated: false });
    } catch (e) {
      console.error('Failed to delete auth credentials', e);
    }
  },

  loadAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userJson = await SecureStore.getItemAsync(USER_KEY);
      if (token && userJson) {
        set({
          token,
          user: JSON.parse(userJson),
          isAuthenticated: true,
        });
      }
    } catch (e) {
      console.error('Failed to load auth credentials', e);
    } finally {
      set({ isLoading: false });
    }
  },

  isOwner: () => get().user?.role === 'owner',
  isStaff: () => get().user?.role === 'staff',
}));
