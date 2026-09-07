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
  price: number;            // Kept synchronized with salePrice for backward compatibility
  salePrice?: number;       // Retail selling price (visible to Sales Person & Admin)
  mrpPrice?: number;        // Maximum Retail Price (visible to Admin, optional for staff)
  wholesalePrice?: number;  // Wholesale / Dealer price (visible ONLY to Admin/Superadmin)
  stock: number;
  imageUrl?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface BrandStat {
  brand: string;
  itemCount: number;
  totalStock: number;
  percentage: number;
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
  selectedBrand: string;
  sortBy: 'name_asc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc';

  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedBrand: (brand: string) => void;
  setSortBy: (sort: 'name_asc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc') => void;

  loadCache: () => Promise<void>;
  syncWithServer: (token?: string | null) => Promise<void>;

  // Modifying methods (optimistic updates + server sync)
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Product) => void;
  updateStock: (id: string, newStock: number) => void;
  deleteProduct: (id: string) => void;

  // Quick Price Updation (Easy Updation for Admin/Owner)
  quickUpdatePrices: (
    id: string,
    prices: { mrpPrice?: number; wholesalePrice?: number; salePrice?: number },
    token?: string | null
  ) => Promise<{ success: boolean; message?: string }>;

  // Manual Add/Release Stock (Both Admin and Sales Person)
  adjustStock: (
    id: string,
    options: { delta?: number; absolute?: number },
    token?: string | null
  ) => Promise<{ success: boolean; newStock?: number; message?: string }>;

  // Deduct stock for Quotation execution
  deductQuotationItems: (
    items: { productId: string; quantity: number }[],
    token?: string | null
  ) => Promise<void>;

  getFilteredProducts: () => Product[];
  getCategories: () => string[];
  getBrands: () => string[];
  getBrandStats: () => BrandStat[];
  getLowStockProducts: (threshold?: number) => Product[];
  getTotalStockValue: () => number;
  getTotalStockCount: () => number;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  lastSynced: null,
  isLoading: true,
  isSyncing: false,
  syncError: null,

  searchQuery: '',
  selectedCategory: 'All',
  selectedBrand: 'All',
  sortBy: 'name_asc',

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedBrand: (brand) => set({ selectedBrand: brand }),
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
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/products`, {
        signal: controller.signal,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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
      set({
        syncError:
          e.name === 'AbortError'
            ? 'Sync timeout (network sluggish)'
            : 'Offline mode: server unreachable',
      });
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
    const updatedProducts = get()
      .products.map((p) => (p._id === id ? updatedProduct : p))
      .sort((a, b) => a.productName.localeCompare(b.productName));
    set({ products: updatedProducts });
    AsyncStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(updatedProducts));
  },

  updateStock: (id, newStock) => {
    const updatedProducts = get().products.map((p) =>
      p._id === id ? { ...p, stock: newStock } : p
    );
    set({ products: updatedProducts });
    AsyncStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(updatedProducts));
  },

  deleteProduct: (id) => {
    const updatedProducts = get().products.filter((p) => p._id !== id);
    set({ products: updatedProducts });
    AsyncStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(updatedProducts));
  },

  quickUpdatePrices: async (id, prices, token) => {
    // 1. Optimistic update
    const prevProducts = get().products;
    const target = prevProducts.find((p) => p._id === id);
    if (!target) return { success: false, message: 'Product not found' };

    const effectiveSale = prices.salePrice !== undefined ? prices.salePrice : target.salePrice ?? target.price;
    const effectiveMrp = prices.mrpPrice !== undefined ? prices.mrpPrice : target.mrpPrice ?? effectiveSale;
    const effectiveWholesale =
      prices.wholesalePrice !== undefined ? prices.wholesalePrice : target.wholesalePrice;

    const updated = prevProducts.map((p) =>
      p._id === id
        ? {
            ...p,
            price: effectiveSale,
            salePrice: effectiveSale,
            mrpPrice: effectiveMrp,
            wholesalePrice: effectiveWholesale,
          }
        : p
    );
    set({ products: updated });
    AsyncStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(updated));

    // 2. Server sync
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/products/${id}/quick-price`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(prices),
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.message || 'Failed to update prices on server');
      }

      return { success: true, message: 'Price updated successfully' };
    } catch (err: any) {
      console.warn('Quick price sync failed, keeping local update:', err.message);
      return { success: true, message: 'Updated locally (offline mode)' };
    }
  },

  adjustStock: async (id, options, token) => {
    const prevProducts = get().products;
    const target = prevProducts.find((p) => p._id === id);
    if (!target) return { success: false, message: 'Product not found' };

    let newStock = target.stock;
    if (options.absolute !== undefined) {
      newStock = Math.max(0, options.absolute);
    } else if (options.delta !== undefined) {
      newStock = Math.max(0, target.stock + options.delta);
    }

    // Optimistic update
    const updated = prevProducts.map((p) => (p._id === id ? { ...p, stock: newStock } : p));
    set({ products: updated });
    AsyncStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(updated));

    // Server sync
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/products/${id}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(options),
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.message || 'Failed to sync stock with server');
      }

      return { success: true, newStock, message: 'Stock updated successfully' };
    } catch (err: any) {
      console.warn('Stock sync failed, keeping local update:', err.message);
      return { success: true, newStock, message: 'Updated locally (offline)' };
    }
  },

  deductQuotationItems: async (items, token) => {
    for (const item of items) {
      await get().adjustStock(item.productId, { delta: -item.quantity }, token);
    }
  },

  getFilteredProducts: () => {
    const { products, searchQuery, selectedCategory, selectedBrand, sortBy } = get();

    let result = [...products];

    // 1. Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // 2. Brand Filter
    if (selectedBrand !== 'All') {
      result = result.filter((p) => p.brand.toLowerCase() === selectedBrand.toLowerCase());
    }

    // 3. Text Search (Optimized for instant typing)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.productName.toLowerCase().includes(q) ||
          p.productCode.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // 4. Sorting
    if (sortBy === 'name_asc') {
      result.sort((a, b) => a.productName.localeCompare(b.productName));
    } else if (sortBy === 'price_asc') {
      result.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
    } else if (sortBy === 'stock_asc') {
      result.sort((a, b) => a.stock - b.stock);
    } else if (sortBy === 'stock_desc') {
      result.sort((a, b) => b.stock - a.stock);
    }

    return result;
  },

  getCategories: () => {
    const { products } = get();
    const categories = new Set(products.map((p) => p.category).filter(Boolean));
    return ['All', ...Array.from(categories)].sort();
  },

  getBrands: () => {
    const { products } = get();
    const brands = new Set(products.map((p) => p.brand).filter(Boolean));
    return ['All', ...Array.from(brands)].sort();
  },

  getBrandStats: () => {
    const { products } = get();
    const brandMap: Record<string, { itemCount: number; totalStock: number }> = {};
    let grandStock = 0;

    for (const p of products) {
      const brand = p.brand || 'Other';
      if (!brandMap[brand]) {
        brandMap[brand] = { itemCount: 0, totalStock: 0 };
      }
      brandMap[brand].itemCount += 1;
      const stock = p.stock || 0;
      brandMap[brand].totalStock += stock;
      grandStock += stock;
    }

    const stats: BrandStat[] = Object.keys(brandMap).map((brand) => ({
      brand,
      itemCount: brandMap[brand].itemCount,
      totalStock: brandMap[brand].totalStock,
      percentage: grandStock > 0 ? Math.round((brandMap[brand].totalStock / grandStock) * 100) : 0,
    }));

    return stats.sort((a, b) => b.totalStock - a.totalStock);
  },

  getLowStockProducts: (threshold = 5) => {
    const { products } = get();
    return products
      .filter((p) => p.stock <= threshold && p.status === 'active')
      .sort((a, b) => a.stock - b.stock);
  },

  getTotalStockValue: () => {
    const { products } = get();
    return products.reduce((sum, p) => sum + (p.salePrice ?? p.price) * p.stock, 0);
  },

  getTotalStockCount: () => {
    const { products } = get();
    return products.reduce((sum, p) => sum + (p.stock || 0), 0);
  },
}));
