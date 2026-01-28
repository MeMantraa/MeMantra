import React from 'react';
import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import AppText, { styles } from '../../../components/UI/textWrapper';

describe('AppText Component', () => {
  afterEach(() => {
    // Reset Platform.OS after each test
    Object.defineProperty(Platform, 'OS', {
      value: 'ios',
      configurable: true,
    });
  });

  it('renders text with correct content', () => {
    const { getByText } = render(<AppText>Hello World</AppText>);
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('applies custom className', () => {
    const { getByText } = render(<AppText className="text-lg font-bold">Styled Text</AppText>);
    expect(getByText('Styled Text')).toBeTruthy();
  });

  it('applies custom style prop', () => {
    const { getByText } = render(<AppText style={{ color: 'red' }}>Colored Text</AppText>);
    expect(getByText('Colored Text')).toBeTruthy();
  });

  it('applies Android-specific styles on Android platform', () => {
    Object.defineProperty(Platform, 'OS', {
      value: 'android',
      configurable: true,
    });

    const { getByText } = render(<AppText>Android Text</AppText>);
    const node = getByText('Android Text');

    expect(node).toHaveStyle(styles.androidTextFix);
  });

  it('does NOT apply Android-specific styles on iOS platform', () => {
    Object.defineProperty(Platform, 'OS', {
      value: 'ios',
      configurable: true,
    });

    const { getByText } = render(<AppText>iOS Text</AppText>);
    const node = getByText('iOS Text');

    expect(node).not.toHaveStyle(styles.androidTextFix);
  });
});
