import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import FocusScreen from '../../screens/FocusScreen';
import { useTheme } from '../../context/ThemeContext';
import MantraCarousel from '../../components/carousel';
import { useReminders } from '../../hooks/useReminders';

jest.mock('../../context/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

jest.mock('../../components/carousel', () => {
  return jest.fn(() => null);
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('../../hooks/useReminders', () => ({
  useReminders: jest.fn(),
}));

jest.spyOn(Alert, 'alert');

describe('FocusScreen', () => {
  const mockGoBack = jest.fn();
  const mockNavigate = jest.fn();
  const mockOnLike = jest.fn();
  const mockOnSave = jest.fn();

  const mockMantra = {
    mantra_id: 1,
    title: 'Test mantra',
    description: 'desc',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useTheme as jest.Mock).mockReturnValue({
      colors: { primary: '#000', text: '#fff', secondary: '#ff0' },
    });
    (useReminders as jest.Mock).mockReturnValue({
      getReminderForMantra: jest.fn().mockReturnValue(undefined),
      handleReminderPress: jest.fn(),
    });
  });

  const renderScreen = (mantra = mockMantra) =>
    render(
      <FocusScreen
        navigation={{ goBack: mockGoBack, navigate: mockNavigate }}
        route={{
          params: {
            mantra,
            onLike: mockOnLike,
            onSave: mockOnSave,
          },
        }}
      />,
    );

  test('calls goBack when back button is pressed', () => {
    const { UNSAFE_getByProps } = renderScreen();

    const backButton = UNSAFE_getByProps({ testID: 'back-button' });

    act(() => {
      backButton.props.onPress();
    });

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

  test('calls handleReminderPress when reminder button is pressed', () => {
    const mockHandleReminderPress = jest.fn();
    (useReminders as jest.Mock).mockReturnValue({
      getReminderForMantra: jest.fn().mockReturnValue(undefined),
      handleReminderPress: mockHandleReminderPress,
    });

    const { UNSAFE_getByProps } = renderScreen();

    act(() => {
      UNSAFE_getByProps({ testID: 'reminder-button' }).props.onPress();
    });

    expect(mockHandleReminderPress).toHaveBeenCalledWith(
      'mantra',
      1,
      expect.objectContaining({ goBack: expect.any(Function), navigate: expect.any(Function) }),
    );
  });

  test('shows active reminder icon when a reminder exists', () => {
    (useReminders as jest.Mock).mockReturnValue({
      getReminderForMantra: jest.fn().mockReturnValue({ reminder_id: 10, status: 'active' }),
      handleReminderPress: jest.fn(),
    });

    renderScreen();
    expect(MantraCarousel).toHaveBeenCalled();
  });

  test('navigates to JournalEditor when journal button pressed', () => {
    const { UNSAFE_getByProps } = renderScreen();

    act(() => {
      UNSAFE_getByProps({ testID: 'journal-button' }).props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('JournalEditor', {
      mantraId: 1,
      mantraTitle: 'Test mantra',
    });
  });
});
