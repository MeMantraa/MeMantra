export interface Theme {
  primary: string;
  secondary: string;
  primaryDark: string;
  text: string;
  white: string;
  black: string;
  placeholderText: string;
  settings: string;
  error: string;
}

// Base colors (can be overriden)
const baseColors = {
  text: '#ffffff',
  white: '#ffffff',
  black: '#000000',
  placeholderText: '#999',
  settings: '#D9D9D9',
  error: '#E44438',
};

// Unique themes
const themeDefinitions = {
  default: {
    displayName: 'Sage Green',
    primary: '#9AA793',
    secondary: '#E6D29C',
    primaryDark: '#6D7E68',
  },
  ocean: {
    displayName: 'Ocean Blue',
    primary: '#7BA5B5',
    secondary: '#B8D8E6',
    primaryDark: '#4D7A8C',
  },
  sunset: {
    displayName: 'Sunset Orange',
    primary: '#D4A5A5',
    secondary: '#F5D5C8',
    primaryDark: '#A67C7C',
  },
  forest: {
    displayName: 'Forest Green',
    primary: '#4A5D3B',
    secondary: '#A8B89A',
    primaryDark: '#2E3B1E',
  },
  lavender: {
    displayName: 'Lavender Purple',
    primary: '#B5A8C9',
    secondary: '#D9D0E8',
    primaryDark: '#8577A1',
  },
  earth: {
    displayName: 'Earth Beige',
    primary: '#B5A592',
    secondary: '#D9CFC1',
    primaryDark: '#8C7A68',
  },
  moonlight: {
    displayName: 'Moonlight Blue',
    primary: '#7B8BA5',
    secondary: '#D4C5B8',
    primaryDark: '#4A5A73',
  },
  terracotta: {
    displayName: 'Terracotta Orange',
    primary: '#C17A5F',
    secondary: '#E8BFA9',
    primaryDark: '#9A5F47',
  },
} as const;

// Auto-generate the ThemeName type from the keys
export type ThemeName = keyof typeof themeDefinitions;

// Build the full themes object
export const themes = Object.fromEntries(
  Object.entries(themeDefinitions).map(([key, def]) => [
    key,
    { ...baseColors, primary: def.primary, secondary: def.secondary, primaryDark: def.primaryDark },
  ]),
) as Record<ThemeName, Theme>;

// Extract display names
export const themeDisplayNames = Object.fromEntries(
  Object.entries(themeDefinitions).map(([key, def]) => [key, def.displayName]),
) as Record<ThemeName, string>;
