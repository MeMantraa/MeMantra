import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ThemeProvider, useTheme, ThemeContext } from '../../context/ThemeContext';
import { themes } from '../../styles/theme';
import { Button } from 'react-native';
import AppText from '../../components/UI/textWrapper';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../../utils/storage', () => ({
  storage: {
    getToken: jest.fn(() => Promise.resolve(null)),
  },
}));

jest.mock('../../services/user.service', () => ({
  userService: {
    getTheme: jest.fn(),
    updateTheme: jest.fn(),
  },
}));

const TestComponent = () => {
  const { theme, colors, setTheme } = useTheme();
  return (
    <>
      <AppText>{theme}</AppText>
      <AppText>{colors.primary}</AppText>
      <Button title="toggle" onPress={() => setTheme('default')} />
    </>
  );
};

describe('ThemeContext', () => {
  it('provides default theme and colors', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    expect(screen.getByText('default')).toBeTruthy();
    expect(screen.getByText(themes.default.primary)).toBeTruthy();
  });

  it('calls setTheme when button is pressed', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByText('toggle'));

    expect(screen.getByText('default')).toBeTruthy();
  });

  describe('ThemeContext default value', () => {
    it('setTheme default function can be called', () => {
      let called = false;
      const TestComponent = () => {
        const { setTheme } = React.useContext(ThemeContext);
        setTheme('default');
        called = true;
        return null;
      };

      render(<TestComponent />);
      expect(called).toBe(true);
    });
  });
});
