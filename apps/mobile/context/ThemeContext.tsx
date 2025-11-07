// src/context/ThemeContext.tsx
import React, { createContext, useContext, useState, useMemo } from 'react';
import { themes, ThemeName } from '../styles/theme';

type ThemeContextType = {
  theme: ThemeName;
  colors: typeof themes.default;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'default',
  colors: themes.default,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme] = useState<ThemeName>('default');

  const toggleTheme = () => {
    console.log('Only one theme available for now');
  };

  // Ensure stable reference for Context value (SonarQube)
  const contextValue = useMemo(() => ({ theme, colors: themes[theme], toggleTheme }), [theme]);

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
export { ThemeContext };
