import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LikeButton from '../../../components/UI/likeButton';

jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({ colors: { secondary: 'red', text: 'black' } }),
}));

describe('LikeButton', () => {
  it('renders correctly with liked=false', () => {
    const { getByTestId } = render(<LikeButton liked={false} onPress={() => {}} />);

    const button = getByTestId('like-button');

    expect(button).toBeTruthy();
  });

  it('shows heart-outline icon and text color when not liked', () => {
    const { getByTestId } = render(<LikeButton liked={false} onPress={() => {}} />);

    const button = getByTestId('like-button');

    const icon = button.findByProps({ name: 'heart-outline' });

    expect(icon.props.color).toBe('black');
  });

  it('shows heart icon and secondary color when liked', () => {
    const { getByTestId } = render(<LikeButton liked={true} onPress={() => {}} />);

    const button = getByTestId('like-button');

    const icon = button.findByProps({ name: 'heart' });

    expect(icon.props.color).toBe('red');
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();

    const { getByTestId } = render(<LikeButton liked={false} onPress={onPressMock} />);

    fireEvent.press(getByTestId('like-button'));

    expect(onPressMock).toHaveBeenCalled();
  });
});
