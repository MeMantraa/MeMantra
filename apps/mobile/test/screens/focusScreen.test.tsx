import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FocusScreen from '../../screens/focusScreen';
import { useTheme } from '../../context/ThemeContext';
import MantraCarousel from '../../components/carousel';

jest.mock('../../context/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

jest.mock('../../components/carousel', () => {
  return jest.fn(() => null);
});

describe('FocusScreen', () => {
  const mockGoBack = jest.fn();
  const mockOnLike = jest.fn();
  const mockOnSave = jest.fn();

  const mockMantra = {
    id: 1,
    title: 'Test mantra',
    description: 'desc',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useTheme as jest.Mock).mockReturnValue({
      colors: { primary: '#000', text: '#fff' },
    });
  });

  const renderScreen = () =>
    render(
      <FocusScreen
        navigation={{ goBack: mockGoBack }}
        route={{
          params: {
            mantra: mockMantra,
            onLike: mockOnLike,
            onSave: mockOnSave,
          },
        }}
      />,
    );

  test('calls goBack when back button is pressed', () => {
    const { getByTestId } = renderScreen();

    const backButton = getByTestId('back-button');

    fireEvent.press(backButton);

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  test('passes correct props to MantraCarousel', () => {
    renderScreen();

    expect(MantraCarousel).toHaveBeenCalledWith(
      expect.objectContaining({
        item: mockMantra,
        onLike: mockOnLike,
        onSave: mockOnSave,
        showButtons: false,
        isFocusMode: true,
      }),

      undefined,
    );
  });
});
