import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useColors } from '../theme/colors';
import { Product, useProductStore } from '../store/useProductStore';
import { useAuthStore } from '../store/useAuthStore';
import { Minus, Plus, X, ShoppingCart, ArrowDownRight, ArrowUpRight, CheckCircle2 } from 'lucide-react-native';

const MinusIcon = Minus as any;
const PlusIcon = Plus as any;
const XIcon = X as any;
const ShoppingCartIcon = ShoppingCart as any;
const ArrowDownRightIcon = ArrowDownRight as any;
const ArrowUpRightIcon = ArrowUpRight as any;
const CheckCircle2Icon = CheckCircle2 as any;

interface StockUpdateModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
}

export const StockUpdateModal: React.FC<StockUpdateModalProps> = ({ visible, product, onClose }) => {
  const colors = useColors();
  const token = useAuthStore((state) => state.token);
  const adjustStock = useProductStore((state) => state.adjustStock);

  const [activeTab, setActiveTab] = useState<'release' | 'add' | 'set'>('release');
  const [quantityInput, setQuantityInput] = useState('1');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (visible && product) {
      setQuantityInput('1');
      setActiveTab('release');
    }
  }, [visible, product]);

  if (!product) return null;

  const currentStock = product.stock ?? 0;

  const handleStockAction = async (delta?: number, absolute?: number) => {
    setIsUpdating(true);
    try {
      const res = await adjustStock(
        product._id,
        { delta, absolute },
        token
      );

      if (res.success) {
        onClose();
      } else {
        Alert.alert('Error', res.message || 'Failed to update stock');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickRelease = (qty: number) => {
    if (currentStock < qty) {
      Alert.alert('Low Stock', `Only ${currentStock} pieces available in stock.`);
      return;
    }
    handleStockAction(-qty, undefined);
  };

  const handleQuickAdd = (qty: number) => {
    handleStockAction(qty, undefined);
  };

  const handleCustomSubmit = () => {
    const qty = parseInt(quantityInput, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity greater than 0.');
      return;
    }

    if (activeTab === 'release') {
      if (currentStock < qty) {
        Alert.alert('Insufficient Stock', `Cannot release ${qty} pieces. Only ${currentStock} available.`);
        return;
      }
      handleStockAction(-qty, undefined);
    } else if (activeTab === 'add') {
      handleStockAction(qty, undefined);
    } else {
      handleStockAction(undefined, qty);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerInfo}>
              <View style={[styles.headerIconBadge, { backgroundColor: colors.accentLight }]}>
                <ShoppingCartIcon size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.text }]}>Manage Stock</Text>
                <Text numberOfLines={1} style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {product.productName}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <XIcon size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Current Stock Banner */}
          <View style={[styles.stockBanner, { backgroundColor: colors.inputBackground }]}>
            <Text style={[styles.stockBannerLabel, { color: colors.textSecondary }]}>
              Total Available Quantity:
            </Text>
            <View style={styles.stockBannerValueRow}>
              <Text style={[styles.stockBannerValue, { color: colors.text }]}>{currentStock}</Text>
              <Text style={[styles.stockBannerUnit, { color: colors.textSecondary }]}>Pieces</Text>
            </View>
            <Text style={[styles.brandBadge, { color: colors.accent }]}>
              Brand: {product.brand}
            </Text>
          </View>

          {/* Mode Tabs */}
          <View style={[styles.tabsRow, { backgroundColor: colors.inputBackground }]}>
            <TouchableOpacity
              onPress={() => {
                setActiveTab('release');
                setQuantityInput('1');
              }}
              style={[
                styles.tabBtn,
                activeTab === 'release' && [styles.activeTabBtn, { backgroundColor: colors.card }],
              ]}
            >
              <ArrowDownRightIcon
                size={14}
                color={activeTab === 'release' ? colors.error : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'release' ? colors.text : colors.textSecondary },
                ]}
              >
                Release (Sale)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setActiveTab('add');
                setQuantityInput('5');
              }}
              style={[
                styles.tabBtn,
                activeTab === 'add' && [styles.activeTabBtn, { backgroundColor: colors.card }],
              ]}
            >
              <ArrowUpRightIcon
                size={14}
                color={activeTab === 'add' ? colors.success : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'add' ? colors.text : colors.textSecondary },
                ]}
              >
                Add Stock
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setActiveTab('set');
                setQuantityInput(currentStock.toString());
              }}
              style={[
                styles.tabBtn,
                activeTab === 'set' && [styles.activeTabBtn, { backgroundColor: colors.card }],
              ]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'set' ? colors.text : colors.textSecondary },
                ]}
              >
                Set Total
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Action Chips for Instant Taps */}
          {activeTab === 'release' && (
            <View style={styles.chipsSection}>
              <Text style={[styles.chipsLabel, { color: colors.textSecondary }]}>
                Quick Release (1-Tap):
              </Text>
              <View style={styles.chipsRow}>
                {[1, 2, 3, 5, 10].map((qty) => (
                  <TouchableOpacity
                    key={qty}
                    onPress={() => handleQuickRelease(qty)}
                    disabled={isUpdating}
                    style={[
                      styles.chipBtn,
                      {
                        backgroundColor: 'rgba(255, 69, 58, 0.12)',
                        borderColor: colors.error,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: colors.error }]}>-{qty} pcs</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'add' && (
            <View style={styles.chipsSection}>
              <Text style={[styles.chipsLabel, { color: colors.textSecondary }]}>
                Quick Add (1-Tap):
              </Text>
              <View style={styles.chipsRow}>
                {[1, 5, 10, 20, 50].map((qty) => (
                  <TouchableOpacity
                    key={qty}
                    onPress={() => handleQuickAdd(qty)}
                    disabled={isUpdating}
                    style={[
                      styles.chipBtn,
                      {
                        backgroundColor: 'rgba(48, 209, 88, 0.12)',
                        borderColor: colors.success,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: colors.success }]}>+{qty} pcs</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Direct Input & Stepper */}
          <View style={styles.stepperContainer}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              {activeTab === 'release'
                ? 'Quantity to Decrease / Release:'
                : activeTab === 'add'
                ? 'Quantity to Add / Restock:'
                : 'Direct Total Stock Count:'}
            </Text>

            <View style={styles.stepperRow}>
              <TouchableOpacity
                onPress={() => {
                  const val = parseInt(quantityInput, 10) || 0;
                  if (val > 1) setQuantityInput((val - 1).toString());
                }}
                style={[styles.stepperBtn, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              >
                <MinusIcon size={18} color={colors.text} />
              </TouchableOpacity>

              <TextInput
                style={[
                  styles.quantityInput,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                keyboardType="number-pad"
                value={quantityInput}
                onChangeText={setQuantityInput}
                selectTextOnFocus
              />

              <TouchableOpacity
                onPress={() => {
                  const val = parseInt(quantityInput, 10) || 0;
                  setQuantityInput((val + 1).toString());
                }}
                style={[styles.stepperBtn, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              >
                <PlusIcon size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirmation Button */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.cancelBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCustomSubmit}
              disabled={isUpdating}
              style={[
                styles.confirmBtn,
                {
                  backgroundColor:
                    activeTab === 'release'
                      ? colors.error
                      : activeTab === 'add'
                      ? colors.success
                      : colors.accent,
                },
              ]}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle2Icon size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.confirmBtnText}>
                    {activeTab === 'release'
                      ? `Release ${quantityInput || 1} Pcs`
                      : activeTab === 'add'
                      ? `Add ${quantityInput || 1} Pcs`
                      : `Set to ${quantityInput || 0} Pcs`}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  headerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  stockBanner: {
    padding: 14,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  stockBannerLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  stockBannerValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4,
  },
  stockBannerValue: {
    fontSize: 32,
    fontWeight: '800',
    marginRight: 6,
  },
  stockBannerUnit: {
    fontSize: 14,
    fontWeight: '600',
  },
  brandBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 10,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  activeTabBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipsSection: {
    paddingHorizontal: 16,
    marginTop: 14,
  },
  chipsLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepperContainer: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityInput: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
