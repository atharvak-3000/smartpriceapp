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
import { getApiUrl } from '../../src/services/api';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LoginFormData {
  email: string;
  password: string;
}

const REMEMBER_EMAIL_KEY = 'smartprice_remember_email';

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const { login, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    const checkRememberedEmail = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem(REMEMBER_EMAIL_KEY);
        if (savedEmail) {
          setValue('email', savedEmail);
        }
      } catch (e) {
        console.error('Failed to load remembered email', e);
      }
    };
    checkRememberedEmail();
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }

      if (rememberMe) {
        await AsyncStorage.setItem(REMEMBER_EMAIL_KEY, data.email);
      } else {
        await AsyncStorage.removeItem(REMEMBER_EMAIL_KEY);
      }

      await login(result.token, result.user);
      router.replace('/(admin)/dashboard');
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
        {/* Brand Logo Header */}
        <View style={styles.headerSection}>
          <View style={[styles.logoBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ShieldCheck size={40} color={colors.accent} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>SmartPrice Admin</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Log in as store owner to modify prices, access wholesale rates, and manage catalog.
          </Text>
        </View>

        {/* Form Fields */}
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
                    placeholder="owner@smartprice.com"
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
                    placeholder="Enter your password"
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

          {/* Remember Me */}
          <TouchableOpacity
            onPress={() => setRememberMe(!rememberMe)}
            style={styles.rememberRow}
          >
            <View
              style={[
                styles.checkbox,
                { borderColor: colors.border },
                rememberMe && { borderColor: colors.accent },
              ]}
            >
              {rememberMe && <View style={[styles.checkboxInner, { backgroundColor: colors.accent }]} />}
            </View>
            <Text style={[styles.rememberText, { color: colors.textSecondary }]}>Remember my email</Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            disabled={loading}
            onPress={handleSubmit(onSubmit)}
            style={[styles.submitBtn, { backgroundColor: colors.accent }]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>Log In as Admin</Text>
            )}
          </TouchableOpacity>

          {/* Staff Login Link */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/staff-login')}
            style={styles.staffLinkBtn}
          >
            <Text style={[styles.staffLinkText, { color: colors.textSecondary }]}>
              Are you a sales person?{' '}
              <Text style={{ color: colors.accent, fontWeight: '700' }}>Log in here</Text>
            </Text>
          </TouchableOpacity>

          {/* Cancel Button */}
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
    marginBottom: 32,
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
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  rememberText: {
    fontSize: 13,
  },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
  staffLinkBtn: {
    marginTop: 18,
    alignItems: 'center',
  },
  staffLinkText: {
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
