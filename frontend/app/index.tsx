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
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useColors } from '../src/theme/colors';
import { useThemeStore } from '../src/store/useThemeStore';
import { useBrandingStore } from '../src/store/useBrandingStore';
import { useProductStore, Product } from '../src/store/useProductStore';
import { useAuthStore } from '../src/store/useAuthStore';
import { ProductCard } from '../src/components/ProductCard';
import { ProductDetailSheet } from '../src/components/ProductDetailSheet';
import { StockUpdateModal } from '../src/components/StockUpdateModal';
import { QuickPriceModal } from '../src/components/QuickPriceModal';
import { QuotationMakerModal } from '../src/components/QuotationMakerModal';
import { BrandStockInfographic } from '../src/components/BrandStockInfographic';
import {
  Search,
  ScanBarcode,
  SlidersHorizontal,
  ChevronDown,
  RotateCw,
  User,
  Shield,
  X,
  FileText,
  Sun,
  Moon,
} from 'lucide-react-native';

const SearchIcon = Search as any;
const ScanBarcodeIcon = ScanBarcode as any;
const SlidersHorizontalIcon = SlidersHorizontal as any;
const ChevronDownIcon = ChevronDown as any;
const RotateCwIcon = RotateCw as any;
const UserIcon = User as any;
const ShieldIcon = Shield as any;
const XIcon = X as any;
const FileTextIcon = FileText as any;
const SunIcon = Sun as any;
const MoonIcon = Moon as any;

