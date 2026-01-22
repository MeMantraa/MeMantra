import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TouchableOpacity } from 'react-native';
import TextButton from '../../../components/UI/textButton';

describe('TextButton Component', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the button text', () => {
    const { getByText } = render(<TextButton onPress={mockOnPress}>Login</TextButton>);

    expect(getByText('Login')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const { UNSAFE_getByType } = render(<TextButton onPress={mockOnPress}>Login</TextButton>);

    fireEvent.press(UNSAFE_getByType(TouchableOpacity));

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('passes disabled prop to TouchableOpacity', () => {
    const { UNSAFE_getByType } = render(
      <TextButton onPress={mockOnPress} disabled>
        Login
      </TextButton>,
    );

    expect(UNSAFE_getByType(TouchableOpacity).props.disabled).toBe(true);
  });

  it('applies textStyle overrides', () => {
    const { getByText } = render(
      <TextButton onPress={mockOnPress} textStyle={{ color: 'red', fontSize: 18 }}>
        Login
      </TextButton>,
    );

    expect(getByText('Login')).toHaveStyle({ color: 'red', fontSize: 18 });
  });
});
