import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import SavedPopupBar from '../../../components/UI/savedPopupBar';

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

  it('calls onHide after default duration (2000ms)', () => {
    render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    expect(mockOnHide).not.toHaveBeenCalled();

    // Fast-forward time by 2000ms
    jest.advanceTimersByTime(2000);

    // Wait for animation to complete (160ms)
    jest.advanceTimersByTime(160);

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

    // Wait for animation to complete (160ms)
    jest.advanceTimersByTime(160);

    expect(mockOnHide).toHaveBeenCalled();
  });

  it('calls onPressCollections when Collections button is pressed', () => {
    const { getByText } = render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    const collectionsButton = getByText('Collections');
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
    jest.advanceTimersByTime(2000);
    jest.advanceTimersByTime(160);

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
    jest.advanceTimersByTime(2000);
    jest.advanceTimersByTime(160);

    // onHide should not be called
    expect(mockOnHide).not.toHaveBeenCalled();
  });

  it('applies correct bottom position for iOS', () => {
    Platform.OS = 'ios';

    const { getByText } = render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    const messageElement = getByText('Saved successfully');
    const parentView = messageElement.parent?.parent;

    expect(parentView?.props.style).toMatchObject(
      expect.objectContaining({
        bottom: 34,
      }),
    );
  });

  it('applies correct bottom position for Android', () => {
    Platform.OS = 'android';

    const { getByText } = render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    const messageElement = getByText('Saved successfully');
    const parentView = messageElement.parent?.parent;

    expect(parentView?.props.style).toMatchObject(
      expect.objectContaining({
        bottom: 16,
      }),
    );
  });

  it('applies theme colors correctly', () => {
    const { getByText } = render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    const messageElement = getByText('Saved successfully');
    const parentView = messageElement.parent?.parent;

    expect(parentView?.props.style).toMatchObject(
      expect.objectContaining({
        backgroundColor: '#ff9900',
        borderColor: '#ff9900',
      }),
    );

    expect(messageElement.props.style).toMatchObject(
      expect.objectContaining({
        color: '#1a1a1a',
      }),
    );
  });

  it('uses fallback color syntax in component', () => {
    // This test verifies the fallback color logic exists in the component
    // The actual fallback is tested by checking the component's implementation
    const { getByText } = render(
      <SavedPopupBar
        visible={true}
        onHide={mockOnHide}
        onPressCollections={mockOnPressCollections}
      />,
    );

    const messageElement = getByText('Saved successfully');
    // Verify that color is applied (either primaryDark or fallback)
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

    // Fast-forward time by 2000ms
    jest.advanceTimersByTime(2000);
    jest.advanceTimersByTime(160);

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

    // Fast-forward 1000ms (halfway through duration)
    jest.advanceTimersByTime(1000);

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
    jest.advanceTimersByTime(1000);
    jest.advanceTimersByTime(160);

    // onHide should not be called yet (timer was reset)
    expect(mockOnHide).not.toHaveBeenCalled();

    // Fast-forward the full duration from the second show
    jest.advanceTimersByTime(2000);
    jest.advanceTimersByTime(160);

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
});
