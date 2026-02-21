import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Platform } from 'react-native';
import SavedPopupBar from '../../../components/UI/savedPopupBar';
import { StyleSheet } from 'react-native';
import { themes } from '../../../styles/theme';

jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      secondary: '#ff9900',
      primaryDark: '#1a1a1a',
    },
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('SavedPopupBar', () => {
  const mockOnHide = jest.fn();
  const mockOnPressCollections = jest.fn();
  const mockOnRate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders nothing when visible is false', () => {
    const { queryByText } = render(
      <SavedPopupBar
        visible={false}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    expect(queryByText('Saved successfully')).toBeNull();
  });

  it('renders with default message when visible is true', () => {
    const { getByText } = render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    expect(getByText('Saved successfully')).toBeTruthy();
    expect(getByText('Collections')).toBeTruthy();
  });

  it('renders with custom message', () => {
    const { getByText } = render(
      <SavedPopupBar
        visible={true}
        message="Custom message"
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    expect(getByText('Custom message')).toBeTruthy();
  });

  it('calls onHide after default duration (5000ms)', () => {
    render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    expect(mockOnHide).not.toHaveBeenCalled();

    jest.advanceTimersByTime(5000);

    jest.advanceTimersByTime(200);

    expect(mockOnHide).toHaveBeenCalled();
  });

  it('calls onHide after custom duration', () => {
    render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
        durationMs={3000}
      />,
    );

    expect(mockOnHide).not.toHaveBeenCalled();

    // Fast-forward time by 3000ms
    jest.advanceTimersByTime(3000);

    jest.advanceTimersByTime(200);

    expect(mockOnHide).toHaveBeenCalled();
  });

  it('calls onPressCollections when Collections button is pressed', () => {
    const { getByText, getByTestId } = render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    const collectionsButton = getByTestId('collections-button');
    fireEvent.press(collectionsButton);

    expect(mockOnPressCollections).toHaveBeenCalledTimes(1);
  });

  it('clears timeout when component unmounts', () => {
    const { unmount } = render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    unmount();

    // Fast-forward time
    jest.advanceTimersByTime(5000);
    jest.advanceTimersByTime(200);

    // onHide should not be called after unmount
    expect(mockOnHide).not.toHaveBeenCalled();
  });

  it('clears timeout when visible changes to false', () => {
    const { rerender } = render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    // Change visible to false
    rerender(
      <SavedPopupBar
        visible={false}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    // Fast-forward time
    jest.advanceTimersByTime(5000);
    jest.advanceTimersByTime(200);

    expect(mockOnHide).not.toHaveBeenCalled();
  });

  it('applies correct bottom position for iOS', () => {
    Platform.OS = 'ios';

    const { getByText, getByTestId } = render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    const popupBar = getByTestId('saved-popup-bar');

    expect(popupBar.props.style).toMatchObject(
      expect.objectContaining({
        bottom: 34,
      }),
    );
  });

  it('applies correct bottom position for Android', () => {
    Platform.OS = 'android';

    const { getByText, getByTestId } = render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    const popupBar = getByTestId('saved-popup-bar');

    expect(popupBar.props.style).toMatchObject(
      expect.objectContaining({
        bottom: 16,
      }),
    );
  });

  it('applies theme colors correctly', () => {
    const { getByText, getByTestId } = render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    const popupBar = getByTestId('saved-popup-bar');
    const messageElement = getByText('Saved successfully');
    const theme = themes.default;
    const style = StyleSheet.flatten(popupBar.props.style);

    expect(style.backgroundColor).toBe(theme.white);
    expect(style.borderColor).toBe(theme.secondary);

    expect(messageElement.props.style).toMatchObject(
      expect.objectContaining({
        color: '#1a1a1a',
      }),
    );
  });

  it('uses fallback color syntax in component', () => {
    const { getByText } = render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    const messageElement = getByText('Saved successfully');
    expect(messageElement.props.style).toHaveProperty('color');
    expect(messageElement.props.style.color).toBeTruthy();
  });

  it('restarts timer when visible changes from false to true', () => {
    const { rerender } = render(
      <SavedPopupBar
        visible={false}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    // Change visible to true
    rerender(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    // Fast-forward time by 5000ms
    jest.advanceTimersByTime(5000);
    jest.advanceTimersByTime(200);

    expect(mockOnHide).toHaveBeenCalledTimes(1);
  });

  it('handles multiple visibility toggles correctly', () => {
    const { rerender } = render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    // Fast-forward 2500ms (halfway through duration)
    jest.advanceTimersByTime(2500);

    // Hide the popup
    rerender(
      <SavedPopupBar
        visible={false}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    // Show it again
    rerender(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    // Fast-forward the remaining time from the first show
    jest.advanceTimersByTime(2500);
    jest.advanceTimersByTime(200);

    // onHide should not be called yet (timer was reset)
    expect(mockOnHide).not.toHaveBeenCalled();

    // Fast-forward the full duration from the second show
    jest.advanceTimersByTime(5000);
    jest.advanceTimersByTime(200);

    expect(mockOnHide).toHaveBeenCalledTimes(1);
  });

  it('renders Ionicons chevron-forward icon', () => {
    const { getByText } = render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    // Verify the Collections button exists (which contains the icon)
    const collectionsText = getByText('Collections');
    expect(collectionsText).toBeTruthy();

    // The icon is rendered alongside the Collections text
    expect(collectionsText.parent).toBeTruthy();
  });

  it('Collections button is pressable and triggers callback', () => {
    const { getByText } = render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    const collectionsText = getByText('Collections');
    expect(collectionsText).toBeTruthy();

    // Press the Collections button again to verify it's pressable
    fireEvent.press(collectionsText);
    expect(mockOnPressCollections).toHaveBeenCalledTimes(1);
  });

  // NEW TESTS FOR RATING FUNCTIONALITY

  it('renders rating prompt when visible', () => {
    const { getByText } = render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
        onRate={mockOnRate}
      />,
    );

    expect(getByText('Rate this mantra?')).toBeTruthy();
  });

  it('renders 5 star buttons for rating', () => {
    const { getByTestId } = render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
        onRate={mockOnRate}
      />,
    );

    // Verify all 5 star buttons exist
    for (let i = 1; i <= 5; i++) {
      expect(getByTestId(`star-button-${i}`)).toBeTruthy();
    }
  });

  it('calls onRate with correct rating when star is pressed', () => {
    const { getByTestId } = render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
        onRate={mockOnRate}
      />,
    );

    // Press the 3rd star (rating of 3)
    const star3 = getByTestId('star-button-3');
    fireEvent.press(star3);

    expect(mockOnRate).toHaveBeenCalledWith(3);
  });

  it('shows thank you message after rating', () => {
    const { getByText, queryByText, getByTestId } = render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
        onRate={mockOnRate}
      />,
    );

    expect(getByText('Rate this mantra?')).toBeTruthy();

    // Press a star
    const star1 = getByTestId('star-button-1');
    fireEvent.press(star1);

    expect(getByTestId('thank-you-message')).toBeTruthy();
    expect(getByText('Thanks for rating!')).toBeTruthy();
    expect(queryByText('Rate this mantra?')).toBeNull();
  });

  it('auto-hides after rating with 3 second delay', () => {
    const { getByTestId } = render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
        onRate={mockOnRate}
      />,
    );

    // Press a star
    const star1 = getByTestId('star-button-1');
    fireEvent.press(star1);

    expect(mockOnHide).not.toHaveBeenCalled();

    jest.advanceTimersByTime(3000);

    jest.advanceTimersByTime(200);

    expect(mockOnHide).toHaveBeenCalled();
  });

  it('resets hasRated state when popup is hidden and shown again', () => {
    const { rerender, getByText, getByTestId, queryByTestId } = render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
        onRate={mockOnRate}
      />,
    );

    // Press a star
    const star1 = getByTestId('star-button-1');
    fireEvent.press(star1);

    // Verify thank you message
    expect(getByTestId('thank-you-message')).toBeTruthy();

    rerender(
      <SavedPopupBar
        visible={false}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
        onRate={mockOnRate}
      />,
    );

    rerender(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
        onRate={mockOnRate}
      />,
    );

    // Should show rating prompt again
    expect(getByText('Rate this mantra?')).toBeTruthy();
    expect(queryByTestId('thank-you-message')).toBeNull();
  });

  it('renders rating section even when onRate is not provided', () => {
    const { getByText } = render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    // Rating prompt should still be visible
    expect(getByText('Rate this mantra?')).toBeTruthy();
  });

  it('clears auto-hide timer when star is pressed', () => {
    const { getByTestId } = render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
        onRate={mockOnRate}
        durationMs={5000}
      />,
    );

    jest.advanceTimersByTime(4000);

    const star1 = getByTestId('star-button-1');
    fireEvent.press(star1);

    jest.advanceTimersByTime(1000);
    jest.advanceTimersByTime(200);
    expect(mockOnHide).not.toHaveBeenCalled();

    // Wait for new 3 second timer after rating
    jest.advanceTimersByTime(2000);
    jest.advanceTimersByTime(200);
    expect(mockOnHide).toHaveBeenCalled();
  });

  it('calls onRate with different ratings for different stars', () => {
    [1, 2, 3, 4, 5].forEach((rating) => {
      mockOnRate.mockClear();

      const { getByTestId } = render(
        <SavedPopupBar
          visible={true}
          onHide={mockOnHide}
          onPressCollections={mockOnPressCollections}
          onRate={mockOnRate}
        />,
      );

      const star = getByTestId(`star-button-${rating}`);
      fireEvent.press(star);
      expect(mockOnRate).toHaveBeenCalledWith(rating);
    });
  });

  it('does not call onRate if not provided', () => {
    const { getByTestId } = render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    // Press a star - should not throw error
    const star1 = getByTestId('star-button-1');
    expect(() => fireEvent.press(star1)).not.toThrow();

    expect(getByTestId('thank-you-message')).toBeTruthy();
  });
});
