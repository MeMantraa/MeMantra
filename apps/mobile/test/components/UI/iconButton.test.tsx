import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View } from 'react-native';
import IconButton from '../../../components/UI/iconButton';
import { useTheme } from '../../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

jest.mock('../../../context/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

describe('IconButton Component', () => {
  const mockOnPress = jest.fn();

  const mockColors = {
    primaryDark: '#123456',
    secondary: '#abcdef',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useTheme as jest.Mock).mockReturnValue({ colors: mockColors });
  });

  it('renders like button (inactive) correctly', () => {
    const { getByTestId, UNSAFE_getByType } = render(
      <IconButton type="like" onPress={mockOnPress} />,
    );

    const button = getByTestId('like-button');

    expect(button).toBeTruthy();

    const icon = UNSAFE_getByType(Ionicons);

    expect(icon.props.name).toBe('heart-outline');

    expect(icon.props.color).toBe('#F5E6D3');
  });

  it('renders like button (active) with heart icon and theme color', () => {
    const { UNSAFE_getByType } = render(<IconButton type="like" active onPress={mockOnPress} />);

    const icon = UNSAFE_getByType(Ionicons);

    expect(icon.props.name).toBe('heart');

    expect(icon.props.color).toBe(mockColors.secondary);
  });

  it('renders save button (inactive) correctly', () => {
    const { getByTestId, UNSAFE_getByType } = render(
      <IconButton type="save" onPress={mockOnPress} />,
    );

    const button = getByTestId('save-button');

    expect(button).toBeTruthy();

    const icon = UNSAFE_getByType(Ionicons);

    expect(icon.props.name).toBe('bookmark-outline');

    expect(icon.props.color).toBe('white');
  });

  it('renders save button (active) correctly', () => {
    const { UNSAFE_getByType } = render(<IconButton type="save" active onPress={mockOnPress} />);

    const icon = UNSAFE_getByType(Ionicons);

    expect(icon.props.name).toBe('bookmark');
  });

  it('renders profile button with correct icon, color, and testID', () => {
    const { getByTestId, UNSAFE_getByType } = render(
      <IconButton type="profile" onPress={mockOnPress} />,
    );

    const button = getByTestId('profile-btn');

    expect(button).toBeTruthy();

    const icon = UNSAFE_getByType(Ionicons);

    expect(icon.props.name).toBe('person-outline');

    expect(icon.props.color).toBe(mockColors.primaryDark);
  });

  it('calls onPress when pressed', () => {
    const { getByTestId } = render(<IconButton type="like" onPress={mockOnPress} />);

    fireEvent.press(getByTestId('like-button'));

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('applies custom testID when provided', () => {
    const { getByTestId } = render(
      <IconButton type="save" testID="custom-save" onPress={mockOnPress} />,
    );

    expect(getByTestId('custom-save')).toBeTruthy();
  });

  it('renders default icon for unknown type', () => {
    const { UNSAFE_getByType } = render(
      <IconButton type={'unknown' as any} onPress={mockOnPress} />,
    );

    const icon = UNSAFE_getByType(Ionicons);

    expect(icon.props.name).toBe('help-outline');

    expect(icon.props.color).toBe('white');
  });

  it('renders share button correctly', () => {
    const { getByTestId, UNSAFE_getByType } = render(
      <IconButton type="share" onPress={mockOnPress} />,
    );

    expect(getByTestId('share-button')).toBeTruthy();

    const icon = UNSAFE_getByType(Ionicons);
    expect(icon.props.name).toBe('paper-plane-outline');
    expect(icon.props.color).toBe('white');
  });

  it('renders journal button correctly', () => {
    const { getByTestId, UNSAFE_getByType } = render(
      <IconButton type="journal" onPress={mockOnPress} />,
    );

    expect(getByTestId('journal-button')).toBeTruthy();

    const icon = UNSAFE_getByType(Ionicons);
    expect(icon.props.name).toBe('book-outline');
    expect(icon.props.color).toBe('white');
  });

  it('renders reminder button (inactive) correctly', () => {
    const { getByTestId, UNSAFE_getByType } = render(
      <IconButton type="reminder" onPress={mockOnPress} />,
    );

    expect(getByTestId('reminder-button')).toBeTruthy();

    const icon = UNSAFE_getByType(Ionicons);
    expect(icon.props.name).toBe('notifications-outline');
    expect(icon.props.color).toBe('white');
  });

  it('renders reminder button (active) with filled icon and theme color', () => {
    const { UNSAFE_getByType } = render(
      <IconButton type="reminder" active onPress={mockOnPress} />,
    );

    const icon = UNSAFE_getByType(Ionicons);
    expect(icon.props.name).toBe('notifications');
    expect(icon.props.color).toBe(mockColors.secondary);
  });

  // Size prop tests
  it('renders button with normal size by default', () => {
    const { UNSAFE_getByType, UNSAFE_getAllByType } = render(
      <IconButton type="like" onPress={mockOnPress} />,
    );

    const icon = UNSAFE_getByType(Ionicons);
    const views = UNSAFE_getAllByType(View);

    // Find the circular button View (the one with borderRadius)
    const buttonView = views.find(
      (v: any) =>
        v.props.style &&
        typeof v.props.style === 'object' &&
        v.props.style.width === 55 &&
        v.props.style.height === 55,
    );

    expect(buttonView).toBeTruthy();
    expect(icon.props.size).toBe(35);
  });

  it('renders button with small size when size="small" is passed', () => {
    const { UNSAFE_getByType, UNSAFE_getAllByType } = render(
      <IconButton type="like" onPress={mockOnPress} size="small" />,
    );

    const icon = UNSAFE_getByType(Ionicons);
    const views = UNSAFE_getAllByType(View);

    // Find the circular button View with small size (55 * 0.7 = 38.5)
    const buttonView = views.find(
      (v: any) =>
        v.props.style &&
        typeof v.props.style === 'object' &&
        v.props.style.width === 38.5 &&
        v.props.style.height === 38.5,
    );

    expect(buttonView).toBeTruthy();
    expect(icon.props.size).toBe(28); // 35 * 0.7
  });

  it('applies size multiplier correctly for small share button', () => {
    const { UNSAFE_getByType, UNSAFE_getAllByType } = render(
      <IconButton type="share" onPress={mockOnPress} size="small" />,
    );

    const icon = UNSAFE_getByType(Ionicons);
    const views = UNSAFE_getAllByType(View);

    const buttonView = views.find(
      (v: any) =>
        v.props.style &&
        typeof v.props.style === 'object' &&
        Math.abs(v.props.style.width - 38.5) < 0.1, // Account for floating point
    );

    expect(buttonView).toBeTruthy();
    expect(icon.props.size).toBe(28);
  });

  it('renders small reminder button correctly', () => {
    const { UNSAFE_getByType } = render(
      <IconButton type="reminder" onPress={mockOnPress} size="small" active />,
    );

    const icon = UNSAFE_getByType(Ionicons);
    expect(icon.props.name).toBe('notifications');
    expect(icon.props.color).toBe(mockColors.secondary);
    expect(icon.props.size).toBe(28);
  });
});
