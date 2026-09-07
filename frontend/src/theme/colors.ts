import { useThemeStore } from '../store/useThemeStore';

export interface ThemeColors {
  background: string;
  card: string;
  cardSelected: string;
  border: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentLight: string;
  price: string;
  mrp: string;
  wholesale: string;
  error: string;
  success: string;
  warning: string;
  inputBackground: string;
  tagBackground: string;
  statusBar: 'light' | 'dark';
}

export const DarkTheme: ThemeColors = {
  background: '#0B0F17',          // Deep Midnight
  card: '#151D2A',                // Sleek slate dark card
  cardSelected: '#1E293B',        // Active selected card
  border: '#233044',              // Refined border
  text: '#F8FAFC',                // Crisp typography
  textSecondary: '#94A3B8',       // Muted slate
  accent: '#38BDF8',              // Electric Sky Blue
  accentLight: 'rgba(56, 189, 248, 0.12)',
  price: '#4ADE80',               // Neon Mint Green
  mrp: '#94A3B8',
  wholesale: '#FBBF24',           // Amber Gold
  error: '#F87171',
  success: '#4ADE80',
  warning: '#FBBF24',
  inputBackground: '#0F172A',
  tagBackground: '#1E293B',
  statusBar: 'light',
};

export const LightTheme: ThemeColors = {
  background: '#F8FAFC',          // Crisp modern slate canvas
  card: '#FFFFFF',                // Clean pure white cards
  cardSelected: '#EFF6FF',        // Subtle blue tint for active state
  border: '#E2E8F0',              // Soft border
  text: '#0F172A',                // Deep slate dark text for high legibility
  textSecondary: '#64748B',       // Slate gray
  accent: '#2563EB',              // Premium Royal Blue
  accentLight: 'rgba(37, 99, 235, 0.08)',
  price: '#16A34A',               // Clean Emerald Green
  mrp: '#64748B',
  wholesale: '#D97706',           // Deep Amber
  error: '#DC2626',
  success: '#16A34A',
  warning: '#D97706',
  inputBackground: '#F1F5F9',
  tagBackground: '#F1F5F9',
  statusBar: 'dark',
};

export const getThemeColors = (theme: 'dark' | 'light'): ThemeColors => {
  return theme === 'light' ? LightTheme : DarkTheme;
};

// Default export fallback for backward compatibility
export const Colors = DarkTheme;

// React hook to get active dynamic colors
export const useColors = (): ThemeColors => {
  const theme = useThemeStore((state) => state.theme);
  return getThemeColors(theme);
};
