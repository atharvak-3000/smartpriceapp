import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import { useColors } from '../../src/theme/colors';
import { useThemeStore } from '../../src/store/useThemeStore';
import { useBrandingStore } from '../../src/store/useBrandingStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useProductStore, Product } from '../../src/store/useProductStore';
import { ProductCard } from '../../src/components/ProductCard';
import { AddEditProductModal } from '../../src/components/AddEditProductModal';
import { StockUpdateModal } from '../../src/components/StockUpdateModal';
import { QuickPriceModal } from '../../src/components/QuickPriceModal';
import { QuotationMakerModal } from '../../src/components/QuotationMakerModal';
import { LogoUploadModal } from '../../src/components/LogoUploadModal';
import { BrandStockInfographic } from '../../src/components/BrandStockInfographic';
import {
  Plus,
  LogOut,
  FolderOpen,
  ShoppingBag,
  History,
  Scan,
  AlertTriangle,
  IndianRupee,
  Layers,
  Store,
  FileText,
  Sun,
  Moon,
} from 'lucide-react-native';

const AlertTriangleIcon = AlertTriangle as any;
const IndianRupeeIcon = IndianRupee as any;
const PlusIcon = Plus as any;
const LogOutIcon = LogOut as any;
const FolderOpenIcon = FolderOpen as any;
const ShoppingBagIcon = ShoppingBag as any;
const HistoryIcon = History as any;
const ScanIcon = Scan as any;
const LayersIcon = Layers as any;
const StoreIcon = Store as any;
const FileTextIcon = FileText as any;
const SunIcon = Sun as any;
const MoonIcon = Moon as any;

