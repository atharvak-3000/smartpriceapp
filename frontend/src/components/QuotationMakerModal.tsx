import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Share,
  Platform,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { useColors } from '../theme/colors';
import { Product, useProductStore } from '../store/useProductStore';
import { useBrandingStore } from '../store/useBrandingStore';
import { useAuthStore } from '../store/useAuthStore';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Share2,
  FileText,
  Search,
  CheckCircle,
  Percent,
  IndianRupee,
  Package,
} from 'lucide-react-native';

const XIcon = X as any;
const PlusIcon = Plus as any;
const MinusIcon = Minus as any;
const Trash2Icon = Trash2 as any;
const Share2Icon = Share2 as any;
const FileTextIcon = FileText as any;
const SearchIcon = Search as any;
const CheckCircleIcon = CheckCircle as any;
const PercentIcon = Percent as any;
const IndianRupeeIcon = IndianRupee as any;
const PackageIcon = Package as any;

export interface QuotationItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

interface QuotationMakerModalProps {
  visible: boolean;
  onClose: () => void;
  preselectedProduct?: Product | null;
}

export const QuotationMakerModal: React.FC<QuotationMakerModalProps> = ({
  visible,
  onClose,
  preselectedProduct,
}) => {
  const colors = useColors();
  const token = useAuthStore((state) => state.token);
  const products = useProductStore((state) => state.products);
  const deductQuotationItems = useProductStore((state) => state.deductQuotationItems);
  const branding = useBrandingStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState('10'); // Default 10% matching user example
  const [taxRate, setTaxRate] = useState<number>(18); // Default 18% (9% SGST + 9% CGST)
  const [productSearch, setProductSearch] = useState('');
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  // Initialize with preselected product if passed
  React.useEffect(() => {
    if (visible) {
      if (preselectedProduct) {
        setItems([
          {
            product: preselectedProduct,
            quantity: 1,
            unitPrice: preselectedProduct.salePrice ?? preselectedProduct.price,
          },
        ]);
      }
    } else {
      // Reset on close
      setItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setShowPreview(false);
    }
  }, [visible, preselectedProduct]);

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const discountVal = parseFloat(discountPercent) || 0;
  const discountAmount = Math.round((subtotal * discountVal) / 100);
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);

  const halfTaxRate = taxRate / 2; // e.g. 9% SGST + 9% CGST
  const sgstAmount = Math.round((subtotalAfterDiscount * halfTaxRate) / 100);
  const cgstAmount = Math.round((subtotalAfterDiscount * halfTaxRate) / 100);
  const grandTotal = subtotalAfterDiscount + sgstAmount + cgstAmount;

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const handleAddItem = (prod: Product) => {
    const existingIndex = items.findIndex((i) => i.product._id === prod._id);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          product: prod,
          quantity: 1,
          unitPrice: prod.salePrice ?? prod.price,
        },
      ]);
    }
    setShowItemPicker(false);
    setProductSearch('');
  };

  const handleUpdateQty = (index: number, delta: number) => {
    const updated = [...items];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      handleRemoveItem(index);
    } else {
      updated[index].quantity = newQty;
      setItems(updated);
    }
  };

  const handleSetDirectQty = (index: number, text: string) => {
    const qty = parseInt(text, 10);
    const updated = [...items];
    updated[index].quantity = isNaN(qty) ? 0 : qty;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  const generateQuotationText = () => {
    const lines = [
      `*${branding.storeName} - Quotation*`,
      branding.phone ? `Phone: ${branding.phone}` : '',
      customerName ? `Customer: ${customerName}` : '',
      `Date: ${new Date().toLocaleDateString('en-IN')}`,
      '-----------------------------------------',
      ...items.map(
        (i) => `${i.product.productName} X ${i.quantity} = ${formatINR(i.unitPrice * i.quantity)}`
      ),
      '-----------------------------------------',
      `Subtotal : ${formatINR(subtotal)}`,
      discountVal > 0 ? `Discount : ${discountVal}%` : '',
      discountVal > 0 ? `Subtotal with total discount: ${formatINR(subtotalAfterDiscount)}` : '',
      taxRate > 0 ? `(SGST ${halfTaxRate}%) : ${formatINR(sgstAmount)}` : '',
      taxRate > 0 ? `(CGST ${halfTaxRate}%) : ${formatINR(cgstAmount)}` : '',
      '-----------------------------------------',
      `*Total: ${formatINR(grandTotal)}*`,
      '',
      `Thank you for your business!`,
    ].filter(Boolean);

    return lines.join('\n');
  };

  const handleShare = async () => {
    try {
      const text = generateQuotationText();
      await Share.share({
        message: text,
        title: `${branding.storeName} Quotation`,
      });
    } catch (e: any) {
      Alert.alert('Share Error', e.message);
    }
  };

  const handleCompleteSaleAndDeductStock = async () => {
    if (items.length === 0) return;

    Alert.alert(
      'Confirm Sale & Release Stock',
      `This will mark this quotation as completed and deduct stock quantities for all ${items.length} items from inventory. Proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Deduct',
          style: 'default',
          onPress: async () => {
            setIsProcessingSale(true);
            try {
              await deductQuotationItems(
                items.map((i) => ({ productId: i.product._id, quantity: i.quantity })),
                token
              );
              Alert.alert('Success', 'Stock successfully deducted and quotation completed!');
              onClose();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to deduct stock');
            } finally {
              setIsProcessingSale(false);
            }
          },
        },
      ]
    );
  };

  const filteredPickerProducts = products.filter((p) => {
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    return (
      p.productName.toLowerCase().includes(q) ||
      p.productCode.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q)
    );
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Top Header */}
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.headerTitleWrap}>
            {branding.logoUri ? (
              <Image source={{ uri: branding.logoUri }} style={styles.headerLogo} resizeMode="contain" />
            ) : (
              <View style={[styles.headerIconWrap, { backgroundColor: colors.accentLight }]}>
                <FileTextIcon size={20} color={colors.accent} />
              </View>
            )}
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Quotation Maker</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {branding.storeName}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <XIcon size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Customer Details Box */}
          <View style={[styles.cardSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer Information</Text>
            <View style={styles.customerRow}>
              <TextInput
                style={[
                  styles.input,
                  {
                    flex: 1,
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Customer / Client Name"
                placeholderTextColor={colors.textSecondary}
                value={customerName}
                onChangeText={setCustomerName}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    flex: 1,
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Phone (Optional)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                value={customerPhone}
                onChangeText={setCustomerPhone}
              />
            </View>
          </View>

          {/* Quotation Line Items List */}
          <View style={[styles.cardSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Quoted Items ({items.length})
              </Text>
              <TouchableOpacity
                onPress={() => setShowItemPicker(true)}
                style={[styles.addItemBtn, { backgroundColor: colors.accent }]}
              >
                <PlusIcon size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.addItemBtnText}>Add Item</Text>
              </TouchableOpacity>
            </View>

            {items.length === 0 ? (
              <View style={styles.emptyItemsBox}>
                <PackageIcon size={32} color={colors.textSecondary} />
                <Text style={[styles.emptyItemsText, { color: colors.textSecondary }]}>
                  No items added yet. Tap "Add Item" to add products from catalog.
                </Text>
              </View>
            ) : (
              items.map((item, index) => (
                <View
                  key={`${item.product._id}-${index}`}
                  style={[styles.itemRow, { borderBottomColor: colors.border }]}
                >
                  <View style={styles.itemInfo}>
                    <Text numberOfLines={1} style={[styles.itemName, { color: colors.text }]}>
                      {item.product.productName}
                    </Text>
                    <Text style={[styles.itemBrand, { color: colors.textSecondary }]}>
                      {item.product.brand} • Sale Rate: {formatINR(item.unitPrice)}
                    </Text>
                  </View>

                  {/* Quantity Stepper */}
                  <View style={styles.qtyStepper}>
                    <TouchableOpacity
                      onPress={() => handleUpdateQty(index, -1)}
                      style={[styles.qtyBtn, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                    >
                      <MinusIcon size={14} color={colors.text} />
                    </TouchableOpacity>

                    <TextInput
                      style={[
                        styles.qtyInput,
                        {
                          backgroundColor: colors.inputBackground,
                          borderColor: colors.border,
                          color: colors.text,
                        },
                      ]}
                      keyboardType="number-pad"
                      value={item.quantity.toString()}
                      onChangeText={(t) => handleSetDirectQty(index, t)}
                    />

                    <TouchableOpacity
                      onPress={() => handleUpdateQty(index, 1)}
                      style={[styles.qtyBtn, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                    >
                      <PlusIcon size={14} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  {/* Item Line Total */}
                  <View style={styles.lineTotalWrap}>
                    <Text style={[styles.lineTotal, { color: colors.price }]}>
                      {formatINR(item.unitPrice * item.quantity)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveItem(index)}
                      style={styles.deleteItemBtn}
                    >
                      <Trash2Icon size={14} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Discount & Tax Options */}
          {items.length > 0 && (
            <View style={[styles.cardSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Discount & Tax Rates</Text>

              {/* Discount Input */}
              <View style={styles.configRow}>
                <View style={styles.configLabelWrap}>
                  <PercentIcon size={16} color={colors.accent} />
                  <Text style={[styles.configLabel, { color: colors.text }]}>Discount Percentage</Text>
                </View>
                <View style={styles.discountInputWrap}>
                  <TextInput
                    style={[
                      styles.smallInput,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    keyboardType="numeric"
                    value={discountPercent}
                    onChangeText={setDiscountPercent}
                    placeholder="0"
                  />
                  <Text style={[styles.percentSymbol, { color: colors.textSecondary }]}>%</Text>
                </View>
              </View>

              {/* Tax Rate Selection */}
              <View style={styles.configRow}>
                <View style={styles.configLabelWrap}>
                  <IndianRupeeIcon size={16} color={colors.accent} />
                  <Text style={[styles.configLabel, { color: colors.text }]}>
                    GST Rate ({taxRate}% Total: {halfTaxRate}% SGST + {halfTaxRate}% CGST)
                  </Text>
                </View>
                <View style={styles.taxPillsRow}>
                  {[0, 5, 12, 18, 28].map((rate) => (
                    <TouchableOpacity
                      key={rate}
                      onPress={() => setTaxRate(rate)}
                      style={[
                        styles.taxPill,
                        {
                          backgroundColor: taxRate === rate ? colors.accent : colors.inputBackground,
                          borderColor: taxRate === rate ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.taxPillText,
                          { color: taxRate === rate ? '#FFFFFF' : colors.textSecondary },
                        ]}
                      >
                        {rate}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Live Quotation Summary Box (Matches User Example) */}
          {items.length > 0 && (
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.summaryHeader, { color: colors.text }]}>Quotation Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal:</Text>
                <Text style={[styles.summaryVal, { color: colors.text }]}>{formatINR(subtotal)}</Text>
              </View>

              {discountVal > 0 && (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.warning }]}>
                      Discount ({discountPercent}%):
                    </Text>
                    <Text style={[styles.summaryVal, { color: colors.warning }]}>
                      - {formatINR(discountAmount)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                      Subtotal with total discount:
                    </Text>
                    <Text style={[styles.summaryVal, { color: colors.text }]}>
                      {formatINR(subtotalAfterDiscount)}
                    </Text>
                  </View>
                </>
              )}

              {taxRate > 0 && (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                      (SGST {halfTaxRate}%):
                    </Text>
                    <Text style={[styles.summaryVal, { color: colors.text }]}>
                      {formatINR(sgstAmount)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                      (CGST {halfTaxRate}%):
                    </Text>
                    <Text style={[styles.summaryVal, { color: colors.text }]}>
                      {formatINR(cgstAmount)}
                    </Text>
                  </View>
                </>
              )}

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.summaryRow}>
                <Text style={[styles.grandTotalLabel, { color: colors.text }]}>Total:</Text>
                <Text style={[styles.grandTotalVal, { color: colors.price }]}>
                  {formatINR(grandTotal)}
                </Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          {items.length > 0 && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                onPress={handleShare}
                style={[styles.shareBtn, { backgroundColor: colors.card, borderColor: colors.accent }]}
              >
                <Share2Icon size={18} color={colors.accent} style={{ marginRight: 8 }} />
                <Text style={[styles.shareBtnText, { color: colors.accent }]}>
                  Share on WhatsApp / Text
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCompleteSaleAndDeductStock}
                disabled={isProcessingSale}
                style={[styles.completeSaleBtn, { backgroundColor: colors.price }]}
              >
                <CheckCircleIcon size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.completeSaleBtnText}>
                  Complete Sale & Release Stock
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Modal: Item Picker from Catalog */}
        <Modal visible={showItemPicker} animationType="slide" onRequestClose={() => setShowItemPicker(false)}>
          <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.pickerHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>Add Product to Quote</Text>
              <TouchableOpacity onPress={() => setShowItemPicker(false)} style={styles.closeBtn}>
                <XIcon size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={[styles.pickerSearchBox, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <SearchIcon size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.pickerSearchInput, { color: colors.text }]}
                placeholder="Search by name, code or brand..."
                placeholderTextColor={colors.textSecondary}
                value={productSearch}
                onChangeText={setProductSearch}
                autoFocus
              />
            </View>

            <ScrollView contentContainerStyle={styles.pickerList}>
              {filteredPickerProducts.map((p) => (
                <TouchableOpacity
                  key={p._id}
                  onPress={() => handleAddItem(p)}
                  style={[styles.pickerItemRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickerItemName, { color: colors.text }]}>{p.productName}</Text>
                    <Text style={[styles.pickerItemMeta, { color: colors.textSecondary }]}>
                      {p.brand} • Code: {p.productCode} • Available: {p.stock} pcs
                    </Text>
                  </View>
                  <View style={styles.pickerPriceCol}>
                    <Text style={[styles.pickerItemPrice, { color: colors.price }]}>
                      {formatINR(p.salePrice ?? p.price)}
                    </Text>
                    <View style={[styles.addChip, { backgroundColor: colors.accentLight }]}>
                      <Text style={[styles.addChipText, { color: colors.accent }]}>+ Add</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  cardSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  customerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addItemBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyItemsBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyItemsText: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 240,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
  },
  itemBrand: {
    fontSize: 11,
    marginTop: 2,
  },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyInput: {
    width: 38,
    height: 28,
    borderWidth: 1,
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    padding: 0,
  },
  lineTotalWrap: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  lineTotal: {
    fontSize: 13,
    fontWeight: '700',
  },
  deleteItemBtn: {
    padding: 4,
    marginTop: 2,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  configLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  configLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  discountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  smallInput: {
    width: 60,
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
  },
  percentSymbol: {
    fontSize: 14,
    fontWeight: '700',
  },
  taxPillsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  taxPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  taxPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 8,
  },
  summaryHeader: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  grandTotalVal: {
    fontSize: 20,
    fontWeight: '900',
  },
  actionsContainer: {
    gap: 10,
    marginTop: 6,
    marginBottom: 20,
  },
  shareBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  completeSaleBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeSaleBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  pickerContainer: {
    flex: 1,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  pickerSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 14,
  },
  pickerList: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 20,
  },
  pickerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  pickerItemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  pickerItemMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  pickerPriceCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  pickerItemPrice: {
    fontSize: 15,
    fontWeight: '700',
  },
  addChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  addChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
