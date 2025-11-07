import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import SearchBar from '../../../components/UI/searchBar';
import { useTheme } from '../../../context/ThemeContext';
import { Animated } from 'react-native';

jest.spyOn(Animated, 'timing').mockImplementation((value, config: any) => {
  return {
    start: (test?: () => void) => {
      (value as Animated.Value).setValue(config.toValue as number);
      if (test) test();
    },
  } as any;
});

jest.mock('../../../context/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

jest.useFakeTimers();

describe('SearchBar Component', () => {
  const mockOnSearch = jest.fn();

  const mockColors = {
    primaryDark: '#000',
    secondary: '#fff',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useTheme as jest.Mock).mockReturnValue({ colors: mockColors });
  });

  it('renders collapsed by default', () => {
    const { getByTestId, queryByTestId } = render(<SearchBar onSearch={mockOnSearch} />);

    expect(getByTestId('search-toggle-button')).toBeTruthy();

    expect(queryByTestId('search-input')).toBeNull();

    expect(queryByTestId('search-close-button')).toBeNull();
  });

  it('expands when toggle button is pressed', async () => {
    const { getByTestId, queryByTestId } = render(<SearchBar onSearch={mockOnSearch} />);

    const toggleButton = getByTestId('search-toggle-button');

    fireEvent.press(toggleButton);

    await waitFor(() => {
      expect(queryByTestId('search-input')).toBeTruthy();

      expect(queryByTestId('search-close-button')).toBeTruthy();
    });
  });

  it('collapses when close button is pressed', async () => {
    const { getByTestId, queryByTestId } = render(<SearchBar onSearch={mockOnSearch} />);

    // expand
    fireEvent.press(getByTestId('search-toggle-button'));

    await waitFor(() => getByTestId('search-input'));

    // collapse
    fireEvent.press(getByTestId('search-close-button'));

    await waitFor(() => {
      expect(queryByTestId('search-input')).toBeNull();
    });
  });

  it('updates text and triggers search after debounce', async () => {
    const { getByTestId } = render(<SearchBar onSearch={mockOnSearch} />);

    fireEvent.press(getByTestId('search-toggle-button'));

    const input = getByTestId('search-input');

    fireEvent.changeText(input, 'mindfulness');

    expect(mockOnSearch).not.toHaveBeenCalled();

    // simulate debounce delay
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('mindfulness');
    });
  });

  it('does not trigger search for empty or whitespace-only queries', async () => {
    const { getByTestId } = render(<SearchBar onSearch={mockOnSearch} />);

    fireEvent.press(getByTestId('search-toggle-button'));

    const input = getByTestId('search-input');

    fireEvent.changeText(input, '   ');

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('triggers search immediately when submit is pressed', async () => {
    const { getByTestId } = render(<SearchBar onSearch={mockOnSearch} />);

    fireEvent.press(getByTestId('search-toggle-button'));

    const input = getByTestId('search-input');

    fireEvent.changeText(input, 'focus');

    fireEvent(input, 'submitEditing');

    expect(mockOnSearch).toHaveBeenCalledWith('focus');
  });

  it('does not call onSearch when submit pressed with empty query', async () => {
    const { getByTestId } = render(<SearchBar onSearch={mockOnSearch} />);

    fireEvent.press(getByTestId('search-toggle-button'));

    const input = getByTestId('search-input');

    fireEvent.changeText(input, '');

    fireEvent(input, 'submitEditing');

    expect(mockOnSearch).not.toHaveBeenCalled();

    fireEvent.changeText(input, '   ');

    fireEvent(input, 'submitEditing');

    expect(mockOnSearch).not.toHaveBeenCalled();
  });
});
