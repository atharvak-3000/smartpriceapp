import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BRANDING_STORAGE_KEY = 'smartprice_store_branding';

export interface StoreBranding {
  storeName: string;
  tagline: string;
  logoUri: string | null;
  phone: string;
  address: string;
  gstin: string;
  currency: string;
}

interface BrandingState extends StoreBranding {
  setLogoUri: (uri: string | null) => Promise<void>;
  updateBranding: (data: Partial<StoreBranding>) => Promise<void>;
  loadBranding: () => Promise<void>;
}

const defaultBranding: StoreBranding = {
  storeName: 'SmartPrice Store',
  tagline: 'Wholesale & Retail Distribution',
  logoUri: null,
  phone: '+91 98765 43210',
  address: 'Main Market Road, Commercial Complex',
  gstin: '27AAAAA0000A1Z5',
  currency: 'INR',
};

export const useBrandingStore = create<BrandingState>((set, get) => ({
  ...defaultBranding,

  setLogoUri: async (uri: string | null) => {
    set({ logoUri: uri });
    const current = get();
    try {
      await AsyncStorage.setItem(
        BRANDING_STORAGE_KEY,
        JSON.stringify({
          storeName: current.storeName,
          tagline: current.tagline,
          logoUri: uri,
          phone: current.phone,
          address: current.address,
          gstin: current.gstin,
          currency: current.currency,
        })
      );
    } catch (e) {
      console.error('Failed to save store logo', e);
    }
  },

  updateBranding: async (data: Partial<StoreBranding>) => {
    set((state) => ({ ...state, ...data }));
    const updated = get();
    try {
      await AsyncStorage.setItem(
        BRANDING_STORAGE_KEY,
        JSON.stringify({
          storeName: updated.storeName,
          tagline: updated.tagline,
          logoUri: updated.logoUri,
          phone: updated.phone,
          address: updated.address,
          gstin: updated.gstin,
          currency: updated.currency,
        })
      );
    } catch (e) {
      console.error('Failed to save branding', e);
    }
  },

  loadBranding: async () => {
    try {
      const saved = await AsyncStorage.getItem(BRANDING_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        set((state) => ({ ...state, ...parsed }));
      }
    } catch (e) {
      console.error('Failed to load branding data', e);
    }
  },
}));
