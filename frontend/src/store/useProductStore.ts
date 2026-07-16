import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../services/api';

const PRODUCTS_CACHE_KEY = 'smartprice_products_cache';
const LAST_SYNC_KEY = 'smartprice_last_sync_time';

export interface Product {
  _id: string;
  productName: string;
  productCode: string;
  barcode?: string;
  category: string;
  brand: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface ProductState {
  products: Product[];
  lastSynced: string | null;
  isLoading: boolean;
  isSyncing: boolean;
  syncError: string | null;
  
  // Search / Filter State
  searchQuery: string;
  selectedCategory: string;
  sortBy: 'name_asc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc';
  
  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSortBy: (sort: 'name_asc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc') => void;
  
  loadCache: () => Promise<void>;
  syncWithServer: (token?: string | null) => Promise<void>;
  
  // Modifying methods (optimistic updates + server sync)
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Product) => void;
  updateStock: (id: string, newStock: number) => void;
  deleteProduct: (id: string) => void;
  
  getFilteredProducts: () => Product[];
  getCategories: () => string[];
  getLowStockProducts: (threshold?: number) => Product[];
  getTotalStockValue: () => number;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  lastSynced: null,
  isLoading: true,
  isSyncing: false,
  syncError: null,
  
  searchQuery: '',
  selectedCategory: 'All',
  sortBy: 'name_asc',

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSortBy: (sort) => set({ sortBy: sort }),

  loadCache: async () => {
    set({ isLoading: true });
    try {
      const cached = await AsyncStorage.getItem(PRODUCTS_CACHE_KEY);
      const syncTime = await AsyncStorage.getItem(LAST_SYNC_KEY);
      if (cached) {
        set({
          products: JSON.parse(cached),
          lastSynced: syncTime,
        });
      }
    } catch (e) {
      console.error('Failed to load products from cache', e);
    } finally {
      set({ isLoading: false });
    }
  },

  syncWithServer: async (token) => {
    set({ isSyncing: true, syncError: null });
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout
      
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/products`, {
        signal: controller.signal,
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned code ${response.status}`);
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        const syncTime = new Date().toLocaleString();
        
        await AsyncStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(result.data));
        await AsyncStorage.setItem(LAST_SYNC_KEY, syncTime);
        
        set({
          products: result.data,
          lastSynced: syncTime,
          syncError: null,
        });
      } else {
        throw new Error('Invalid response structure from server');
      }
    } catch (e: any) {
      console.warn('Sync failed:', e.message);
      set({ syncError: e.name === 'AbortError' ? 'Sync timeout (network sluggish)' : 'Offline mode: server unreachable' });
    } finally {
      set({ isSyncing: false });
    }
  },

  addProduct: (product) => {
    const updatedProducts = [product, ...get().products].sort((a, b) => 
      a.productName.localeCompare(b.productName)
    );
    set({ products: updatedProducts });
    AsyncStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(updatedProducts));
  },

  updateProduct: (id, updatedProduct) => {
    const updatedProducts = get().products.map(p => 
      p._id === id ? updatedProduct : p
    ).sort((a, b) => a.productName.localeCompare(b.productName));
    set({ products: updatedProducts });
    AsyncStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(updatedProducts));
  },

  updateStock: (id, newStock) => {
    const updatedProducts = get().products.map(p =>
      p._id === id ? { ...p, stock: newStock } : p
    );
    set({ products: updatedProducts });
    AsyncStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(updatedProducts));
  },

  deleteProduct: (id) => {
    const updatedProducts = get().products.filter(p => p._id !== id);
    set({ products: updatedProducts });
    AsyncStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(updatedProducts));
  },

  getFilteredProducts: () => {
    const { products, searchQuery, selectedCategory, sortBy } = get();
    
    let result = [...products];

    // 1. Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // 2. Text Search (Optimized for 10k products)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        p.productName.toLowerCase().includes(q) ||
        p.productCode.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // 3. Sorting
    if (sortBy === 'name_asc') {
      result.sort((a, b) => a.productName.localeCompare(b.productName));
    } else if (sortBy === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'stock_asc') {
      result.sort((a, b) => a.stock - b.stock);
    } else if (sortBy === 'stock_desc') {
      result.sort((a, b) => b.stock - a.stock);
    }

    return result;
  },

  getCategories: () => {
    const { products } = get();
    const categories = new Set(products.map(p => p.category));
    return ['All', ...Array.from(categories)].sort();
  },

  getLowStockProducts: (threshold = 5) => {
    const { products } = get();
    return products
      .filter(p => p.stock <= threshold && p.status === 'active')
      .sort((a, b) => a.stock - b.stock);
  },

  getTotalStockValue: () => {
    const { products } = get();
    return products.reduce((sum, p) => sum + p.price * p.stock, 0);
  },
}));
