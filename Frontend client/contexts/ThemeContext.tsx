import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/colors';

type ThemeMode = 'light' | 'dark' | 'auto';
type ColorScheme = 'light' | 'dark';

const THEME_STORAGE_KEY = '@mosombi_theme';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
  const [isLoading, setIsLoading] = useState(true);

  const activeColorScheme: ColorScheme =
    themeMode === 'auto'
      ? (systemColorScheme ?? 'light')
      : themeMode;

  const colors = Colors[activeColorScheme];

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto')) {
        setThemeMode(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = useCallback(async (mode: ThemeMode) => {
    try {
      setThemeMode(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme: ThemeMode = activeColorScheme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  }, [activeColorScheme, setTheme]);

  return useMemo(() => ({
    themeMode,
    colorScheme: activeColorScheme,
    colors,
    setTheme,
    toggleTheme,
    isLoading,
    isDark: activeColorScheme === 'dark',
  }), [themeMode, activeColorScheme, colors, setTheme, toggleTheme, isLoading]);
});
