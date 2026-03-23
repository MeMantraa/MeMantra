import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import FocusScreen from '../../screens/FocusScreen';
import { useTheme } from '../../context/ThemeContext';
import MantraCarousel from '../../components/carousel';
import { reminderService } from '../../services/reminder.service';

jest.mock('../../context/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

jest.mock('../../components/carousel', () => {
  return jest.fn(() => null);
});

jest.mock('@react-navigation/native', () => {
  const React = jest.requireActual('react');
  return {
    ...jest.requireActual('@react-navigation/native'),
    useFocusEffect: (callback: () => void) => {
      React.useEffect(() => {
        callback();
      }, []);
    },
  };
});

jest.mock('../../services/reminder.service', () => ({
  reminderService: {
    getReminders: jest.fn().mockResolvedValue({ status: 'success', data: { reminders: [] } }),
    updateReminder: jest.fn(),
    deleteReminder: jest.fn(),
  },
}));

jest.mock('../../utils/storage', () => ({
  storage: {
    getToken: jest.fn().mockResolvedValue('mock-token'),
  },
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

    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminders: [] },
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

  test('navigates to CreateReminder when reminder button pressed with no existing reminder', async () => {
    const { getByTestId } = renderScreen();

    await waitFor(() => {
      expect(reminderService.getReminders).toHaveBeenCalled();
    });

    fireEvent.press(getByTestId('reminder-button'));

    expect(mockNavigate).toHaveBeenCalledWith('CreateReminder', { mantraId: 1 });
  });

  test('shows reminder alert when reminder button pressed with existing reminder', async () => {
    (reminderService.getReminders as jest.Mock).mockResolvedValue({
      status: 'success',
      data: {
        reminders: [{ reminder_id: 10, mantra_id: 1, collection_id: null, status: 'active' }],
      },
    });

    const { getByTestId } = renderScreen();

    await waitFor(() => {
      expect(reminderService.getReminders).toHaveBeenCalled();
    });

    fireEvent.press(getByTestId('reminder-button'));

    expect(mockNavigate).not.toHaveBeenCalledWith('CreateReminder', expect.anything());
    expect(Alert.alert).toHaveBeenCalledWith('Reminder', undefined, expect.any(Array));
  });

  test('navigates to JournalEditor when journal button pressed', () => {
    const { getByTestId } = renderScreen();

    fireEvent.press(getByTestId('journal-button'));

    expect(mockNavigate).toHaveBeenCalledWith('JournalEditor', {
      mantraId: 1,
      mantraTitle: 'Test mantra',
    });
  });
});
