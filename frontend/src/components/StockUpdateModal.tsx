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
} from 'react-native';
import { Colors } from '../theme/colors';
import { Product, useProductStore } from '../store/useProductStore';
import { useAuthStore } from '../store/useAuthStore';
import { getApiUrl } from '../services/api';
import { Minus, Plus, X, TrendingUp } from 'lucide-react-native';

const MinusIcon = Minus as any;
const PlusIcon = Plus as any;
const XIcon = X as any;
const TrendingUpIcon = TrendingUp as any;

interface StockUpdateModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
}

export const StockUpdateModal: React.FC<StockUpdateModalProps> = ({ visible, product, onClose }) => {
  const token = useAuthStore((state) => state.token);
  const updateStockStore = useProductStore((state) => state.updateStock);

  const [absoluteStock, setAbsoluteStock] = useState('');
  const [delta, setDelta] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'quick' | 'absolute'>('quick');

  useEffect(() => {
    if (visible && product) {
      setAbsoluteStock(product.stock.toString());
      setDelta(1);
      setMode('quick');
    }
  }, [visible, product]);

  if (!product) return null;

  const currentStock = product.stock ?? 0;

  const sendStockUpdate = async (payload: { delta?: number; absolute?: number }) => {
    setIsLoading(true);
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/products/${product._id}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update stock');
      }

      updateStockStore(product._id, result.data.stock);
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update stock');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickIncrement = () => sendStockUpdate({ delta: delta });
  const handleQuickDecrement = () => {
    if (currentStock - delta < 0) {
      Alert.alert('Invalid', 'Stock cannot go below 0');
      return;
    }
    sendStockUpdate({ delta: -delta });
  };

  const handleAbsoluteSet = () => {
    const value = parseInt(absoluteStock, 10);
    if (isNaN(value) || value < 0) {
      Alert.alert('Invalid', 'Please enter a valid stock quantity');
      return;
    }
    sendStockUpdate({ absolute: value });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TrendingUpIcon size={18} color={Colors.accent} />
              <Text style={styles.title}>Update Stock</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <XIcon size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.productName} numberOfLines={1}>{product.productName}</Text>
          <Text style={styles.currentStock}>Current Stock: <Text style={styles.currentStockValue}>{currentStock}</Text></Text>

          {/* Mode Toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              onPress={() => setMode('quick')}
              style={[styles.modeBtn, mode === 'quick' && styles.modeBtnActive]}
            >
              <Text style={[styles.modeBtnText, mode === 'quick' && styles.modeBtnTextActive]}>Quick +/-</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('absolute')}
              style={[styles.modeBtn, mode === 'absolute' && styles.modeBtnActive]}
            >
              <Text style={[styles.modeBtnText, mode === 'absolute' && styles.modeBtnTextActive]}>Set Exact</Text>
            </TouchableOpacity>
          </View>

          {mode === 'quick' ? (
            <>
              {/* Delta selector */}
              <View style={styles.deltaRow}>
                <Text style={styles.deltaLabel}>Amount:</Text>
                {[1, 5, 10, 25, 50].map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setDelta(n)}
                    style={[styles.deltaChip, delta === n && styles.deltaChipActive]}
                  >
                    <Text style={[styles.deltaChipText, delta === n && styles.deltaChipTextActive]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.decrementBtn]}
                  onPress={handleQuickDecrement}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <MinusIcon size={18} color="#FFF" />
                      <Text style={styles.actionBtnText}>Remove {delta}</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.incrementBtn]}
                  onPress={handleQuickIncrement}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <>
                      <PlusIcon size={18} color="#000" />
                      <Text style={[styles.actionBtnText, { color: '#000' }]}>Add {delta}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.absoluteRow}>
                <Text style={styles.deltaLabel}>New Quantity:</Text>
                <TextInput
                  style={styles.absoluteInput}
                  value={absoluteStock}
                  onChangeText={setAbsoluteStock}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textSecondary}
                  selectTextOnFocus
                />
              </View>

              <TouchableOpacity
                style={styles.setBtn}
                onPress={handleAbsoluteSet}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.setBtnText}>Set Stock to {absoluteStock || 0}</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  productName: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  currentStock: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  currentStockValue: {
    color: Colors.text,
    fontWeight: '700',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
    marginBottom: 20,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: Colors.accent,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modeBtnTextActive: {
    color: '#FFF',
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  deltaLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  deltaChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  deltaChipActive: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accent,
  },
  deltaChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  deltaChipTextActive: {
    color: Colors.accent,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  decrementBtn: {
    backgroundColor: Colors.error,
  },
  incrementBtn: {
    backgroundColor: Colors.text,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  absoluteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  absoluteInput: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  setBtn: {
    height: 50,
    backgroundColor: Colors.text,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.background,
  },
});
