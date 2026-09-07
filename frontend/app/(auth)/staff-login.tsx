import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { useColors } from '../../src/theme/colors';
import { useAuthStore } from '../../src/store/useAuthStore';
import { getApiUrl, getApiHeaders } from '../../src/services/api';

import { Mail, Lock, Eye, EyeOff, Users, CheckCircle2 } from 'lucide-react-native';

interface LoginFormData {
  email: string;
  password: string;
}

export default function StaffLoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const { login, isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'owner') {
        router.replace('/(admin)/dashboard');
      } else {
        router.replace('/');
      }
    }
  }, [isAuthenticated]);

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify(data),
      });


      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }

      if (result.user.role === 'owner') {
        Alert.alert(
          'Owner Account',
          'You are logging in as an Owner. Please use the Owner Login screen for full admin access.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Continue Anyway',
              onPress: async () => {
                await login(result.token, result.user);
                router.replace('/(admin)/dashboard');
              },
            },
          ]
        );
        return;
      }

      await login(result.token, result.user);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Login Failed', e.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={[styles.logoBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Users size={38} color={colors.price} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Sales Staff Login</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Log in to view customer sale prices, create quotations, and manage counter stock.
          </Text>
        </View>

        {/* Feature Capabilities Pill */}
        <View style={[styles.infoPill, { backgroundColor: colors.accentLight }]}>
          <CheckCircle2 size={16} color={colors.accent} style={{ marginRight: 6 }} />
          <Text style={[styles.infoPillText, { color: colors.accent }]}>
            Active Sales Access: Quotation Maker & Stock Release
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.inputBackground, borderColor: colors.border },
                errors.email && { borderColor: colors.error },
              ]}
            >
              <Mail size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <Controller
                control={control}
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                    message: 'Enter a valid email address',
                  },
                }}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="sales@smartprice.com"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                )}
              />
            </View>
            {errors.email && <Text style={[styles.errorText, { color: colors.error }]}>{errors.email.message}</Text>}
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.inputBackground, borderColor: colors.border },
                errors.password && { borderColor: colors.error },
              ]}
            >
              <Lock size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <Controller
                control={control}
                rules={{
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                }}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="Enter staff password"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                )}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword ? (
                  <EyeOff size={18} color={colors.textSecondary} />
                ) : (
                  <Eye size={18} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={[styles.errorText, { color: colors.error }]}>{errors.password.message}</Text>}
          </View>

          {/* Submit */}
          <TouchableOpacity
            disabled={loading}
            onPress={handleSubmit(onSubmit)}
            style={[styles.submitBtn, { backgroundColor: colors.price }]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>Sign In as Sales Person</Text>
            )}
          </TouchableOpacity>

          {/* Owner login link */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            style={styles.ownerLinkBtn}
          >
            <Text style={[styles.ownerLinkText, { color: colors.textSecondary }]}>
              Store Owner?{' '}
              <Text style={{ color: colors.accent, fontWeight: '700' }}>Admin Login</Text>
            </Text>
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
            <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel & Return to Search</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  infoPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  formSection: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  eyeBtn: {
    padding: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  ownerLinkBtn: {
    marginTop: 18,
    alignItems: 'center',
  },
  ownerLinkText: {
    fontSize: 13,
  },
  cancelBtn: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelBtnText: {
    fontSize: 13,
  },
});