export default function SearchScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const colors = useColors();
  const { theme, toggleTheme, loadTheme } = useThemeStore();
  const branding = useBrandingStore();

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

  const { isAuthenticated, isOwner, user, token } = useAuthStore();

  const [showSortOptions, setShowSortOptions] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [stockModalProduct, setStockModalProduct] = useState<Product | null>(null);
  const [quickPriceModalVisible, setQuickPriceModalVisible] = useState(false);
  const [quickPriceProduct, setQuickPriceProduct] = useState<Product | null>(null);
  const [quotationModalVisible, setQuotationModalVisible] = useState(false);
  const [quotePrefillProduct, setQuotePrefillProduct] = useState<Product | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadTheme();
    branding.loadBranding();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Header navigation buttons (Theme, Quotation, Login/Admin)
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleWrap}>
          {branding.logoUri ? (
            <Image source={{ uri: branding.logoUri }} style={styles.headerLogo} resizeMode="contain" />
          ) : null}
          <Text style={[styles.headerTitleText, { color: colors.text }]}>
            {branding.storeName || 'SmartPrice'}
          </Text>
        </View>
      ),
      headerRight: () => (
        <View style={styles.headerButtonsRow}>
          {/* Theme Switcher Pill */}
          <TouchableOpacity
            onPress={toggleTheme}
            style={[
              styles.themePillBtn,
              { backgroundColor: colors.inputBackground, borderColor: colors.border },
            ]}
          >
            {theme === 'dark' ? (
              <>
                <SunIcon size={14} color="#FFD60A" style={{ marginRight: 4 }} />
                <Text style={[styles.themePillText, { color: colors.text }]}>Light</Text>
              </>
            ) : (
              <>
                <MoonIcon size={14} color="#5856D6" style={{ marginRight: 4 }} />
                <Text style={[styles.themePillText, { color: colors.text }]}>Dark</Text>
              </>
            )}
          </TouchableOpacity>

          {/* New Quotation Button */}
          <TouchableOpacity
            onPress={() => {
              setQuotePrefillProduct(null);
              setQuotationModalVisible(true);
            }}
            style={[styles.quoteHeaderBtn, { backgroundColor: colors.accentLight }]}
          >
            <FileTextIcon size={16} color={colors.accent} style={{ marginRight: 4 }} />
            <Text style={[styles.quoteHeaderText, { color: colors.accent }]}>Quote</Text>
          </TouchableOpacity>

          {/* Auth Button */}
          <TouchableOpacity
            onPress={() => router.push(isAuthenticated ? '/(admin)/dashboard' : '/(auth)/login')}
            style={styles.headerBtn}
          >
            {isAuthenticated ? (
              <ShieldIcon size={20} color={colors.accent} />
            ) : (
              <UserIcon size={20} color={colors.text} />
            )}
          </TouchableOpacity>
        </View>
      ),
    });
  }, [isAuthenticated, colors, theme, branding.storeName, branding.logoUri, navigation]);

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
    if (selectedProduct) {
      setStockModalProduct(selectedProduct);
      setDetailVisible(false);
      setStockModalVisible(true);
    }
  };

  const handleQuickPriceFromDetail = () => {
    if (selectedProduct) {
      setQuickPriceProduct(selectedProduct);
      setDetailVisible(false);
      setQuickPriceModalVisible(true);
    }
  };

  const handleQuickPriceFromCard = (product: Product) => {
    setQuickPriceProduct(product);
    setQuickPriceModalVisible(true);
  };

  const handleQuickStockFromCard = (product: Product) => {
    setStockModalProduct(product);
    setStockModalVisible(true);
  };

  const handleAddToQuote = (product: Product) => {
    setQuotePrefillProduct(product);
    setQuotationModalVisible(true);
  };

  const filteredProducts = getFilteredProducts();
  const categories = getCategories();

  const renderItem = ({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      onPress={() => handleCardPress(item)}
      showChevron={true}
      onQuickPrice={isOwner() ? handleQuickPriceFromCard : undefined}
      onQuickStock={handleQuickStockFromCard}
      onAddToQuote={handleAddToQuote}
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

  const currentSortLabel = SORT_OPTIONS.find((o) => o.key === sortBy)?.label || 'Sort';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.mainView, { opacity: fadeAnim }]}>
        {/* Sync Info Header */}
        <View style={styles.syncContainer}>
          <Text style={[styles.syncText, { color: colors.textSecondary }]}>
            {syncError
              ? `${syncError}`
              : lastSynced
              ? `Last Synced: ${lastSynced}`
              : 'Not Synced'}
          </Text>
          <TouchableOpacity
            disabled={isSyncing}
            onPress={() => syncWithServer(token)}
            style={styles.syncBtn}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <RotateCwIcon size={12} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarRow}>
          <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
            <SearchIcon size={18} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              value={localQuery}
              onChangeText={handleSearchChange}
              placeholder="Search products by name, code or brand..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {localQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch} style={styles.clearBtn}>
                <XIcon size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Brand Stock Infographic Widget (Shows Brand Stock Pieces & Quick Filter) */}
        <BrandStockInfographic />

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
                    {
                      backgroundColor: isSelected ? colors.accent : colors.card,
                      borderColor: isSelected ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      { color: isSelected ? '#FFFFFF' : colors.textSecondary },
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
          <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
            {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
          </Text>

          <TouchableOpacity
            onPress={() => setShowSortOptions(!showSortOptions)}
            style={styles.sortToggle}
          >
            <SlidersHorizontalIcon size={14} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={[styles.sortToggleText, { color: colors.accent }]}>{currentSortLabel}</Text>
            <ChevronDownIcon size={14} color={colors.textSecondary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        {/* Sorting Dropdown */}
        {showSortOptions && (
          <View style={[styles.sortDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => {
                  setSortBy(opt.key);
                  setShowSortOptions(false);
                }}
                style={[
                  styles.sortOption,
                  sortBy === opt.key && { backgroundColor: colors.accentLight },
                ]}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    { color: sortBy === opt.key ? colors.accent : colors.text },
                  ]}
                >
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
              onRefresh={() => syncWithServer(token)}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Products Found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Try adjusting your search filters or check your spelling.
              </Text>
            </View>
          }
        />
      </Animated.View>

      {/* Product Detail Sheet */}
      <ProductDetailSheet
        visible={detailVisible}
        product={selectedProduct}
        onClose={() => setDetailVisible(false)}
        onEdit={isOwner() ? handleEditFromDetail : undefined}
        onStockUpdate={handleStockUpdateFromDetail}
        onQuickPrice={isOwner() ? handleQuickPriceFromDetail : undefined}
        onAddToQuote={() => {
          if (selectedProduct) handleAddToQuote(selectedProduct);
        }}
        isOwner={isOwner()}
      />

      {/* Quick Price Modal (Admin Only) */}
      <QuickPriceModal
        visible={quickPriceModalVisible}
        product={quickPriceProduct}
        onClose={() => {
          setQuickPriceModalVisible(false);
          setQuickPriceProduct(null);
        }}
      />

      {/* Quick Stock Modal (Admin & Sales Person) */}
      <StockUpdateModal
        visible={stockModalVisible}
        product={stockModalProduct}
        onClose={() => {
          setStockModalVisible(false);
          setStockModalProduct(null);
        }}
      />

      {/* Quotation Maker Modal */}
      <QuotationMakerModal
        visible={quotationModalVisible}
        preselectedProduct={quotePrefillProduct}
        onClose={() => {
          setQuotationModalVisible(false);
          setQuotePrefillProduct(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainView: {
    flex: 1,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 26,
    height: 26,
    borderRadius: 6,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    padding: 6,
  },
  themePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  themePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  quoteHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  quoteHeaderText: {
    fontSize: 12,
    fontWeight: '700',
  },
  syncContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 6,
  },
  syncText: {
    fontSize: 11,
  },
  syncBtn: {
    padding: 2,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 6,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  clearBtn: {
    padding: 4,
  },
  categoriesRow: {
    marginBottom: 6,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  sortToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sortDropdown: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  sortOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  sortOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
});
