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
import { useColors } from '../theme/colors';
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
  ShoppingBag,
  IndianRupee,
} from 'lucide-react-native';

const XIcon = X as any;
const HashIcon = Hash as any;
const TagIcon = Tag as any;
const LayersIcon = Layers as any;
const PackageIcon = Package as any;
const FileTextIcon = FileText as any;
const Edit3Icon = Edit3 as any;
const TrendingUpIcon = TrendingUp as any;
const ShoppingBagIcon = ShoppingBag as any;
const IndianRupeeIcon = IndianRupee as any;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProductDetailSheetProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onEdit?: () => void;
  onStockUpdate?: () => void;
  onQuickPrice?: () => void;
  onAddToQuote?: () => void;
  isOwner?: boolean;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);

export const ProductDetailSheet: React.FC<ProductDetailSheetProps> = ({
  visible,
  product,
  onClose,
  onEdit,
  onStockUpdate,
  onQuickPrice,
  onAddToQuote,
  isOwner = false,
}) => {
  const colors = useColors();
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

  const currentStock = product.stock ?? 0;
  const salePrice = product.salePrice ?? product.price ?? 0;
  const mrpPrice = product.mrpPrice ?? salePrice;
  const wholesalePrice = product.wholesalePrice;

  const getStockConfig = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: colors.error, bg: 'rgba(255,69,58,0.12)' };
    if (stock <= 5) return { label: `Low Stock — ${stock} pieces left`, color: colors.warning, bg: 'rgba(255,159,10,0.12)' };
    return { label: `${stock} pieces available`, color: colors.success, bg: 'rgba(48,209,88,0.12)' };
  };

  const stockConfig = getStockConfig(currentStock);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={onClose} />

        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.card, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Handle Bar */}
          <View style={[styles.handleBar, { backgroundColor: colors.border }]} />

          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <XIcon size={20} color={colors.textSecondary} />
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
              <View
                style={[
                  styles.imagePlaceholder,
                  { backgroundColor: colors.inputBackground, borderColor: colors.border },
                ]}
              >
                <PackageIcon size={48} color={colors.textSecondary} />
                <Text style={[styles.noImageText, { color: colors.textSecondary }]}>
                  No Image Available
                </Text>
              </View>
            )}

            {/* Product Name & Brand */}
            <Text style={[styles.productName, { color: colors.text }]}>{product.productName}</Text>
            <Text style={[styles.brandText, { color: colors.textSecondary }]}>
              {product.brand} • {product.category}
            </Text>

            {/* Price Box */}
            <View style={[styles.priceBlock, { backgroundColor: colors.inputBackground }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Sale Price</Text>
                <Text style={[styles.priceValue, { color: colors.price }]}>
                  {formatPrice(salePrice)}
                </Text>
              </View>

              {/* Admin Quick Price Action */}
              {isOwner && onQuickPrice && (
                <TouchableOpacity
                  onPress={onQuickPrice}
                  style={[styles.quickPriceBtn, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}
                >
                  <IndianRupeeIcon size={14} color={colors.accent} />
                  <Text style={[styles.quickPriceBtnText, { color: colors.accent }]}>Quick Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 3-Tier Prices (For Admin) */}
            {isOwner && (
              <View style={[styles.tierPriceBox, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                <View style={styles.tierCol}>
                  <Text style={[styles.tierLabel, { color: colors.textSecondary }]}>MRP Price</Text>
                  <Text style={[styles.tierVal, { color: colors.text }]}>
                    {formatPrice(mrpPrice)}
                  </Text>
                </View>
                <View style={[styles.tierDivider, { backgroundColor: colors.border }]} />
                <View style={styles.tierCol}>
                  <Text style={[styles.tierLabel, { color: colors.textSecondary }]}>Wholesale Price</Text>
                  <Text style={[styles.tierVal, { color: colors.wholesale }]}>
                    {wholesalePrice !== undefined ? formatPrice(wholesalePrice) : 'N/A'}
                  </Text>
                </View>
              </View>
            )}

            {/* Stock Block — Now accessible to Both Admin and Sales Person! */}
            <View style={[styles.stockBlock, { backgroundColor: stockConfig.bg }]}>
              <PackageIcon size={16} color={stockConfig.color} />
              <Text style={[styles.stockText, { color: stockConfig.color }]}>
                {stockConfig.label}
              </Text>
              {onStockUpdate && (
                <TouchableOpacity
                  onPress={onStockUpdate}
                  style={[styles.adjustStockBtn, { backgroundColor: colors.card }]}
                >
                  <TrendingUpIcon size={14} color={colors.accent} />
                  <Text style={[styles.adjustStockText, { color: colors.accent }]}>
                    Add / Release
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Info Rows */}
            <View style={[styles.infoCard, { backgroundColor: colors.inputBackground }]}>
              <View style={styles.infoRow}>
                <View style={[styles.infoIconWrap, { backgroundColor: colors.accentLight }]}>
                  <HashIcon size={16} color={colors.accent} />
                </View>
                <View style={styles.infoTextWrap}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Product Code (SKU)</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{product.productCode}</Text>
                </View>
              </View>



              {product.description && (
                <View style={styles.infoRow}>
                  <View style={[styles.infoIconWrap, { backgroundColor: colors.accentLight }]}>
                    <FileTextIcon size={16} color={colors.accent} />
                  </View>
                  <View style={styles.infoTextWrap}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Description</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>{product.description}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              {onAddToQuote && (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onAddToQuote();
                  }}
                  style={[styles.quoteBtn, { backgroundColor: colors.accent }]}
                >
                  <ShoppingBagIcon size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.quoteBtnText}>Add to Quotation</Text>
                </TouchableOpacity>
              )}

              {isOwner && onEdit && (
                <TouchableOpacity
                  onPress={onEdit}
                  style={[styles.editBtn, { borderColor: colors.border }]}
                >
                  <Edit3Icon size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.editBtnText, { color: colors.textSecondary }]}>
                    Edit Product
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 16,
    zIndex: 10,
    padding: 6,
  },
  scrollContent: {
    padding: 20,
    gap: 12,
  },
  productImage: {
    width: '100%',
    height: 180,
    borderRadius: 14,
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  noImageText: {
    fontSize: 12,
  },
  productName: {
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 25,
  },
  brandText: {
    fontSize: 13,
    fontWeight: '500',
  },
  priceBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 2,
  },
  quickPriceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickPriceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  tierPriceBox: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  tierCol: {
    flex: 1,
    alignItems: 'center',
  },
  tierLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tierVal: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  tierDivider: {
    width: 1,
    height: '100%',
  },
  stockBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  stockText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  adjustStockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  adjustStockText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoCard: {
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  actionsRow: {
    gap: 8,
    marginTop: 8,
  },
  quoteBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quoteBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  editBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
