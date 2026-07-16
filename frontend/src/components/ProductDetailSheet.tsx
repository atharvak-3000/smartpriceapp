import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Product } from '../store/useProductStore';
import {
  X,
  Hash,
  Tag,
  Layers,
  Package,
  FileText,
  Edit3,
  TrendingUp,
} from 'lucide-react-native';

const XIcon = X as any;
const HashIcon = Hash as any;
const TagIcon = Tag as any;
const LayersIcon = Layers as any;
const PackageIcon = Package as any;
const FileTextIcon = FileText as any;
const Edit3Icon = Edit3 as any;
const TrendingUpIcon = TrendingUp as any;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProductDetailSheetProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onEdit?: () => void;         // Only shown to owners
  onStockUpdate?: () => void;  // Only shown to owners
  isOwner?: boolean;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);

const getStockConfig = (stock: number) => {
  if (stock === 0) return { label: 'Out of Stock', color: Colors.error, bg: 'rgba(255,69,58,0.12)' };
  if (stock <= 5) return { label: `Low Stock — ${stock} left`, color: '#FF9F0A', bg: 'rgba(255,159,10,0.12)' };
  return { label: `${stock} units available`, color: Colors.success, bg: 'rgba(48,209,88,0.12)' };
};

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconWrap}>{icon}</View>
    <View style={styles.infoTextWrap}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

export const ProductDetailSheet: React.FC<ProductDetailSheetProps> = ({
  visible,
  product,
  onClose,
  onEdit,
  onStockUpdate,
  isOwner = false,
}) => {
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!product) return null;

  const stockConfig = getStockConfig(product.stock ?? 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={onClose} />

        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle Bar */}
          <View style={styles.handleBar} />

          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <XIcon size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
          >
            {/* Product Image */}
            {product.imageUrl ? (
              <Image
                source={{ uri: product.imageUrl }}
                style={styles.productImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <PackageIcon size={56} color={Colors.textSecondary} />
                <Text style={styles.noImageText}>No Image Available</Text>
              </View>
            )}

            {/* Status Badge */}
            {product.status === 'inactive' && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>INACTIVE PRODUCT</Text>
              </View>
            )}

            {/* Product Name */}
            <Text style={styles.productName}>{product.productName}</Text>
            <Text style={styles.brandText}>{product.brand}</Text>

            {/* Price Block */}
            <View style={styles.priceBlock}>
              <Text style={styles.priceLabel}>Selling Price</Text>
              <Text style={styles.priceValue}>{formatPrice(product.price)}</Text>
            </View>

            {/* Stock Block */}
            <View style={[styles.stockBlock, { backgroundColor: stockConfig.bg }]}>
              <PackageIcon size={16} color={stockConfig.color} />
              <Text style={[styles.stockText, { color: stockConfig.color }]}>
                {stockConfig.label}
              </Text>
              {isOwner && onStockUpdate && (
                <TouchableOpacity onPress={onStockUpdate} style={styles.adjustStockBtn}>
                  <TrendingUpIcon size={14} color={Colors.accent} />
                  <Text style={styles.adjustStockText}>Adjust</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Info Grid */}
            <View style={styles.infoCard}>
              <InfoRow
                icon={<HashIcon size={16} color={Colors.accent} />}
                label="Product Code (SKU)"
                value={product.productCode}
              />
              {product.barcode && (
                <InfoRow
                  icon={<TagIcon size={16} color={Colors.accent} />}
                  label="Barcode"
                  value={product.barcode}
                />
              )}
              <InfoRow
                icon={<LayersIcon size={16} color={Colors.accent} />}
                label="Category"
                value={product.category}
              />
              <InfoRow
                icon={<PackageIcon size={16} color={Colors.accent} />}
                label="Brand"
                value={product.brand}
              />
            </View>

            {/* Description */}
            {product.description ? (
              <View style={styles.descriptionCard}>
                <View style={styles.descriptionHeader}>
                  <FileTextIcon size={16} color={Colors.textSecondary} />
                  <Text style={styles.descriptionTitle}>Description</Text>
                </View>
                <Text style={styles.descriptionText}>{product.description}</Text>
              </View>
            ) : null}

            {/* Owner Actions */}
            {isOwner && onEdit && (
              <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
                <Edit3Icon size={16} color={Colors.background} />
                <Text style={styles.editBtnText}>Edit Product</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Colors.border,
    maxHeight: '92%',
    paddingTop: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    zIndex: 10,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  productImage: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    backgroundColor: '#1C1C1E',
    marginBottom: 20,
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  noImageText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 10,
  },
  inactiveBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,69,58,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  inactiveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.error,
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 30,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  brandText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    fontWeight: '500',
  },
  priceBlock: {
    backgroundColor: 'rgba(48,209,88,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(48,209,88,0.2)',
    padding: 16,
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.success,
    letterSpacing: -1,
  },
  stockBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  adjustStockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  adjustStockText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
  },
  descriptionCard: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 20,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  descriptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  editBtn: {
    height: 50,
    backgroundColor: Colors.text,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  editBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.background,
  },
});
