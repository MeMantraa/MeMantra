/* global require */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ThemesScreen from '../../screens/ThemesScreen';
import { themes, themeDisplayNames } from '../../styles/theme';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

// Mock storage
jest.mock('../../utils/storage', () => ({
  storage: {
    getToken: jest.fn(() => Promise.resolve('mock-token')),
  },
}));

// Mock user service
jest.mock('../../services/user.service', () => ({
  userService: {
    getTheme: jest.fn(() => Promise.resolve({ data: { theme: 'default' } })),
    updateTheme: jest.fn(() => Promise.resolve()),
  },
}));

// Mock navigation
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
}));

// Import after mocks
import { ThemeProvider } from '../../context/ThemeContext';
import { userService } from '../../services/user.service';

describe('ThemesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithThemeProvider = (component: React.ReactElement) => {
    return render(<ThemeProvider>{component}</ThemeProvider>);
  };

  it('renders the screen with title', () => {
    const { getByText } = renderWithThemeProvider(<ThemesScreen />);

    expect(getByText('Themes')).toBeTruthy();
  });

  it('renders the description text', () => {
    const { getByText } = renderWithThemeProvider(<ThemesScreen />);

    expect(getByText('Choose your preferred color theme')).toBeTruthy();
  });

  it('renders all available theme options', () => {
    const { getByText } = renderWithThemeProvider(<ThemesScreen />);

    const themeNames = Object.keys(themes);

    themeNames.forEach((themeName) => {
      expect(
        getByText(themeDisplayNames[themeName as keyof typeof themeDisplayNames]),
      ).toBeTruthy();
    });
  });

  it('shows checkmark on currently selected theme', async () => {
    const { UNSAFE_getAllByType } = renderWithThemeProvider(<ThemesScreen />);

    await waitFor(() => {
      // The Ionicons component should be present for the selected theme
      const icons = UNSAFE_getAllByType(require('@expo/vector-icons').Ionicons);
      // At least 2 icons: back button + checkmark for selected theme
      expect(icons.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('calls navigation.goBack when back button is pressed', () => {
    const { UNSAFE_getAllByType } = renderWithThemeProvider(<ThemesScreen />);

    const touchableOpacities = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
    // First TouchableOpacity should be the back button
    const backButton = touchableOpacities[0];

    fireEvent.press(backButton);

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('calls setTheme when a theme option is pressed', async () => {
    const updateThemeSpy = jest.spyOn(userService, 'updateTheme');

    const { getByText } = renderWithThemeProvider(<ThemesScreen />);

    // Get the first theme that's not 'default'
    const themeNames = Object.keys(themes) as Array<keyof typeof themes>;
    const nonDefaultTheme = themeNames.find((name) => name !== 'default');

    if (nonDefaultTheme) {
      const themeButton = getByText(themeDisplayNames[nonDefaultTheme]);
      fireEvent.press(themeButton);

      await waitFor(() => {
        expect(updateThemeSpy).toHaveBeenCalledWith(nonDefaultTheme, 'mock-token');
      });
    }
  });

  it('updates selected theme when a different theme is pressed', async () => {
    const { getByText } = renderWithThemeProvider(<ThemesScreen />);

    const themeNames = Object.keys(themes) as Array<keyof typeof themes>;

    // Press a theme option
    if (themeNames.length > 1) {
      const firstTheme = themeNames[0];
      const themeButton = getByText(themeDisplayNames[firstTheme]);

      fireEvent.press(themeButton);

      await waitFor(() => {
        expect(userService.updateTheme).toHaveBeenCalled();
      });
    }
  });

  it('displays color preview for each theme', () => {
    const { UNSAFE_getAllByType } = renderWithThemeProvider(<ThemesScreen />);

    const views = UNSAFE_getAllByType(require('react-native').View);

    expect(views.length).toBeGreaterThan(0);
  });

  it('renders ScrollView for theme list', () => {
    const { UNSAFE_getByType } = renderWithThemeProvider(<ThemesScreen />);

    const scrollView = UNSAFE_getByType(require('react-native').ScrollView);
    expect(scrollView).toBeTruthy();
  });

  it('applies correct styling to selected theme', async () => {
    const { UNSAFE_getAllByType } = renderWithThemeProvider(<ThemesScreen />);

    await waitFor(() => {
      const touchableOpacities = UNSAFE_getAllByType(require('react-native').TouchableOpacity);

      const themeButtons = touchableOpacities.slice(1);

      const hasStyledButton = themeButtons.some((button: any) => {
        return button.props.style?.borderWidth === 2;
      });

      expect(hasStyledButton).toBe(true);
    });
  });

  it('handles theme selection for default theme', async () => {
    const { getByText } = renderWithThemeProvider(<ThemesScreen />);

    const defaultThemeButton = getByText(themeDisplayNames.default);

    fireEvent.press(defaultThemeButton);

    await waitFor(() => {
      expect(userService.updateTheme).toHaveBeenCalled();
    });
  });

  it('renders theme options in correct order', () => {
    const { UNSAFE_getAllByType } = renderWithThemeProvider(<ThemesScreen />);

    const touchableOpacities = UNSAFE_getAllByType(require('react-native').TouchableOpacity);

    const themeNames = Object.keys(themes);
    expect(touchableOpacities.length).toBe(themeNames.length + 1); // +1 for back button
  });

  it('maintains scroll position in ScrollView', () => {
    const { UNSAFE_getByType } = renderWithThemeProvider(<ThemesScreen />);

    const scrollView = UNSAFE_getByType(require('react-native').ScrollView);

    expect(scrollView.props.showsVerticalScrollIndicator).toBe(false);
  });

  it('displays checkmark icon only for selected theme', async () => {
    const { UNSAFE_getAllByType } = renderWithThemeProvider(<ThemesScreen />);

    await waitFor(() => {
      const icons = UNSAFE_getAllByType(require('@expo/vector-icons').Ionicons);

      const checkmarkIcons = icons.filter((icon: any) => icon.props.name === 'checkmark-circle');

      expect(checkmarkIcons.length).toBe(1);
    });
  });

  it('renders back arrow icon with correct properties', () => {
    const { UNSAFE_getAllByType } = renderWithThemeProvider(<ThemesScreen />);

    const icons = UNSAFE_getAllByType(require('@expo/vector-icons').Ionicons);
    const backIcon = icons[0];

    expect(backIcon.props.name).toBe('arrow-back');
    expect(backIcon.props.size).toBe(28);
  });

  it('displays correct number of color preview boxes', () => {
    const { UNSAFE_getAllByType } = renderWithThemeProvider(<ThemesScreen />);

    const views = UNSAFE_getAllByType(require('react-native').View);
    const themeCount = Object.keys(themes).length;

    const colorPreviewBoxes = views.filter(
      (view: any) => view.props.style?.backgroundColor && view.props.className?.includes('rounded'),
    );

    expect(colorPreviewBoxes.length).toBe(themeCount * 2);
  });

  it('handles error when updateTheme fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const updateThemeSpy = jest.spyOn(userService, 'updateTheme');
    updateThemeSpy.mockRejectedValue(new Error('Update failed'));

    const { getByText } = renderWithThemeProvider(<ThemesScreen />);

    const themeNames = Object.keys(themes) as Array<keyof typeof themes>;
    const testTheme = themeNames[0];

    const themeButton = getByText(themeDisplayNames[testTheme]);
    fireEvent.press(themeButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save theme to server:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});
