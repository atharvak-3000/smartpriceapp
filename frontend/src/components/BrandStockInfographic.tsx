import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useColors } from '../theme/colors';
import { useProductStore, BrandStat } from '../store/useProductStore';
import { Layers, Package, Check, Sparkles } from 'lucide-react-native';

const LayersIcon = Layers as any;
const PackageIcon = Package as any;
const CheckIcon = Check as any;
const SparklesIcon = Sparkles as any;

const BRAND_PALETTE = [
  '#0A84FF', // Electric Blue
  '#30D158', // Green
  '#FF9F0A', // Amber
  '#BF5AF2', // Purple
  '#FF375F', // Rose
  '#64D2FF', // Cyan
  '#FFD60A', // Yellow
];

export const BrandStockInfographic: React.FC = () => {
  const colors = useColors();
  const getBrandStats = useProductStore((state) => state.getBrandStats);
  const selectedBrand = useProductStore((state) => state.selectedBrand);
  const setSelectedBrand = useProductStore((state) => state.setSelectedBrand);
  const getTotalStockCount = useProductStore((state) => state.getTotalStockCount);

  const brandStats = getBrandStats();
  const totalUnits = getTotalStockCount();

  if (brandStats.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <View style={[styles.iconWrap, { backgroundColor: colors.accentLight }]}>
            <SparklesIcon size={14} color={colors.accent} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Brand Stock Distribution
          </Text>
        </View>
        <Text style={[styles.totalStockBadge, { color: colors.textSecondary }]}>
          {totalUnits} Total Pcs
        </Text>
      </View>

      {/* Horizontal Brand Infographic Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {/* "All Brands" Card */}
        <TouchableOpacity
          onPress={() => setSelectedBrand('All')}
          style={[
            styles.brandCard,
            {
              backgroundColor: selectedBrand === 'All' ? colors.cardSelected : colors.card,
              borderColor: selectedBrand === 'All' ? colors.accent : colors.border,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.brandName, { color: colors.text }]}>All Brands</Text>
            {selectedBrand === 'All' && <CheckIcon size={14} color={colors.accent} />}
          </View>
          <Text style={[styles.stockAmount, { color: colors.accent }]}>
            {totalUnits} <Text style={styles.piecesUnit}>Pcs</Text>
          </Text>
          <Text style={[styles.itemCountText, { color: colors.textSecondary }]}>
            {brandStats.length} Brands tracked
          </Text>
        </TouchableOpacity>

        {/* Individual Brand Cards */}
        {brandStats.map((stat, idx) => {
          const isSelected = selectedBrand.toLowerCase() === stat.brand.toLowerCase();
          const accentColor = BRAND_PALETTE[idx % BRAND_PALETTE.length];

          return (
            <TouchableOpacity
              key={stat.brand}
              onPress={() => setSelectedBrand(isSelected ? 'All' : stat.brand)}
              style={[
                styles.brandCard,
                {
                  backgroundColor: isSelected ? colors.cardSelected : colors.card,
                  borderColor: isSelected ? accentColor : colors.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text numberOfLines={1} style={[styles.brandName, { color: colors.text }]}>
                  {stat.brand}
                </Text>
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: accentColor },
                  ]}
                />
              </View>

              <Text style={[styles.stockAmount, { color: colors.text }]}>
                {stat.totalStock}{' '}
                <Text style={[styles.piecesUnit, { color: colors.textSecondary }]}>Pcs</Text>
              </Text>

              {/* Progress Bar showing proportion */}
              <View style={[styles.progressTrack, { backgroundColor: colors.inputBackground }]}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      backgroundColor: accentColor,
                      width: `${Math.max(5, Math.min(100, stat.percentage))}%`,
                    },
                  ]}
                />
              </View>

              <View style={styles.cardFooter}>
                <Text style={[styles.itemCountText, { color: colors.textSecondary }]}>
                  {stat.itemCount} items
                </Text>
                <Text style={[styles.percentageText, { color: accentColor }]}>
                  {stat.percentage}%
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  totalStockBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  brandCard: {
    width: 140,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  brandName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 4,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stockAmount: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  piecesUnit: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCountText: {
    fontSize: 10,
    fontWeight: '500',
  },
  percentageText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
