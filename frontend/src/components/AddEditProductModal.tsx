import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Switch,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Colors } from '../theme/colors';
import { Product, useProductStore } from '../store/useProductStore';
import { useAuthStore } from '../store/useAuthStore';
import { getApiUrl, getApiHeaders } from '../services/api';




import { X, Trash2, Camera, ImagePlus, Package } from 'lucide-react-native';

const XIcon = X as any;
const Trash2Icon = Trash2 as any;
const CameraIcon = Camera as any;
const ImagePlusIcon = ImagePlus as any;
const PackageIcon = Package as any;

interface AddEditProductModalProps {
  visible: boolean;
  onClose: () => void;
  product?: Product | null;
}

interface FormData {
  productName: string;
  productCode: string;
  category: string;
  brand: string;
  description: string;
  price: string;
  mrpPrice: string;
  wholesalePrice: string;
  stock: string;
}

export const AddEditProductModal: React.FC<AddEditProductModalProps> = ({
  visible,
  onClose,
  product,
}) => {
  const token = useAuthStore((state) => state.token);
  const addProductStore = useProductStore((state) => state.addProduct);
  const updateProductStore = useProductStore((state) => state.updateProduct);
  const deleteProductStore = useProductStore((state) => state.deleteProduct);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      productName: '',
      productCode: '',
      category: '',
      brand: '',
      description: '',
      price: '',
      mrpPrice: '',
      wholesalePrice: '',
      stock: '0',
    },
  });

  // Populate form if editing
  useEffect(() => {
    if (visible) {
      if (product) {
        reset({
          productName: product.productName,
          productCode: product.productCode,
          category: product.category,
          brand: product.brand,
          description: product.description || '',
          price: (product.salePrice ?? product.price ?? '').toString(),
          mrpPrice: (product.mrpPrice ?? product.salePrice ?? product.price ?? '').toString(),
          wholesalePrice: product.wholesalePrice !== undefined ? product.wholesalePrice.toString() : '',
          stock: (product.stock ?? 0).toString(),
        });
        setImageUrl(product.imageUrl || null);
        setIsActive(product.status !== 'inactive');
      } else {
        reset({
          productName: '',
          productCode: '',
          category: '',
          brand: '',
          description: '',
          price: '',
          mrpPrice: '',
          wholesalePrice: '',
          stock: '0',
        });
        setImageUrl(null);
        setIsActive(true);
      }
    }
  }, [product, visible, reset]);


  const handlePickImage = async () => {
    // Dynamic import to avoid requiring ImagePicker at module level
    try {
      const ImagePicker = await import('expo-image-picker');
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload a product image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImageToServer(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to open image picker.');
    }
  };

  const uploadImageToServer = async (localUri: string) => {
    setIsUploadingImage(true);
    try {
      const API_URL = getApiUrl();
      const filename = localUri.split('/').pop() || 'product.jpg';
      const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      const formData = new FormData();
      formData.append('image', { uri: localUri, name: filename, type: mimeType } as any);

      const response = await fetch(`${API_URL}/products/upload/image`, {
        method: 'POST',
        headers: getApiHeaders(token, false),
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Upload failed');

      setImageUrl(result.imageUrl);
    } catch (e: any) {
      Alert.alert('Upload Failed', e.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const API_URL = getApiUrl();
      const salePriceNum = Number(data.price);
      const mrpNum = data.mrpPrice ? Number(data.mrpPrice) : salePriceNum;
      const wholesaleNum = data.wholesalePrice ? Number(data.wholesalePrice) : undefined;

      const body = {
        ...data,
        price: salePriceNum,
        salePrice: salePriceNum,
        mrpPrice: mrpNum,
        wholesalePrice: wholesaleNum,
        stock: Number(data.stock),
        imageUrl: imageUrl || undefined,
        status: isActive ? 'active' : 'inactive',
      };

      const url = product ? `${API_URL}/products/${product._id}` : `${API_URL}/products`;
      const method = product ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getApiHeaders(token),
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Operation failed');
      }

      if (product) {
        updateProductStore(product._id, result.data);
        Alert.alert('Success', 'Product updated successfully');
      } else {
        addProductStore(result.data);
        Alert.alert('Success', 'Product added successfully');
      }
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete "${product.productName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const API_URL = getApiUrl();
              const response = await fetch(`${API_URL}/products/${product._id}`, {
                method: 'DELETE',
                headers: getApiHeaders(token, false),
              });


              if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Failed to delete');
              }

              deleteProductStore(product._id);
              Alert.alert('Deleted', 'Product has been removed');
              onClose();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete product');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const renderField = (
    name: keyof FormData,
    label: string,
    options: {
      placeholder?: string;
      rules?: object;
      keyboardType?: any;
      autoCapitalize?: any;
      multiline?: boolean;
    } = {}
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <Controller
        control={control}
        rules={options.rules}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[
              styles.input,
              options.multiline && styles.multilineInput,
              (errors as any)[name] && styles.inputError,
            ]}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholder={options.placeholder}
            placeholderTextColor={Colors.textSecondary}
            keyboardType={options.keyboardType}
            autoCapitalize={options.autoCapitalize}
            multiline={options.multiline}
            numberOfLines={options.multiline ? 3 : 1}
          />
        )}
      />
      {(errors as any)[name] && (
        <Text style={styles.errorText}>{(errors as any)[name].message}</Text>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetContainer}
        >
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {product ? 'Edit Product' : 'Add Product'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <XIcon size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Image Upload ── */}
            <View style={styles.imageSection}>
              {imageUrl ? (
                <View style={styles.imagePreviewWrap}>
                  <Image source={{ uri: imageUrl }} style={styles.imagePreview} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => setImageUrl(null)}
                  >
                    <XIcon size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <PackageIcon size={32} color={Colors.textSecondary} />
                </View>
              )}
              <TouchableOpacity
                style={styles.imageUploadBtn}
                onPress={handlePickImage}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <ActivityIndicator size="small" color={Colors.accent} />
                ) : (
                  <>
                    <ImagePlusIcon size={16} color={Colors.accent} />
                    <Text style={styles.imageUploadText}>{imageUrl ? 'Change Image' : 'Upload Image'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* ── Core Fields ── */}
            {renderField('productName', 'Product Name', {
              placeholder: 'e.g. Havells Life Line 1.5 SQ mm',
              rules: { required: 'Product name is required' },
            })}

            {renderField('productCode', 'Product Code (Unique)', {
              placeholder: 'e.g. HW-15-RD',
              rules: { required: 'Product code is required' },
              autoCapitalize: 'characters',
            })}

            <View style={styles.rowFields}>
              {/* Sale Price */}
              <View style={[styles.inputGroup, styles.halfField]}>
                <Text style={styles.label}>Sale Price (₹) *</Text>
                <Controller
                  control={control}
                  rules={{
                    required: 'Required',
                    pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Invalid price' },
                  }}
                  name="price"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, errors.price && styles.inputError]}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder="e.g. 1540"
                      placeholderTextColor={Colors.textSecondary}
                      keyboardType="numeric"
                    />
                  )}
                />
                {errors.price && <Text style={styles.errorText}>{errors.price.message}</Text>}
              </View>

              {/* Stock */}
              <View style={[styles.inputGroup, styles.halfField]}>
                <Text style={styles.label}>Stock Qty (Pcs) *</Text>
                <Controller
                  control={control}
                  rules={{
                    required: 'Required',
                    pattern: { value: /^\d+$/, message: 'Whole number' },
                  }}
                  name="stock"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, errors.stock && styles.inputError]}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder="0"
                      placeholderTextColor={Colors.textSecondary}
                      keyboardType="numeric"
                    />
                  )}
                />
                {errors.stock && <Text style={styles.errorText}>{errors.stock.message}</Text>}
              </View>
            </View>

            <View style={styles.rowFields}>
              {/* MRP Price */}
              <View style={[styles.inputGroup, styles.halfField]}>
                <Text style={styles.label}>MRP Price (₹)</Text>
                <Controller
                  control={control}
                  name="mrpPrice"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.input}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder="e.g. 1800"
                      placeholderTextColor={Colors.textSecondary}
                      keyboardType="numeric"
                    />
                  )}
                />
              </View>

              {/* Wholesale Price */}
              <View style={[styles.inputGroup, styles.halfField]}>
                <Text style={styles.label}>Wholesale Price (₹)</Text>
                <Controller
                  control={control}
                  name="wholesalePrice"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.input}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder="e.g. 1300"
                      placeholderTextColor={Colors.textSecondary}
                      keyboardType="numeric"
                    />
                  )}
                />
              </View>
            </View>



            {renderField('category', 'Category', {
              placeholder: 'e.g. Wires & Cables',
              rules: { required: 'Category is required' },
            })}

            {renderField('brand', 'Brand', {
              placeholder: 'e.g. Havells',
              rules: { required: 'Brand is required' },
            })}

            {renderField('description', 'Short Description (Optional)', {
              placeholder: 'Brief product description for staff reference...',
              multiline: true,
            })}

            {/* Status Toggle */}
            <View style={styles.statusRow}>
              <View>
                <Text style={styles.label}>Product Status</Text>
                <Text style={styles.statusSubtext}>
                  {isActive ? 'Active — visible in catalog' : 'Inactive — hidden from staff'}
                </Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: Colors.border, true: Colors.accentLight }}
                thumbColor={isActive ? Colors.accent : Colors.textSecondary}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {product && (
                <TouchableOpacity
                  disabled={isDeleting || isSubmitting}
                  onPress={handleDelete}
                  style={[styles.button, styles.deleteButton]}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Trash2Icon size={16} color="#FFF" />
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                disabled={isSubmitting || isDeleting}
                onPress={handleSubmit(onSubmit)}
                style={[
                  styles.button,
                  styles.saveButton,
                  product ? styles.flexButton : styles.fullWidthButton,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {product ? 'Save Changes' : 'Create Product'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '92%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
  },
  imageSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 14,
  },
  imagePreviewWrap: {
    position: 'relative',
  },
  imagePreview: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#1C1C1E',
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageUploadBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderStyle: 'dashed',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imageUploadText: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  halfField: {
    flex: 1,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  inputError: {
    borderColor: Colors.error,
  },
  barcodeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barcodeInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  scanInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 45,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  scanInlineText: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 16,
  },
  statusSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20,
    gap: 10,
  },
  button: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  flexButton: {
    flex: 1,
  },
  fullWidthButton: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: Colors.text,
  },
  saveButtonText: {
    color: Colors.background,
    fontSize: 15,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: Colors.error,
    width: 100,
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
