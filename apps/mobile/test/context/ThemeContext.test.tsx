import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ThemeProvider, useTheme, ThemeContext } from '../../context/ThemeContext';
import { themes } from '../../styles/theme';
import { Text, Button } from 'react-native';
import AppText from '../../components/UI/textWrapper';

const TestComponent = () => {
  const { theme, colors, toggleTheme } = useTheme();

  return (
    <>
      <AppText>{theme}</AppText>
      <AppText>{colors.primary}</AppText>
      <Button title="toggle" onPress={toggleTheme} />
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

  it('calls toggleTheme and logs message', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByText('toggle'));

    expect(logSpy).toHaveBeenCalledWith('Only one theme available for now');

    logSpy.mockRestore();
  });

  describe('ThemeContext default value', () => {
    it('toggleTheme default function can be called', () => {
      let called = false;

      const TestComponent = () => {
        const { toggleTheme } = React.useContext(ThemeContext);
        toggleTheme();
        called = true;
        return null;
      };

      render(<TestComponent />);

      expect(called).toBe(true);
    });
  });
});
