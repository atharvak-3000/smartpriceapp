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
} from 'react-native';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useProductStore, Product } from '../../src/store/useProductStore';
import { ProductCard } from '../../src/components/ProductCard';
import { AddEditProductModal } from '../../src/components/AddEditProductModal';
import { StockUpdateModal } from '../../src/components/StockUpdateModal';
import {
  Plus,
  LogOut,
  FolderOpen,
  ShoppingBag,
  History,
  Scan,
  AlertTriangle,
  IndianRupee,
} from 'lucide-react-native';

const AlertTriangleIcon = AlertTriangle as any;
const IndianRupeeIcon = IndianRupee as any;

export default function AdminDashboardScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();

  const { user, logout, isAuthenticated } = useAuthStore();
  const products = useProductStore((state) => state.products);
  const getCategories = useProductStore((state) => state.getCategories);
  const getLowStockProducts = useProductStore((state) => state.getLowStockProducts);
  const getTotalStockValue = useProductStore((state) => state.getTotalStockValue);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [prefilledBarcode, setPrefilledBarcode] = useState<string | null>(null);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={18} color={Colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Handle incoming screen params
  useEffect(() => {
    if (params.newBarcode) {
      setPrefilledBarcode(params.newBarcode as string);
      setSelectedProduct(null);
      setModalVisible(true);
      router.setParams({ newBarcode: '' });
    } else if (params.editProductId) {
      const prod = products.find((p) => p._id === params.editProductId);
      if (prod) {
        setSelectedProduct(prod);
        setPrefilledBarcode(null);
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
    setPrefilledBarcode(null);
    setModalVisible(true);
  };

  const handleAddNew = () => {
    setSelectedProduct(null);
    setPrefilledBarcode(null);
    setModalVisible(true);
  };

  const handleBarcodeScanRequested = () => {
    setModalVisible(false);
    router.push('/scanner');
  };

  const handleQuickStock = (product: Product) => {
    setStockProduct(product);
    setStockModalVisible(true);
  };

  // Stats
  const totalProducts = products.length;
  const totalCategories = getCategories().filter((c) => c !== 'All').length;
  const totalStockValue = getTotalStockValue();
  const lowStockProducts = getLowStockProducts(5);

  const recentlyUpdated = [...products]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.welcomeText}>Hello, {user?.name || 'Owner'}</Text>
      <Text style={styles.dashboardSubtitle}>Store Management Control Panel</Text>

      {/* Stats Bento Grid — 3 cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <ShoppingBag size={18} color={Colors.accent} />
          </View>
          <Text style={styles.statValue}>{totalProducts}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: 'rgba(48,209,88,0.1)' }]}>
            <FolderOpen size={18} color={Colors.price} />
          </View>
          <Text style={styles.statValue}>{totalCategories}</Text>
          <Text style={styles.statLabel}>Categories</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255,159,10,0.1)' }]}>
            <IndianRupeeIcon size={18} color="#FF9F0A" />
          </View>
          <Text style={[styles.statValue, { fontSize: 16 }]}>{formatCurrency(totalStockValue)}</Text>
          <Text style={styles.statLabel}>Stock Value</Text>
        </View>
      </View>

      {/* Low Stock Warning */}
      {lowStockProducts.length > 0 && (
        <View style={styles.lowStockSection}>
          <View style={styles.lowStockHeader}>
            <AlertTriangleIcon size={16} color="#FF9F0A" />
            <Text style={styles.lowStockTitle}>Low Stock Alert ({lowStockProducts.length})</Text>
          </View>
          {lowStockProducts.slice(0, 3).map((p) => (
            <TouchableOpacity
              key={p._id}
              style={styles.lowStockRow}
              onPress={() => handleQuickStock(p)}
            >
              <View style={styles.lowStockInfo}>
                <Text style={styles.lowStockName} numberOfLines={1}>{p.productName}</Text>
                <Text style={styles.lowStockCode}>{p.productCode}</Text>
              </View>
              <View style={[
                styles.lowStockBadge,
                { backgroundColor: p.stock === 0 ? 'rgba(255,69,58,0.15)' : 'rgba(255,159,10,0.15)' }
              ]}>
                <Text style={[
                  styles.lowStockBadgeText,
                  { color: p.stock === 0 ? Colors.error : '#FF9F0A' }
                ]}>
                  {p.stock === 0 ? 'Out' : `${p.stock} left`}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          {lowStockProducts.length > 3 && (
            <Text style={styles.moreText}>+{lowStockProducts.length - 3} more items low on stock</Text>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity onPress={handleAddNew} style={styles.actionBtn}>
          <Plus size={18} color="#000" style={{ marginRight: 6 }} />
          <Text style={styles.actionBtnText}>Add Product</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => router.push('/scanner')}
          style={[styles.actionBtn, styles.scanActionBtn]}
        >
          <Scan size={18} color={Colors.text} style={{ marginRight: 6 }} />
          <Text style={[styles.actionBtnText, { color: Colors.text }]}>Scan & Add</Text>
        </TouchableOpacity>
      </View>

      {/* List Header */}
      <View style={styles.listHeader}>
        <History size={16} color={Colors.textSecondary} style={{ marginRight: 6 }} />
        <Text style={styles.listHeaderTitle}>Recently Updated Products</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={recentlyUpdated}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => handleProductPress(item)}
            showChevron={true}
          />
        )}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.scrollContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products added yet.</Text>
          </View>
        }
      />

      {/* Add / Edit Sheet Modal */}
      <AddEditProductModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedProduct(null);
          setPrefilledBarcode(null);
        }}
        product={selectedProduct}
        onBarcodeScanRequested={handleBarcodeScanRequested}
        scannedBarcode={prefilledBarcode}
      />

      {/* Stock Update Modal */}
      <StockUpdateModal
        visible={stockModalVisible}
        product={stockProduct}
        onClose={() => {
          setStockModalVisible(false);
          setStockProduct(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginRight: 8,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.error,
    marginLeft: 6,
  },
  headerContainer: {
    padding: 16,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
  dashboardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  statIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: Colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  lowStockSection: {
    backgroundColor: 'rgba(255,159,10,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,159,10,0.2)',
    padding: 14,
    marginBottom: 20,
  },
  lowStockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  lowStockTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF9F0A',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  lowStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,159,10,0.15)',
  },
  lowStockInfo: {
    flex: 1,
    paddingRight: 10,
  },
  lowStockName: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  lowStockCode: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  lowStockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lowStockBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  moreText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    backgroundColor: Colors.text,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionBtnText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  scanActionBtn: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  listHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
