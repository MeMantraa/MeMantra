// styles/theme.ts
export type ThemeName = 'default' | 'ocean' | 'sunset' | 'forest' | 'lavender';

export const themes = {
  default: {
    primary: '#9AA793',
    secondary: '#E6D29C',
    primaryDark: '#6D7E68',
    text: '#ffffff',
    white: '#ffffff',
    black: '#000000',
    placeholderText: '#999',
    settings: '#D9D9D9',
    error: '#E44438',
  },
  ocean: {
    primary: '#4A90A4',
    secondary: '#87CEEB',
    primaryDark: '#2C5F7F',
    text: '#ffffff',
    white: '#ffffff',
    black: '#000000',
    placeholderText: '#999',
    settings: '#D9D9D9',
    error: '#E44438',
  },
  sunset: {
    primary: '#E57373',
    secondary: '#FFB74D',
    primaryDark: '#C62828',
    text: '#ffffff',
    white: '#ffffff',
    black: '#000000',
    placeholderText: '#999',
    settings: '#D9D9D9',
    error: '#E44438',
  },
  forest: {
    primary: '#558B2F',
    secondary: '#AED581',
    primaryDark: '#33691E',
    text: '#ffffff',
    white: '#ffffff',
    black: '#000000',
    placeholderText: '#999',
    settings: '#D9D9D9',
    error: '#E44438',
  },
  lavender: {
    primary: '#9575CD',
    secondary: '#E1BEE7',
    primaryDark: '#5E35B1',
    text: '#ffffff',
    white: '#ffffff',
    black: '#000000',
    placeholderText: '#999',
    settings: '#D9D9D9',
    error: '#E44438',
  },
} as const;

export const themeDisplayNames: Record<ThemeName, string> = {
  default: 'Sage Green',
  ocean: 'Ocean Blue',
  sunset: 'Sunset Orange',
  forest: 'Forest Green',
  lavender: 'Lavender Purple',
};
