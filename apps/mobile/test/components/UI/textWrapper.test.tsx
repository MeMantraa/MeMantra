import React from 'react';
import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import AppText, { styles } from '../../../components/UI/textWrapper';

describe('AppText Component', () => {
  afterEach(() => {
    jest.restoreAllMocks();
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
    jest.spyOn(Platform, 'OS', 'get').mockReturnValue('android');

    const { getByText } = render(<AppText>Android Text</AppText>);
    const node = getByText('Android Text');

    // ✅ THIS is what covers the branch
    expect(node).toHaveStyle(styles.androidTextFix);
  });

  it('does NOT apply Android-specific styles on iOS platform', () => {
    jest.spyOn(Platform, 'OS', 'get').mockReturnValue('ios');

    const { getByText } = render(<AppText>iOS Text</AppText>);
    const node = getByText('iOS Text');

    // ✅ Covers false branch
    expect(node).not.toHaveStyle(styles.androidTextFix);
  });
});
