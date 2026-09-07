import Constants from 'expo-constants';

export const getApiUrl = (): string => {
  // Check if we have an explicit env variable
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // Try to extract IP address from Expo hostUri (works for physical devices on same WiFi)
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000`;
  }
  
  // Fallback to local loopback (works on Android Emulator)
  return 'http://10.0.2.2:5000'; 
};

export const getAppKey = (): string => {
  return process.env.EXPO_PUBLIC_APP_KEY || 'smartprice_mobile_secure_key_2026_9x8f';
};

export const getApiHeaders = (token?: string | null, isJson: boolean = true): Record<string, string> => {
  const headers: Record<string, string> = {
    'x-api-key': getAppKey(),
  };
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};