export default function AdminDashboardScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const colors = useColors();
  const { theme, toggleTheme } = useThemeStore();
  const branding = useBrandingStore();

  const { user, logout, isAuthenticated } = useAuthStore();
  const products = useProductStore((state) => state.products);
  const getCategories = useProductStore((state) => state.getCategories);
  const getLowStockProducts = useProductStore((state) => state.getLowStockProducts);
  const getTotalStockValue = useProductStore((state) => state.getTotalStockValue);
  const getTotalStockCount = useProductStore((state) => state.getTotalStockCount);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);

  const [quickPriceModalVisible, setQuickPriceModalVisible] = useState(false);
  const [quickPriceProduct, setQuickPriceProduct] = useState<Product | null>(null);

  const [quotationModalVisible, setQuotationModalVisible] = useState(false);
  const [quotePrefillProduct, setQuotePrefillProduct] = useState<Product | null>(null);

  const [logoModalVisible, setLogoModalVisible] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRightRow}>
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

          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <LogOutIcon size={18} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, colors, theme]);

  // Handle incoming screen params
  useEffect(() => {
    if (params.editProductId) {
      const prod = products.find((p) => p._id === params.editProductId);
      if (prod) {
        setSelectedProduct(prod);
        setModalVisible(true);
      }
      router.setParams({ editProductId: '' });
    }
  }, [params, products]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/');
        },
      },
    ]);
  };

  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const handleAddNew = () => {
    setSelectedProduct(null);
    setModalVisible(true);
  };

  const handleQuickStock = (product: Product) => {
    setStockProduct(product);
    setStockModalVisible(true);
  };

  const handleQuickPrice = (product: Product) => {
    setQuickPriceProduct(product);
    setQuickPriceModalVisible(true);
  };

  const handleAddToQuote = (product: Product) => {
    setQuotePrefillProduct(product);
    setQuotationModalVisible(true);
  };

  // Stats
  const totalProducts = products.length;
  const totalCategories = getCategories().filter((c) => c !== 'All').length;
  const totalStockUnits = getTotalStockCount();
  const totalStockValue = getTotalStockValue();
  const lowStockProducts = getLowStockProducts(5);

  const recentlyUpdated = [...products]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Store Logo & Welcome Banner */}
      <View style={[styles.brandingBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.storeBrandingInfo}>
          {branding.logoUri ? (
            <Image source={{ uri: branding.logoUri }} style={styles.bannerLogo} resizeMode="contain" />
          ) : (
            <View style={[styles.bannerLogoPlaceholder, { backgroundColor: colors.accentLight }]}>
              <StoreIcon size={24} color={colors.accent} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.welcomeText, { color: colors.text }]}>
              Hello, {user?.name || 'Store Owner'}
            </Text>
            <Text style={[styles.dashboardSubtitle, { color: colors.textSecondary }]}>
              {branding.storeName} • Admin Control Panel
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setLogoModalVisible(true)}
          style={[styles.editBrandingBtn, { borderColor: colors.accent }]}
        >
          <Text style={[styles.editBrandingText, { color: colors.accent }]}>Upload Logo</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Bento Grid — 4 Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.accentLight }]}>
            <ShoppingBagIcon size={18} color={colors.accent} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{totalProducts}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Products</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statIconContainer, { backgroundColor: 'rgba(48,209,88,0.1)' }]}>
            <LayersIcon size={18} color={colors.price} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{totalStockUnits}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Units</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statIconContainer, { backgroundColor: 'rgba(191,90,242,0.1)' }]}>
            <FolderOpenIcon size={18} color="#BF5AF2" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{totalCategories}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Categories</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255,159,10,0.1)' }]}>
            <IndianRupeeIcon size={18} color={colors.warning} />
          </View>
          <Text numberOfLines={1} style={[styles.statValue, { fontSize: 15, color: colors.text }]}>
            {formatCurrency(totalStockValue)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Stock Value</Text>
        </View>
      </View>

      {/* Brand Stock Distribution Infographics */}
      <BrandStockInfographic />

      {/* Primary Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={handleAddNew}
          style={[styles.actionBtn, { backgroundColor: colors.accent }]}
        >
          <PlusIcon size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.actionBtnText}>Add Product</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setQuotePrefillProduct(null);
            setQuotationModalVisible(true);
          }}
          style={[styles.actionBtn, { backgroundColor: colors.price }]}
        >
          <FileTextIcon size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.actionBtnText}>Make Quotation</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setLogoModalVisible(true)}
          style={[styles.actionBtn, styles.scanActionBtn, { borderColor: colors.border }]}
        >
          <StoreIcon size={18} color={colors.text} style={{ marginRight: 6 }} />
          <Text style={[styles.actionBtnText, { color: colors.text }]}>Store Info</Text>
        </TouchableOpacity>
      </View>

      {/* Low Stock Alert Section */}
      {lowStockProducts.length > 0 && (
        <View style={[styles.lowStockSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.lowStockHeader}>
            <AlertTriangleIcon size={16} color={colors.warning} />
            <Text style={[styles.lowStockTitle, { color: colors.text }]}>
              Low Stock Alert ({lowStockProducts.length})
            </Text>
          </View>
          {lowStockProducts.slice(0, 4).map((p) => (
            <TouchableOpacity
              key={p._id}
              style={[styles.lowStockRow, { borderBottomColor: colors.border }]}
              onPress={() => handleQuickStock(p)}
            >
              <View style={styles.lowStockInfo}>
                <Text style={[styles.lowStockName, { color: colors.text }]} numberOfLines={1}>
                  {p.productName}
                </Text>
                <Text style={[styles.lowStockCode, { color: colors.textSecondary }]}>
                  {p.brand} • {p.productCode}
                </Text>
              </View>
              <View
                style={[
                  styles.lowStockBadge,
                  {
                    backgroundColor:
                      p.stock === 0 ? 'rgba(255,69,58,0.15)' : 'rgba(255,159,10,0.15)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.lowStockBadgeText,
                    { color: p.stock === 0 ? colors.error : colors.warning },
                  ]}
                >
                  {p.stock === 0 ? 'Out of Stock' : `${p.stock} left`}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* List Header */}
      <View style={styles.listHeader}>
        <HistoryIcon size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
        <Text style={[styles.listHeaderTitle, { color: colors.textSecondary }]}>
          Recently Updated Products
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={recentlyUpdated}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => handleProductPress(item)}
            showChevron={true}
            onQuickPrice={handleQuickPrice}
            onQuickStock={handleQuickStock}
            onAddToQuote={handleAddToQuote}
          />
        )}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.scrollContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No products added yet.
            </Text>
          </View>
        }
      />

      {/* Add / Edit Sheet Modal */}
      <AddEditProductModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />

      {/* Quick Price Modal (Admin) */}
      <QuickPriceModal
        visible={quickPriceModalVisible}
        product={quickPriceProduct}
        onClose={() => {
          setQuickPriceModalVisible(false);
          setQuickPriceProduct(null);
        }}
      />

      {/* Quick Stock Modal */}
      <StockUpdateModal
        visible={stockModalVisible}
        product={stockProduct}
        onClose={() => {
          setStockModalVisible(false);
          setStockProduct(null);
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

      {/* Logo & Store Branding Modal */}
      <LogoUploadModal
        visible={logoModalVisible}
        onClose={() => setLogoModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  headerIconBtn: {
    padding: 6,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  headerContainer: {
    paddingTop: 10,
  },
  brandingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  storeBrandingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bannerLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  bannerLogoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 17,
    fontWeight: '800',
  },
  dashboardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  editBrandingBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  editBrandingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '46%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scanActionBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  lowStockSection: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  lowStockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  lowStockTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  lowStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  lowStockInfo: {
    flex: 1,
    marginRight: 10,
  },
  lowStockName: {
    fontSize: 13,
    fontWeight: '600',
  },
  lowStockCode: {
    fontSize: 11,
    marginTop: 2,
  },
  lowStockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lowStockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 6,
  },
  listHeaderTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 14,
  },
});
