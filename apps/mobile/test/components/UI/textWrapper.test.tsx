import React from 'react';
import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import AppText from '../../../components/UI/textWrapper';

describe('AppText Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(getByText('Android Text')).toBeTruthy();
    jest.restoreAllMocks();
  });

  it('renders without Android-specific styles on iOS platform', () => {
    jest.spyOn(Platform, 'OS', 'get').mockReturnValue('ios');
    const { getByText } = render(<AppText>iOS Text</AppText>);
    expect(getByText('iOS Text')).toBeTruthy();
    jest.restoreAllMocks();
  });
});
