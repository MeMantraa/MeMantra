// context/ThemeContext.tsx
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, ThemeName } from '../styles/theme';
import { storage } from '../utils/storage';
import { userService } from '../services/user.service';

type ThemeColors = (typeof themes)[ThemeName];

type ThemeContextType = {
  theme: ThemeName;
  colors: ThemeColors;
  setTheme: (themeName: ThemeName) => void;
  resetToDefault: () => void; // Add this
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

    // Check periodically (every 50ms) to catch login/logout
    const interval = setInterval(checkToken, 50);
    return () => clearInterval(interval);
  }, []);

  // Load theme whenever auth token changes
  useEffect(() => {
    const loadTheme = async () => {
      if (!authToken) {
        // No token = logged out, reset to default
        setThemeState('default');
        await AsyncStorage.removeItem(THEME_STORAGE_KEY);
        return;
      }

      // User is logged in - fetch their theme
      try {
        const response = await userService.getTheme(authToken);
        const serverTheme = response.data.theme as ThemeName;
        if (serverTheme in themes) {
          setThemeState(serverTheme);
          await AsyncStorage.setItem(THEME_STORAGE_KEY, serverTheme);
        }
      } catch (error) {
        console.error('Failed to fetch theme:', error);
        // Fallback to cached theme
        const cached = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (cached && cached in themes) setThemeState(cached as ThemeName);
      }
    };

    loadTheme();
  }, [authToken]); // Re-run whenever authToken changes

  const setTheme = async (themeName: ThemeName) => {
    setThemeState(themeName);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, themeName);

    const token = await storage.getToken();
    if (token) {
      try {
        await userService.updateTheme(themeName, token);
      } catch (error) {
        console.error('Failed to save theme to server:', error);
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
