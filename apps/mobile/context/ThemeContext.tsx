import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, ThemeName } from '../styles/theme';
import { storage } from '../utils/storage';
import { userService } from '../services/user.service';

type ThemeColors = (typeof themes)[ThemeName];

type ThemeContextType = {
  theme: ThemeName;
  colors: ThemeColors;
  setTheme: (themeName: ThemeName) => void;
  resetToDefault: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'default',
  colors: themes.default,
  setTheme: () => {},
  resetToDefault: () => {}, // Add this
});

const THEME_STORAGE_KEY = '@app_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeName>('default');
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Watch for auth token changes
  useEffect(() => {
    const checkToken = async () => {
      const token = await storage.getToken();
      setAuthToken(token);
    };

    // Check immediately
    checkToken();

    // Avoid leaking polling timers during Jest runs; tests don't need
    // auth-token polling to re-run every 50ms.
    if (globalThis?.process?.env?.NODE_ENV === 'test') {
      return;
    }

    const interval = setInterval(checkToken, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadTheme = async () => {
      if (!authToken) {
        setThemeState('default');
        await AsyncStorage.removeItem(THEME_STORAGE_KEY);
        return;
      }

      // Login fetch user theme
      try {
        const response = await userService.getTheme(authToken);
        const serverTheme = response.data.theme as ThemeName;
        if (serverTheme in themes) {
          setThemeState(serverTheme);
          await AsyncStorage.setItem(THEME_STORAGE_KEY, serverTheme);
        }
      } catch (error) {
        console.error('Failed to fetch theme:', error);
        Alert.alert('Error', 'Failed to load your theme. Using cached theme.');
        // Fallback to cached theme
        const cached = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (cached && cached in themes) setThemeState(cached as ThemeName);
      }
    };

    loadTheme();
  }, [authToken]);

  const setTheme = async (themeName: ThemeName) => {
    setThemeState(themeName);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, themeName);

    const token = await storage.getToken();
    if (token) {
      try {
        await userService.updateTheme(themeName, token);
      } catch (error) {
        console.error('Failed to save theme to server:', error);
        Alert.alert('Error', 'Failed to save theme. Your selection will be applied locally.');
      }
    }
  };

  const resetToDefault = () => {
    setThemeState('default');
    AsyncStorage.removeItem(THEME_STORAGE_KEY);
  };

  const contextValue = useMemo(
    () => ({ theme, colors: themes[theme], setTheme, resetToDefault }),
    [theme],
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
export { ThemeContext };
