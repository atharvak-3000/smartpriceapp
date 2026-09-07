import React from 'react';
import { StyleSheet, Text, View, Pressable, Animated, Image, TouchableOpacity } from 'react-native';
import { useColors } from '../theme/colors';
import { Product } from '../store/useProductStore';
import { useAuthStore } from '../store/useAuthStore';
import { Barcode, ChevronRight, Hash, Package, Edit2, ShoppingBag, Plus, Minus } from 'lucide-react-native';

const BarcodeIcon = Barcode as any;
const ChevronRightIcon = ChevronRight as any;
const HashIcon = Hash as any;
const PackageIcon = Package as any;
const Edit2Icon = Edit2 as any;
const ShoppingBagIcon = ShoppingBag as any;

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  showChevron?: boolean;
  onQuickPrice?: (product: Product) => void;
  onQuickStock?: (product: Product) => void;
  onAddToQuote?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  showChevron = false,
  onQuickPrice,
  onQuickStock,
  onAddToQuote,
}) => {
  const colors = useColors();
  const isOwner = useAuthStore((state) => state.isOwner);
  const animatedScale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(animatedScale, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(animatedScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStockBadgeConfig = (stock: number) => {
    if (stock === 0) return { bg: 'rgba(255,69,58,0.12)', text: colors.error, label: 'Out of Stock' };
    if (stock <= 5) return { bg: 'rgba(255,159,10,0.12)', text: colors.warning, label: `Low: ${stock} pcs` };
    return { bg: 'rgba(48,209,88,0.12)', text: colors.success, label: `${stock} pcs` };
  };

  const currentStock = product.stock ?? 0;
  const stockConfig = getStockBadgeConfig(currentStock);

  // 3-Tier Prices
  const salePrice = product.salePrice ?? product.price ?? 0;
  const mrpPrice = product.mrpPrice ?? salePrice;
  const wholesalePrice = product.wholesalePrice;

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          transform: [{ scale: animatedScale }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }: any) => [
          styles.pressable,
          pressed && { backgroundColor: colors.cardSelected },
        ]}
      >
        <View style={styles.cardHeader}>
          {/* Product Image Thumbnail */}
          {product.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.thumbnailPlaceholder,
                { backgroundColor: colors.inputBackground, borderColor: colors.border },
              ]}
            >
              <PackageIcon size={20} color={colors.textSecondary} />
            </View>
          )}

          <View style={styles.leftCol}>
            <Text numberOfLines={2} style={[styles.productName, { color: colors.text }]}>
              {product.productName}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <HashIcon size={12} color={colors.textSecondary} style={styles.metaIcon} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {product.productCode}
                </Text>
              </View>
            </View>
          </View>

          {/* Pricing Column */}
          <View style={styles.rightCol}>
            <View style={styles.priceWithEdit}>
              <Text style={[styles.salePriceTag, { color: colors.price }]}>
                {formatPrice(salePrice)}
              </Text>

              {/* Admin Quick Price Edit Button */}
              {isOwner() && onQuickPrice && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onQuickPrice(product);
                  }}
                  style={[styles.quickPriceBtn, { backgroundColor: colors.accentLight }]}
                >
                  <Edit2Icon size={12} color={colors.accent} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.priceSubLabel, { color: colors.textSecondary }]}>Sale Price</Text>
          </View>
        </View>

        {/* 3-Tier Prices (For Admin / Superadmin) */}
        {isOwner() && (
          <View style={[styles.tierPriceBar, { backgroundColor: colors.inputBackground }]}>
            <Text style={[styles.tierPriceText, { color: colors.textSecondary }]}>
              MRP: <Text style={{ color: colors.text, fontWeight: '700' }}>{formatPrice(mrpPrice)}</Text>
            </Text>
            {wholesalePrice !== undefined && (
              <Text style={[styles.tierPriceText, { color: colors.textSecondary }]}>
                Wholesale:{' '}
                <Text style={{ color: colors.wholesale, fontWeight: '700' }}>
                  {formatPrice(wholesalePrice)}
                </Text>
              </Text>
            )}
          </View>
        )}

        {/* Card Footer with Brand, Category, Stock and Quick Action Buttons */}
        <View style={styles.cardFooter}>
          <View style={styles.tagsContainer}>
            <View style={[styles.tag, { backgroundColor: colors.tagBackground }]}>
              <Text style={[styles.tagText, { color: colors.text }]}>{product.brand}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: colors.tagBackground }]}>
              <Text style={[styles.categoryTagText, { color: colors.textSecondary }]}>
                {product.category}
              </Text>
            </View>
          </View>

          {/* Stock Badge / Trigger */}
          <TouchableOpacity
            onPress={(e) => {
              if (onQuickStock) {
                e.stopPropagation();
                onQuickStock(product);
              }
            }}
            style={[styles.stockBadge, { backgroundColor: stockConfig.bg }]}
          >
            <Text style={[styles.stockBadgeText, { color: stockConfig.text }]}>
              Stock: {stockConfig.label}
            </Text>
          </TouchableOpacity>

          {/* Quick Quote Add Button */}
          {onAddToQuote && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onAddToQuote(product);
              }}
              style={[styles.quoteActionBtn, { backgroundColor: colors.accentLight }]}
            >
              <ShoppingBagIcon size={13} color={colors.accent} style={{ marginRight: 3 }} />
              <Text style={[styles.quoteActionText, { color: colors.accent }]}>+ Quote</Text>
            </TouchableOpacity>
          )}

          {showChevron && (
            <ChevronRightIcon size={18} color={colors.textSecondary} style={styles.chevron} />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  pressable: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  thumbnailPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  leftCol: {
    flex: 1,
    paddingRight: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftMargin: {
    marginLeft: 12,
  },
  metaIcon: {
    marginRight: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  priceWithEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  salePriceTag: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  quickPriceBtn: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceSubLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  tierPriceBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  tierPriceText: {
    fontSize: 11,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  quoteActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  quoteActionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chevron: {
    marginLeft: 2,
  },
});
