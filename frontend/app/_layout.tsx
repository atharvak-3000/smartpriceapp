import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/store/useAuthStore';
import { useProductStore } from '../src/store/useProductStore';
import { useThemeStore } from '../src/store/useThemeStore';
import { useBrandingStore } from '../src/store/useBrandingStore';
import { useColors } from '../src/theme/colors';

export default function RootLayout() {
  const loadAuth = useAuthStore((state) => state.loadAuth);
  const loadCache = useProductStore((state) => state.loadCache);
  const syncWithServer = useProductStore((state) => state.syncWithServer);
  const loadTheme = useThemeStore((state) => state.loadTheme);
  const loadBranding = useBrandingStore((state) => state.loadBranding);
  const theme = useThemeStore((state) => state.theme);
  const colors = useColors();

  const authLoading = useAuthStore((state) => state.isLoading);
  const productsLoading = useProductStore((state) => state.isLoading);

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadAuth(), loadCache(), loadTheme(), loadBranding()]);
      syncWithServer();
    };
    init();
  }, []);

  if (authLoading || productsLoading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Price Lookup',
          }}
        />
        <Stack.Screen
          name="(auth)/login"
          options={{
            title: 'Owner Login',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="(auth)/staff-login"
          options={{
            title: 'Staff Login',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="(admin)/dashboard"
          options={{
            title: 'Admin Panel',
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
