import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/store/useAuthStore';
import { useProductStore } from '../src/store/useProductStore';
import { Colors } from '../src/theme/colors';

export default function RootLayout() {
  const loadAuth = useAuthStore((state) => state.loadAuth);
  const loadCache = useProductStore((state) => state.loadCache);
  const syncWithServer = useProductStore((state) => state.syncWithServer);
  
  const authLoading = useAuthStore((state) => state.isLoading);
  const productsLoading = useProductStore((state) => state.isLoading);

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadAuth(), loadCache()]);
      // Background sync on boot — no token needed, products are public
      syncWithServer();
    };
    init();
  }, []);

  if (authLoading || productsLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: Colors.background,
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
        <Stack.Screen
          name="scanner"
          options={{
            title: 'Scan Barcode',
            presentation: 'fullScreenModal',
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
    backgroundColor: Colors.background,
  },
});
