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
import { X, Check, Tag, ShieldAlert } from 'lucide-react-native';

const XIcon = X as any;
const CheckIcon = Check as any;
const TagIcon = Tag as any;
const ShieldAlertIcon = ShieldAlert as any;

interface QuickPriceModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
}

export const QuickPriceModal: React.FC<QuickPriceModalProps> = ({ visible, product, onClose }) => {
  const colors = useColors();
  const token = useAuthStore((state) => state.token);
  const isOwner = useAuthStore((state) => state.isOwner);
  const quickUpdatePrices = useProductStore((state) => state.quickUpdatePrices);

  const [salePrice, setSalePrice] = useState('');
  const [mrpPrice, setMrpPrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && product) {
      const currentSale = (product.salePrice ?? product.price ?? 0).toString();
      const currentMrp = (product.mrpPrice ?? product.salePrice ?? product.price ?? 0).toString();
      const currentWholesale = product.wholesalePrice !== undefined ? product.wholesalePrice.toString() : '';

      setSalePrice(currentSale);
      setMrpPrice(currentMrp);
      setWholesalePrice(currentWholesale);
    }
  }, [visible, product]);

  if (!product) return null;

  const handleSave = async () => {
    const saleNum = parseFloat(salePrice);
    const mrpNum = mrpPrice ? parseFloat(mrpPrice) : saleNum;
    const wholesaleNum = wholesalePrice ? parseFloat(wholesalePrice) : undefined;

    if (isNaN(saleNum) || saleNum < 0) {
      Alert.alert('Invalid Price', 'Please enter a valid Sale Price.');
      return;
    }

    if (mrpNum < saleNum) {
      Alert.alert('Price Warning', 'MRP should normally be greater than or equal to the Sale Price.');
    }

    setIsSaving(true);
    try {
      const res = await quickUpdatePrices(
        product._id,
        {
          salePrice: saleNum,
          mrpPrice: mrpNum,
          wholesalePrice: wholesaleNum,
        },
        token
      );

      if (res.success) {
        onClose();
      } else {
        Alert.alert('Error', res.message || 'Failed to update price');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong');
    } finally {
      setIsSaving(false);
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
            <View style={styles.headerTitleRow}>
              <View style={[styles.tagIconBadge, { backgroundColor: colors.accentLight }]}>
                <TagIcon size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.text }]}>Quick Price Update</Text>
                <Text numberOfLines={1} style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {product.productName}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <XIcon size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.body}>
            {/* Sale Price (Mandatory, visible to all) */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Sale Price (₹)</Text>
                <Text style={[styles.badge, { backgroundColor: 'rgba(48,209,88,0.15)', color: colors.price }]}>
                  Customer Price
                </Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                keyboardType="decimal-pad"
                value={salePrice}
                onChangeText={setSalePrice}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* MRP Price */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>MRP Price (₹)</Text>
                <Text style={[styles.badge, { backgroundColor: 'rgba(142,142,147,0.15)', color: colors.textSecondary }]}>
                  Max Retail
                </Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                keyboardType="decimal-pad"
                value={mrpPrice}
                onChangeText={setMrpPrice}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Wholesale Price (Admin Only) */}
            {isOwner() ? (
              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>Wholesale Price (₹)</Text>
                  <Text style={[styles.badge, { backgroundColor: 'rgba(255,159,10,0.15)', color: colors.wholesale }]}>
                    Dealer / Admin
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  keyboardType="decimal-pad"
                  value={wholesalePrice}
                  onChangeText={setWholesalePrice}
                  placeholder="Optional wholesale rate"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            ) : (
              <View style={[styles.restrictedBox, { backgroundColor: colors.accentLight }]}>
                <ShieldAlertIcon size={16} color={colors.accent} />
                <Text style={[styles.restrictedText, { color: colors.textSecondary }]}>
                  Wholesale price is restricted to Store Owner & Admin.
                </Text>
              </View>
            )}
          </View>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.btn, styles.cancelBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={[styles.btn, styles.saveBtn, { backgroundColor: colors.accent }]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckIcon size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Save Prices</Text>
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  tagIconBadge: {
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
  body: {
    padding: 16,
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '600',
  },
  restrictedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  restrictedText: {
    fontSize: 12,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {},
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
