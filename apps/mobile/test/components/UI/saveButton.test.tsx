import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SaveButton from '../../../components/UI/saveButton';

describe('SaveButton', () => {
  it('renders correctly with saved=false', () => {
    const { getByTestId } = render(<SaveButton saved={false} onPress={() => {}} />);

    const button = getByTestId('save-button');

    expect(button).toBeTruthy();
  });

  it('shows bookmark-outline icon when not saved', () => {
    const { getByTestId } = render(<SaveButton saved={false} onPress={() => {}} />);

    const icon = getByTestId('save-button').findByProps({ name: 'bookmark-outline' });

    expect(icon).toBeTruthy();
  });

  it('shows bookmark icon when saved', () => {
    const { getByTestId } = render(<SaveButton saved={true} onPress={() => {}} />);

    const icon = getByTestId('save-button').findByProps({ name: 'bookmark' });

    expect(icon).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();

    const { getByTestId } = render(<SaveButton saved={false} onPress={onPressMock} />);

    fireEvent.press(getByTestId('save-button'));

    expect(onPressMock).toHaveBeenCalled();
  });
});
