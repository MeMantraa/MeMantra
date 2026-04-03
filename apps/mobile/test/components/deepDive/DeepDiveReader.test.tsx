import React from 'react';
import { ScrollView } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import DeepDiveReader from '../../../components/deepDive/DeepDiveReader';

jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#0f0f0f',
      primaryDark: '#1f1f1f',
      secondary: '#ff9966',
      text: '#f8f8f8',
    },
  }),
}));

jest.mock('../../../components/UI/textWrapper', () => {
  const { Text } = jest.requireActual('react-native');
  return ({ children, ...props }: any) => <Text {...props}>{children}</Text>;
});

describe('DeepDiveReader', () => {
  it('renders deep-dive sections for standard content', () => {
    const content =
      'This is the summary paragraph.\n\nThis is explanation paragraph one.\n\nFor example, try this tonight.';

    const { getByText, queryByText } = render(
      <DeepDiveReader title="Key Takeaway" content={content} />,
    );

    expect(getByText('DEEP DIVE')).toBeTruthy();
    expect(getByText('Key Takeaway')).toBeTruthy();
    expect(queryByText('SUMMARY')).toBeNull();
    expect(queryByText('EXPLANATION')).toBeNull();
    expect(queryByText('EXAMPLE')).toBeNull();

    expect(getByText('This is the summary paragraph.')).toBeTruthy();
    expect(
      getByText('This is explanation paragraph one.\n\nFor example, try this tonight.'),
    ).toBeTruthy();
    expect(getByText('For example, try this tonight.')).toBeTruthy();

    expect(queryByText('REFERENCES')).toBeNull();
  });

  it('renders references list when referencesOnly is true', () => {
    const content = 'Book A; Book B\nPaper C';
    const { getByText, queryByText } = render(
      <DeepDiveReader title="References" content={content} referencesOnly />,
    );

    expect(getByText('REFERENCES')).toBeTruthy();
    expect(getByText('Source 1')).toBeTruthy();
    expect(getByText('Source 2')).toBeTruthy();
    expect(getByText('Source 3')).toBeTruthy();
    expect(getByText('Book A')).toBeTruthy();
    expect(getByText('Book B')).toBeTruthy();
    expect(getByText('Paper C')).toBeTruthy();

    expect(queryByText('SUMMARY')).toBeNull();
    expect(queryByText('EXPLANATION')).toBeNull();
    expect(queryByText('EXAMPLE')).toBeNull();
  });

  it('calls focus and scroll callbacks', () => {
    const onToggleFocus = jest.fn();
    const onScrollStateChange = jest.fn();

    const { getByText, UNSAFE_getByType } = render(
      <DeepDiveReader
        title="Focus Title"
        content="Short content."
        onToggleFocus={onToggleFocus}
        onScrollStateChange={onScrollStateChange}
      />,
    );

    fireEvent.press(getByText('Focus Title'));
    expect(onToggleFocus).toHaveBeenCalledTimes(1);

    const scrollView = UNSAFE_getByType(ScrollView);
    fireEvent(scrollView, 'scrollBeginDrag');
    fireEvent(scrollView, 'momentumScrollBegin');
    fireEvent(scrollView, 'scrollEndDrag');
    fireEvent(scrollView, 'momentumScrollEnd');

    expect(onScrollStateChange).toHaveBeenNthCalledWith(1, true);
    expect(onScrollStateChange).toHaveBeenNthCalledWith(2, true);
    expect(onScrollStateChange).toHaveBeenNthCalledWith(3, false);
    expect(onScrollStateChange).toHaveBeenNthCalledWith(4, false);
  });
});
