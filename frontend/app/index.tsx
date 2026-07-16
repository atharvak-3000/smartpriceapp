import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Animated,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { Colors } from '../src/theme/colors';
import { useProductStore, Product } from '../src/store/useProductStore';
import { useAuthStore } from '../src/store/useAuthStore';
import { ProductCard } from '../src/components/ProductCard';
import { ProductDetailSheet } from '../src/components/ProductDetailSheet';
import { StockUpdateModal } from '../src/components/StockUpdateModal';
import {
  Search,
  ScanBarcode,
  SlidersHorizontal,
  ChevronDown,
  RotateCw,
  User,
  Shield,
  X
} from 'lucide-react-native';

export default function SearchScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  
  const products = useProductStore((state) => state.products);
  const isSyncing = useProductStore((state) => state.isSyncing);
  const syncError = useProductStore((state) => state.syncError);
  const lastSynced = useProductStore((state) => state.lastSynced);
  const syncWithServer = useProductStore((state) => state.syncWithServer);

  const searchQuery = useProductStore((state) => state.searchQuery);
  const selectedCategory = useProductStore((state) => state.selectedCategory);
  const sortBy = useProductStore((state) => state.sortBy);
  
  const setSearchQuery = useProductStore((state) => state.setSearchQuery);
  const setSelectedCategory = useProductStore((state) => state.setSelectedCategory);
  const setSortBy = useProductStore((state) => state.setSortBy);
  const getFilteredProducts = useProductStore((state) => state.getFilteredProducts);
  const getCategories = useProductStore((state) => state.getCategories);

  const { isAuthenticated, isOwner } = useAuthStore();

  const [showSortOptions, setShowSortOptions] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Detail & stock modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [stockModalVisible, setStockModalVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Header auth button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push(isAuthenticated ? '/(admin)/dashboard' : '/(auth)/login')}
          style={styles.headerBtn}
        >
          {isAuthenticated ? (
            <Shield size={20} color={Colors.accent as any} />
          ) : (
            <User size={20} color={Colors.text as any} />
          )}
        </TouchableOpacity>
      ),
    });
  }, [isAuthenticated, navigation]);

  const handleSearchChange = (text: string) => {
    setLocalQuery(text);
    setSearchQuery(text);
  };

  const handleClearSearch = () => {
    setLocalQuery('');
    setSearchQuery('');
  };

  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
  };

  const handleCardPress = (product: Product) => {
    setSelectedProduct(product);
    setDetailVisible(true);
  };

  const handleEditFromDetail = () => {
    setDetailVisible(false);
    if (selectedProduct) {
      router.push({
        pathname: '/(admin)/dashboard',
        params: { editProductId: selectedProduct._id },
      });
    }
  };

  const handleStockUpdateFromDetail = () => {
    setDetailVisible(false);
    setStockModalVisible(true);
  };

  const filteredProducts = getFilteredProducts();
  const categories = getCategories();

  const renderItem = ({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      onPress={() => handleCardPress(item)}
      showChevron={true}
    />
  );

  const getItemLayout = (_data: any, index: number) => ({
    length: 120,
    offset: 120 * index,
    index,
  });

  const SORT_OPTIONS = [
    { key: 'name_asc', label: 'Name (A-Z)' },
    { key: 'price_asc', label: 'Price (Low-High)' },
    { key: 'price_desc', label: 'Price (High-Low)' },
    { key: 'stock_asc', label: 'Stock (Low-High)' },
    { key: 'stock_desc', label: 'Stock (High-Low)' },
  ] as const;

  const currentSortLabel = SORT_OPTIONS.find(o => o.key === sortBy)?.label || 'Sort';

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.mainView, { opacity: fadeAnim }]}>

        {/* Sync Info Header */}
        <View style={styles.syncContainer}>
          <Text style={styles.syncText}>
            {syncError
              ? `${syncError}`
              : lastSynced
                ? `Last Synced: ${lastSynced}`
                : 'Not Synced'}
          </Text>
          <TouchableOpacity
            disabled={isSyncing}
            onPress={() => syncWithServer()}
            style={styles.syncBtn}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color={Colors.accent} />
            ) : (
              <RotateCw size={12} color={Colors.textSecondary as any} />
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar Group */}
        <View style={styles.searchBarRow}>
          <View style={styles.searchContainer}>
            <Search size={18} color={Colors.textSecondary as any} style={styles.searchIcon} />
            <TextInput
              value={localQuery}
              onChangeText={handleSearchChange}
              placeholder="Search Name, Code, or Barcode..."
              placeholderTextColor={Colors.textSecondary}
              style={styles.searchInput}
            />
            {localQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch} style={styles.clearBtn}>
                <X size={16} color={Colors.textSecondary as any} />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity
            onPress={() => router.push('/scanner')}
            style={styles.scanBtn}
          >
            <ScanBarcode size={22} color={Colors.background as any} />
          </TouchableOpacity>
        </View>

        {/* Categories Scroller */}
        <View style={styles.categoriesRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => handleCategoryPress(cat)}
                  style={[
                    styles.categoryTab,
                    isSelected && styles.categoryTabSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      isSelected && styles.categoryTextSelected,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Filters and Sorting Bar */}
        <View style={styles.filterBar}>
          <Text style={styles.resultsCount}>
            {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
          </Text>
          
          <TouchableOpacity
            onPress={() => setShowSortOptions(!showSortOptions)}
            style={styles.sortToggle}
          >
            <SlidersHorizontal size={14} color={Colors.accent as any} style={{ marginRight: 6 }} />
            <Text style={styles.sortToggleText}>{currentSortLabel}</Text>
            <ChevronDown size={14} color={Colors.textSecondary as any} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        {/* Sorting Dropdown */}
        {showSortOptions && (
          <View style={styles.sortDropdown}>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => { setSortBy(opt.key); setShowSortOptions(false); }}
                style={[styles.sortOption, sortBy === opt.key && styles.sortOptionSelected]}
              >
                <Text style={[styles.sortOptionText, sortBy === opt.key && styles.sortOptionTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Products FlatList */}
        <FlatList
          data={filteredProducts}
          renderItem={renderItem}
          keyExtractor={(item: Product) => item._id}
          getItemLayout={getItemLayout}
          maxToRenderPerBatch={8}
          windowSize={5}
          initialNumToRender={8}
          removeClippedSubviews={true}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isSyncing}
              onRefresh={() => syncWithServer()}
              tintColor={Colors.accent}
              colors={[Colors.accent]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Products Found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search filters or check your spelling.
              </Text>
            </View>
          }
        />
      </Animated.View>

      {/* Product Detail Sheet — opens for everyone */}
      <ProductDetailSheet
        visible={detailVisible}
        product={selectedProduct}
        onClose={() => setDetailVisible(false)}
        isOwner={isOwner()}
        onEdit={handleEditFromDetail}
        onStockUpdate={handleStockUpdateFromDetail}
      />

      {/* Stock Update Modal — owner only */}
      <StockUpdateModal
        visible={stockModalVisible}
        product={selectedProduct}
        onClose={() => setStockModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mainView: {
    flex: 1,
  },
  headerBtn: {
    padding: 8,
    marginRight: 8,
  },
  syncContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#0A0A0A',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  syncText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  syncBtn: {
    padding: 4,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  scanBtn: {
    width: 48,
    height: 48,
    backgroundColor: Colors.text,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  categoriesRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  categoriesScroll: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 4,
  },
  categoryTabSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  categoryText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: Colors.accent,
    fontWeight: '600',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sortToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  sortDropdown: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sortOption: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  sortOptionSelected: {
    backgroundColor: 'rgba(10, 132, 255, 0.05)',
  },
  sortOptionText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  sortOptionTextSelected: {
    color: Colors.accent,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
