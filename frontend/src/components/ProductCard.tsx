import React from 'react';
import { StyleSheet, Text, View, Pressable, Animated, Image } from 'react-native';
import { Colors } from '../theme/colors';
import { Product } from '../store/useProductStore';
import { Barcode, ChevronRight, Hash, Package } from 'lucide-react-native';

const BarcodeIcon = Barcode as any;
const ChevronRightIcon = ChevronRight as any;
const HashIcon = Hash as any;
const PackageIcon = Package as any;

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  showChevron?: boolean;
}

const getStockStyle = (stock: number) => {
  if (stock === 0) return { bg: 'rgba(255,69,58,0.12)', text: Colors.error };
  if (stock <= 5) return { bg: 'rgba(255,159,10,0.12)', text: '#FF9F0A' };
  return { bg: 'rgba(48,209,88,0.12)', text: Colors.success };
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, showChevron = false }) => {
  const animatedScale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(animatedScale, {
      toValue: 0.97,
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
      maximumFractionDigits: 0
    }).format(price);
  };

  const stockStyle = getStockStyle(product.stock ?? 0);

  return (
    <Animated.View style={[styles.cardContainer, { transform: [{ scale: animatedScale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }: any) => [
          styles.pressable,
          pressed && styles.pressedState
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
            <View style={styles.thumbnailPlaceholder}>
              <PackageIcon size={20} color={Colors.textSecondary} />
            </View>
          )}

          <View style={styles.leftCol}>
            <Text numberOfLines={2} style={styles.productName}>
              {product.productName}
            </Text>
            
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <HashIcon size={12} color={Colors.textSecondary} style={styles.metaIcon} />
                <Text style={styles.metaText}>{product.productCode}</Text>
              </View>
              
              {product.barcode && (
                <View style={[styles.metaItem, styles.leftMargin]}>
                  <BarcodeIcon size={12} color={Colors.textSecondary} style={styles.metaIcon} />
                  <Text style={styles.metaText}>{product.barcode}</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.rightCol}>
            <Text style={styles.priceText}>{formatPrice(product.price)}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.tagsContainer}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{product.brand}</Text>
            </View>
            <View style={[styles.tag, styles.categoryTag]}>
              <Text style={styles.categoryTagText}>{product.category}</Text>
            </View>
          </View>
          
          {/* Stock Badge */}
          <View style={[styles.stockBadge, { backgroundColor: stockStyle.bg }]}>
            <Text style={[styles.stockBadgeText, { color: stockStyle.text }]}>
              {product.stock === 0 ? 'Out of Stock' : `Stock: ${product.stock}`}
            </Text>
          </View>

          {showChevron && (
            <ChevronRightIcon size={18} color={Colors.textSecondary} style={styles.chevron} />
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
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pressable: {
    padding: 14,
  },
  pressedState: {
    backgroundColor: Colors.cardSelected,
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
    backgroundColor: '#1E1E1E',
  },
  thumbnailPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  leftCol: {
    flex: 1,
    paddingRight: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
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
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 80,
  },
  priceText: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.price,
    letterSpacing: -0.5,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  categoryTag: {
    backgroundColor: Colors.accentLight,
    borderColor: 'rgba(10, 132, 255, 0.2)',
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 6,
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chevron: {
    marginLeft: 6,
  },
});
