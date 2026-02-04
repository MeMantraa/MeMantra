// context/ThemeContext.tsx
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, ThemeName } from '../styles/theme';

// Change this type definition:
type ThemeColors = (typeof themes)[ThemeName];

type ThemeContextType = {
  theme: ThemeName;
  colors: ThemeColors; // Changed from: typeof themes.default
  setTheme: (themeName: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'default',
  colors: themes.default,
  setTheme: () => {},
});

const THEME_STORAGE_KEY = '@app_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeName>('default');

  // Load theme from storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && savedTheme in themes) {
          setThemeState(savedTheme as ThemeName);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (themeName: ThemeName) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, themeName);
      setThemeState(themeName);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const contextValue = useMemo(() => ({ theme, colors: themes[theme], setTheme }), [theme]);

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
export { ThemeContext };
