import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { FeatureEnabled } from '../../components/FeatureEnabled';
import { storage } from '../../utils/storage';

jest.mock('../../utils/storage');

describe('FeatureEnabled', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when user has the feature flag', async () => {
    (storage.getUserData as jest.Mock).mockResolvedValue({
      user_id: 1,
      username: 'testuser',
      feature_flags: ['DARK_MODE', 'EXPERIMENTAL_FEATURE'],
    });

    const { findByText } = render(
      <NavigationContainer>
        <FeatureEnabled featureFlag="DARK_MODE">
          <Text>Dark Mode Content</Text>
        </FeatureEnabled>
      </NavigationContainer>,
    );

    expect(await findByText('Dark Mode Content')).toBeTruthy();
  });

  it('should render fallback when user does not have the feature flag', async () => {
    (storage.getUserData as jest.Mock).mockResolvedValue({
      user_id: 1,
      username: 'testuser',
      feature_flags: ['EXPERIMENTAL_FEATURE'],
    });

    const { findByText, queryByText } = render(
      <NavigationContainer>
        <FeatureEnabled featureFlag="DARK_MODE" fallback={<Text>Feature Not Available</Text>}>
          <Text>Dark Mode Content</Text>
        </FeatureEnabled>
      </NavigationContainer>,
    );

    expect(await findByText('Feature Not Available')).toBeTruthy();
    expect(queryByText('Dark Mode Content')).toBeNull();
  });

  it('should render null when user does not have flag and no fallback provided', async () => {
    (storage.getUserData as jest.Mock).mockResolvedValue({
      user_id: 1,
      username: 'testuser',
      feature_flags: [],
    });

    const { queryByText } = render(
      <NavigationContainer>
        <FeatureEnabled featureFlag="DARK_MODE">
          <Text>Dark Mode Content</Text>
        </FeatureEnabled>
      </NavigationContainer>,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(queryByText('Dark Mode Content')).toBeNull();
  });

  it('should handle user with no feature_flags property', async () => {
    (storage.getUserData as jest.Mock).mockResolvedValue({
      user_id: 1,
      username: 'testuser',
    });

    const { queryByText } = render(
      <NavigationContainer>
        <FeatureEnabled featureFlag="DARK_MODE">
          <Text>Dark Mode Content</Text>
        </FeatureEnabled>
      </NavigationContainer>,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(queryByText('Dark Mode Content')).toBeNull();
  });

  it('should handle null user data', async () => {
    (storage.getUserData as jest.Mock).mockResolvedValue(null);

    const { queryByText } = render(
      <NavigationContainer>
        <FeatureEnabled featureFlag="DARK_MODE">
          <Text>Dark Mode Content</Text>
        </FeatureEnabled>
      </NavigationContainer>,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(queryByText('Dark Mode Content')).toBeNull();
  });

  it('should handle undefined user data', async () => {
    (storage.getUserData as jest.Mock).mockResolvedValue(undefined);

    const { queryByText } = render(
      <NavigationContainer>
        <FeatureEnabled featureFlag="EXPERIMENTAL_FEATURE">
          <Text>Experimental Content</Text>
        </FeatureEnabled>
      </NavigationContainer>,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(queryByText('Experimental Content')).toBeNull();
  });

  it('should handle empty feature_flags array', async () => {
    (storage.getUserData as jest.Mock).mockResolvedValue({
      user_id: 1,
      username: 'testuser',
      feature_flags: [],
    });

    const { queryByText } = render(
      <NavigationContainer>
        <FeatureEnabled featureFlag="ADVANCED_ANALYTICS" fallback={<Text>Not Available</Text>}>
          <Text>Analytics Content</Text>
        </FeatureEnabled>
      </NavigationContainer>,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(queryByText('Not Available')).toBeTruthy();
    expect(queryByText('Analytics Content')).toBeNull();
  });
});
