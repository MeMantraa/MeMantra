import React from 'react';
import { View } from 'react-native';
import { render } from '@testing-library/react-native';
import DeepDiveCard from '../../../components/deepDive/DeepDiveCard';

jest.mock('../../../components/UI/textWrapper', () => {
  const { Text } = jest.requireActual('react-native');
  return ({ children, ...props }: any) => <Text {...props}>{children}</Text>;
});

describe('DeepDiveCard', () => {
  it('renders uppercase label and child content', () => {
    const { getByText } = render(
      <DeepDiveCard label="Summary" accentColor="#ff8800" textColor="#ffffff" borderColor="#222222">
        <View>
          <View />
        </View>
      </DeepDiveCard>,
    );

    expect(getByText('SUMMARY')).toBeTruthy();
  });

  it('uses accent label color when not muted', () => {
    const { getByText } = render(
      <DeepDiveCard label="Example" accentColor="#00ff00" textColor="#ffffff" borderColor="#222222">
        <View />
      </DeepDiveCard>,
    );

    const label = getByText('EXAMPLE');
    expect(label.props.style.color).toBe('#00ff00');
    expect(label.props.style.opacity).toBe(0.9);
  });

  it('renders without label when label is omitted', () => {
    const { queryByText } = render(
      <DeepDiveCard accentColor="#00ff00" textColor="#ffffff" borderColor="#222222">
        <View />
      </DeepDiveCard>,
    );

    expect(queryByText('SUMMARY')).toBeNull();
    expect(queryByText('EXPLANATION')).toBeNull();
    expect(queryByText('EXAMPLE')).toBeNull();
  });

  it('uses text label color when muted', () => {
    const { getByText } = render(
      <DeepDiveCard
        label="References"
        muted
        accentColor="#00ff00"
        textColor="#cccccc"
        borderColor="#222222"
      >
        <View />
      </DeepDiveCard>,
    );

    const label = getByText('REFERENCES');
    expect(label.props.style.color).toBe('#cccccc');
    expect(label.props.style.opacity).toBe(0.72);
  });
});
