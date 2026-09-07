import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useColors } from '../theme/colors';
import { useBrandingStore } from '../store/useBrandingStore';
import { X, Upload, Check, Image as ImageIcon, Store, Phone, MapPin, Hash } from 'lucide-react-native';

const XIcon = X as any;
const UploadIcon = Upload as any;
const CheckIcon = Check as any;
const ImageIconSvg = ImageIcon as any;
const StoreIcon = Store as any;
const PhoneIcon = Phone as any;
const MapPinIcon = MapPin as any;
const HashIcon = Hash as any;

interface LogoUploadModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LogoUploadModal: React.FC<LogoUploadModalProps> = ({ visible, onClose }) => {
  const colors = useColors();
  const branding = useBrandingStore();

  const [storeName, setStoreName] = useState(branding.storeName);
  const [tagline, setTagline] = useState(branding.tagline);
  const [phone, setPhone] = useState(branding.phone);
  const [address, setAddress] = useState(branding.address);
  const [gstin, setGstin] = useState(branding.gstin);
  const [logoUri, setLogoUriState] = useState<string | null>(branding.logoUri);
  const [urlInput, setUrlInput] = useState('');

  React.useEffect(() => {
    if (visible) {
      setStoreName(branding.storeName);
      setTagline(branding.tagline);
      setPhone(branding.phone);
      setAddress(branding.address);
      setGstin(branding.gstin);
      setLogoUriState(branding.logoUri);
    }
  }, [visible, branding]);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permissions are required to upload a logo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setLogoUriState(result.assets[0].uri);
      }
    } catch (e: any) {
      Alert.alert('Image Picker Error', e.message);
    }
  };

  const handleSave = async () => {
    const finalLogo = urlInput.trim() ? urlInput.trim() : logoUri;
    await branding.updateBranding({
      storeName,
      tagline,
      phone,
      address,
      gstin,
      logoUri: finalLogo,
    });
    Alert.alert('Success', 'Store branding & logo updated successfully!');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleWrap}>
              <View style={[styles.iconBadge, { backgroundColor: colors.accentLight }]}>
                <StoreIcon size={18} color={colors.accent} />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>Store Branding & Logo</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <XIcon size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {/* Logo Preview and Picker */}
            <View style={styles.logoSection}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logoPreview} resizeMode="contain" />
              ) : (
                <View style={[styles.logoPlaceholder, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                  <ImageIconSvg size={32} color={colors.textSecondary} />
                  <Text style={[styles.logoPlaceholderText, { color: colors.textSecondary }]}>
                    No Logo Selected
                  </Text>
                </View>
              )}

              <View style={styles.logoButtons}>
                <TouchableOpacity
                  onPress={handlePickImage}
                  style={[styles.pickBtn, { backgroundColor: colors.accent }]}
                >
                  <UploadIcon size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.pickBtnText}>Upload from Gallery</Text>
                </TouchableOpacity>

                {logoUri && (
                  <TouchableOpacity
                    onPress={() => setLogoUriState(null)}
                    style={[styles.removeBtn, { borderColor: colors.error }]}
                  >
                    <Text style={[styles.removeBtnText, { color: colors.error }]}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Logo URL alternative */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Or Image URL (Web Link):
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text },
                ]}
                placeholder="https://example.com/logo.png"
                placeholderTextColor={colors.textSecondary}
                value={urlInput}
                onChangeText={(text) => {
                  setUrlInput(text);
                  if (text.trim()) setLogoUriState(text.trim());
                }}
              />
            </View>

            {/* Store Information for Quotation */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Store / Business Name</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text },
                ]}
                value={storeName}
                onChangeText={setStoreName}
                placeholder="e.g. SmartPrice Electricals"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Tagline / Subtitle</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text },
                ]}
                value={tagline}
                onChangeText={setTagline}
                placeholder="e.g. Wholesale & Retail Suppliers"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Phone Number</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text },
                ]}
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 98765 43210"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Address</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text },
                ]}
                value={address}
                onChangeText={setAddress}
                placeholder="Shop address for quotations"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>GSTIN (Tax Number)</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text },
                ]}
                value={gstin}
                onChangeText={setGstin}
                placeholder="27AAAAA0000A1Z5"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={[styles.cancelBtn, { borderColor: colors.border }]}>
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.accent }]}>
              <CheckIcon size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>Save Branding</Text>
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    padding: 16,
    gap: 12,
  },
  logoSection: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  logoPreview: {
    width: 90,
    height: 90,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CCC',
  },
  logoPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  logoPlaceholderText: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  logoButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  pickBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  removeBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  removeBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  fieldGroup: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
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
  saveBtn: {
    flex: 2,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
