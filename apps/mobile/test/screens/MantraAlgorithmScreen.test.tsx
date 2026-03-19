import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import MantraAlgorithmScreen from '../../screens/MantraAlgorithmScreen';
import { algorithmService } from '../../services/algorithm.service';
import { storage } from '../../utils/storage';

jest.mock('../../services/algorithm.service');
jest.mock('../../utils/storage');

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#9AA793',
      primaryDark: '#6D7E68',
      text: '#ffffff',
      error: '#E44438',
    },
  }),
}));

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
}));

jest.mock('../../components/UI/textWrapper', () => {
  const { Text } = jest.requireActual('react-native');
  return ({ children, ...props }: any) => <Text {...props}>{children}</Text>;
});

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    Ionicons: ({ name, ...props }: any) => <Text {...props}>{name}</Text>,
  };
});

const mockScores = [
  { category_id: 1, name: 'Anxiety', category_type: 'essential', score: 10 },
  { category_id: 2, name: 'Focus', category_type: 'goal', score: 7 },
  { category_id: 3, name: 'Calm', category_type: 'mood', score: 5 },
  { category_id: 4, name: 'Zero Score', category_type: 'essential', score: 0 },
];

describe('MantraAlgorithmScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getToken as jest.Mock).mockResolvedValue('mock-token');
    (algorithmService.getScores as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { scores: mockScores },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders loading indicator initially', () => {
    // Make getScores never resolve so we stay in loading state
    (algorithmService.getScores as jest.Mock).mockImplementation(() => new Promise(() => {}));
    const { getByText } = render(<MantraAlgorithmScreen />);
    // The screen title should still be visible in the header
    expect(getByText('Mantra Algorithm')).toBeTruthy();
  });

  it('renders scores grouped by category type once loaded', async () => {
    const { findByText, queryByText } = render(<MantraAlgorithmScreen />);

    expect(await findByText('Anxiety', {}, { timeout: 10000 })).toBeTruthy();
    expect(await findByText('Focus', {}, { timeout: 10000 })).toBeTruthy();
    expect(await findByText('Calm', {}, { timeout: 10000 })).toBeTruthy();

    // Zero-score categories should be filtered out
    expect(queryByText('Zero Score')).toBeNull();
  });

  it('renders section headers for each category type', async () => {
    const { getByText } = render(<MantraAlgorithmScreen />);

    await waitFor(() => {
      expect(getByText('Essential')).toBeTruthy();
      expect(getByText('Goal')).toBeTruthy();
      expect(getByText('Mood')).toBeTruthy();
    });
  });

  it('shows empty state when no scores', async () => {
    (algorithmService.getScores as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { scores: [] },
    });

    const { getByText } = render(<MantraAlgorithmScreen />);

    await waitFor(() => {
      expect(getByText(/No algorithm data yet/)).toBeTruthy();
    });
  });

  it('navigates back when back button is pressed', async () => {
    const { getByText } = render(<MantraAlgorithmScreen />);

    await waitFor(() => {
      expect(getByText('Anxiety')).toBeTruthy();
    });

    // Press the back chevron icon
    const backButton = getByText('chevron-back');
    fireEvent.press(backButton);

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('does not fetch scores when no token', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue(null);

    render(<MantraAlgorithmScreen />);

    await waitFor(() => {
      expect(algorithmService.getScores).not.toHaveBeenCalled();
    });
  });

  it('handles fetchScores error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (algorithmService.getScores as jest.Mock).mockRejectedValue(new Error('Network Error'));

    render(<MantraAlgorithmScreen />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load algorithm scores', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('enters edit mode when pencil is pressed', async () => {
    const { getByText, getAllByText } = render(<MantraAlgorithmScreen />);

    await waitFor(() => {
      expect(getByText('Anxiety')).toBeTruthy();
    });

    // Press pencil icon on the first category
    const pencilIcons = getAllByText('pencil');
    fireEvent.press(pencilIcons[0]);

    // A checkmark and close icon should appear
    await waitFor(() => {
      expect(getByText('checkmark-circle')).toBeTruthy();
      expect(getByText('close-circle')).toBeTruthy();
    });
  });

  it('saves score via edit field', async () => {
    (algorithmService.updateScore as jest.Mock).mockResolvedValue({ status: 'success' });

    const { getByText, getAllByText, getByDisplayValue } = render(<MantraAlgorithmScreen />);

    await waitFor(() => {
      expect(getByText('Anxiety')).toBeTruthy();
    });

    // Press pencil on the first score
    const pencilIcons = getAllByText('pencil');
    fireEvent.press(pencilIcons[0]);

    await waitFor(() => {
      expect(getByDisplayValue('10')).toBeTruthy();
    });

    // Change value and save
    fireEvent.changeText(getByDisplayValue('10'), '15');
    fireEvent.press(getByText('checkmark-circle'));

    await waitFor(() => {
      expect(algorithmService.updateScore).toHaveBeenCalledWith('mock-token', 1, 15);
    });
  });

  it('shows alert for invalid score (NaN)', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText, getAllByText, getByDisplayValue } = render(<MantraAlgorithmScreen />);

    await waitFor(() => {
      expect(getByText('Anxiety')).toBeTruthy();
    });

    const pencilIcons = getAllByText('pencil');
    fireEvent.press(pencilIcons[0]);

    await waitFor(() => {
      expect(getByDisplayValue('10')).toBeTruthy();
    });

    fireEvent.changeText(getByDisplayValue('10'), 'abc');
    fireEvent.press(getByText('checkmark-circle'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Invalid score',
        'Please enter a non-negative number.',
      );
    });
  });

  it('shows alert for negative score', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText, getAllByText, getByDisplayValue } = render(<MantraAlgorithmScreen />);

    await waitFor(() => {
      expect(getByText('Anxiety')).toBeTruthy();
    });

    const pencilIcons = getAllByText('pencil');
    fireEvent.press(pencilIcons[0]);

    await waitFor(() => {
      expect(getByDisplayValue('10')).toBeTruthy();
    });

    fireEvent.changeText(getByDisplayValue('10'), '-5');
    fireEvent.press(getByText('checkmark-circle'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Invalid score',
        'Please enter a non-negative number.',
      );
    });
  });

  it('cancels editing when close icon is pressed', async () => {
    const { getByText, getAllByText, queryByText } = render(<MantraAlgorithmScreen />);

    await waitFor(() => {
      expect(getByText('Anxiety')).toBeTruthy();
    });

    const pencilIcons = getAllByText('pencil');
    fireEvent.press(pencilIcons[0]);

    await waitFor(() => {
      expect(getByText('close-circle')).toBeTruthy();
    });

    fireEvent.press(getByText('close-circle'));

    await waitFor(() => {
      // close-circle should disappear
      expect(queryByText('checkmark-circle')).toBeNull();
    });
  });

  it('handles updateScore error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (algorithmService.updateScore as jest.Mock).mockRejectedValue(new Error('fail'));

    const { getByText, getAllByText, getByDisplayValue } = render(<MantraAlgorithmScreen />);

    await waitFor(() => {
      expect(getByText('Anxiety')).toBeTruthy();
    });

    const pencilIcons = getAllByText('pencil');
    fireEvent.press(pencilIcons[0]);

    await waitFor(() => {
      expect(getByDisplayValue('10')).toBeTruthy();
    });

    fireEvent.changeText(getByDisplayValue('10'), '15');
    fireEvent.press(getByText('checkmark-circle'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Could not update score.');
    });

    consoleSpy.mockRestore();
  });

  it('does not save score when token is null', async () => {
    const { getByText, getAllByText, getByDisplayValue } = render(<MantraAlgorithmScreen />);

    await waitFor(() => {
      expect(getByText('Anxiety')).toBeTruthy();
    });

    // Mock getToken to return null after initial load
    (storage.getToken as jest.Mock).mockResolvedValue(null);

    const pencilIcons = getAllByText('pencil');
    fireEvent.press(pencilIcons[0]);

    await waitFor(() => {
      expect(getByDisplayValue('10')).toBeTruthy();
    });

    fireEvent.changeText(getByDisplayValue('10'), '15');
    fireEvent.press(getByText('checkmark-circle'));

    await waitFor(() => {
      expect(algorithmService.updateScore).not.toHaveBeenCalled();
    });
  });

  it('resets a single score via Alert confirmation', async () => {
    (algorithmService.resetScore as jest.Mock).mockResolvedValue({ status: 'success' });
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      // Simulate pressing "Reset"
      const resetButton = buttons?.find((b: any) => b.text === 'Reset');
      if (resetButton?.onPress) resetButton.onPress();
    });

    const { getByText, getAllByText } = render(<MantraAlgorithmScreen />);

    await waitFor(() => {
      expect(getByText('Anxiety')).toBeTruthy();
    });

    // Press trash icon for the first category
    const trashIcons = getAllByText('trash-outline');
    fireEvent.press(trashIcons[0]);

    await waitFor(() => {
      expect(algorithmService.resetScore).toHaveBeenCalledWith('mock-token', 1);
    });
  });

  it('does not reset score when no token', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      const resetButton = buttons?.find((b: any) => b.text === 'Reset');
      if (resetButton?.onPress) resetButton.onPress();
    });

    const { getByText, getAllByText } = render(<MantraAlgorithmScreen />);

    await waitFor(() => {
      expect(getByText('Anxiety')).toBeTruthy();
    });

    (storage.getToken as jest.Mock).mockResolvedValue(null);

    const trashIcons = getAllByText('trash-outline');
    fireEvent.press(trashIcons[0]);

    await waitFor(() => {
      expect(algorithmService.resetScore).not.toHaveBeenCalled();
    });
  });

  it('handles resetScore error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (algorithmService.resetScore as jest.Mock).mockRejectedValue(new Error('fail'));
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      const resetButton = buttons?.find((b: any) => b.text === 'Reset');
      if (resetButton?.onPress) resetButton.onPress();
    });

    const { getByText, getAllByText } = render(<MantraAlgorithmScreen />);

    await waitFor(() => {
      expect(getByText('Anxiety')).toBeTruthy();
    });

    const trashIcons = getAllByText('trash-outline');
    fireEvent.press(trashIcons[0]);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error resetting score', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('resets all scores via Alert confirmation', async () => {
    (algorithmService.resetAllScores as jest.Mock).mockResolvedValue({ status: 'success' });
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      const resetAllButton = buttons?.find((b: any) => b.text === 'Reset All');
      if (resetAllButton?.onPress) resetAllButton.onPress();
    });

    const { getByText } = render(<MantraAlgorithmScreen />);

    await waitFor(() => {
      expect(getByText('Anxiety')).toBeTruthy();
    });

    // Press "Reset All" button
    fireEvent.press(getByText('Reset All'));

    await waitFor(() => {
      expect(algorithmService.resetAllScores).toHaveBeenCalledWith('mock-token');
    });
  });

  it('does not reset all when no token', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      const resetAllButton = buttons?.find((b: any) => b.text === 'Reset All');
      if (resetAllButton?.onPress) resetAllButton.onPress();
    });

    const { getByText } = render(<MantraAlgorithmScreen />);

    await waitFor(() => {
      expect(getByText('Anxiety')).toBeTruthy();
    });

    (storage.getToken as jest.Mock).mockResolvedValue(null);

    fireEvent.press(getByText('Reset All'));

    await waitFor(() => {
      expect(algorithmService.resetAllScores).not.toHaveBeenCalled();
    });
  });

  it('handles resetAllScores error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (algorithmService.resetAllScores as jest.Mock).mockRejectedValue(new Error('fail'));
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      const resetAllButton = buttons?.find((b: any) => b.text === 'Reset All');
      if (resetAllButton?.onPress) resetAllButton.onPress();
    });

    const { getByText } = render(<MantraAlgorithmScreen />);

    await waitFor(() => {
      expect(getByText('Anxiety')).toBeTruthy();
    });

    fireEvent.press(getByText('Reset All'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error resetting all scores', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('hides Reset All button when no active scores', async () => {
    (algorithmService.getScores as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { scores: [] },
    });

    const { queryByText } = render(<MantraAlgorithmScreen />);

    await waitFor(() => {
      expect(queryByText('Reset All')).toBeNull();
    });
  });

  it('pull-to-refresh calls fetchScores again', async () => {
    const { getByText, UNSAFE_root } = render(<MantraAlgorithmScreen />);

    await waitFor(() => {
      expect(getByText('Anxiety')).toBeTruthy();
    });

    expect(algorithmService.getScores).toHaveBeenCalledTimes(1);

    // Find the SectionList (which has RefreshControl) and trigger onRefresh
    const sectionList = UNSAFE_root.findAll(
      (node: any) => node.type?.name === 'SectionList' || node.props?.refreshControl,
    );

    if (sectionList.length > 0 && sectionList[0].props.refreshControl) {
      await act(async () => {
        sectionList[0].props.refreshControl.props.onRefresh();
      });
    }

    await waitFor(() => {
      expect(algorithmService.getScores).toHaveBeenCalledTimes(2);
    });
  });
});
