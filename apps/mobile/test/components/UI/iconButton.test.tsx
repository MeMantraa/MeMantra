import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
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
    const { UNSAFE_getByType } = render(<IconButton type="unknown" onPress={mockOnPress} />);

    const icon = UNSAFE_getByType(Ionicons);

    expect(icon.props.name).toBe('help-outline');

    expect(icon.props.color).toBe('white');
  });
});
