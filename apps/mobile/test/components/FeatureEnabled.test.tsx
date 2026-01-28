import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { FeatureEnabled } from '../../components/FeatureEnabled';
import { storage } from '../../utils/storage';

jest.mock('../../utils/storage');

describe('FeatureEnabled', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when user has the feature flag', async () => {
    (storage.getUserData as jest.Mock).mockResolvedValue({
      username: 'testuser',
      feature_flags: ['DARK_MODE', 'EXPERIMENTAL_FEATURE'],
    });

    const { findByText } = render(
      <FeatureEnabled featureFlag="DARK_MODE">
        <Text>Dark Mode Content</Text>
      </FeatureEnabled>
    );

    const content = await findByText('Dark Mode Content');
    expect(content).toBeTruthy();
  });

  it('should render fallback when user does not have the feature flag', async () => {
    (storage.getUserData as jest.Mock).mockResolvedValue({
      username: 'testuser',
      feature_flags: ['EXPERIMENTAL_FEATURE'],
    });

    const { getByText, queryByText } = render(
      <FeatureEnabled featureFlag="DARK_MODE" fallback={<Text>Fallback Content</Text>}>
        <Text>Dark Mode Content</Text>
      </FeatureEnabled>
    );

    await waitFor(() => {
      expect(queryByText('Dark Mode Content')).toBeNull();
      expect(getByText('Fallback Content')).toBeTruthy();
    });
  });

  it('should render nothing when no fallback is provided and flag is missing', async () => {
    (storage.getUserData as jest.Mock).mockResolvedValue({
      username: 'testuser',
      feature_flags: [],
    });

    const { queryByText } = render(
      <FeatureEnabled featureFlag="DARK_MODE">
        <Text>Dark Mode Content</Text>
      </FeatureEnabled>
    );

    await waitFor(() => {
      expect(queryByText('Dark Mode Content')).toBeNull();
    });
  });

  it('should handle user with no feature_flags array', async () => {
    (storage.getUserData as jest.Mock).mockResolvedValue({
      username: 'testuser',
    });

    const { queryByText } = render(
      <FeatureEnabled featureFlag="DARK_MODE">
        <Text>Dark Mode Content</Text>
      </FeatureEnabled>
    );

    await waitFor(() => {
      expect(queryByText('Dark Mode Content')).toBeNull();
    });
  });

  it('should handle null user data', async () => {
    (storage.getUserData as jest.Mock).mockResolvedValue(null);

    const { queryByText } = render(
      <FeatureEnabled featureFlag="DARK_MODE">
        <Text>Dark Mode Content</Text>
      </FeatureEnabled>
    );

    await waitFor(() => {
      expect(queryByText('Dark Mode Content')).toBeNull();
    });
  });

  it('should cleanup on unmount', async () => {
    (storage.getUserData as jest.Mock).mockResolvedValue({
      username: 'testuser',
      feature_flags: ['DARK_MODE'],
    });

    const { unmount } = render(
      <FeatureEnabled featureFlag="DARK_MODE">
        <Text>Dark Mode Content</Text>
      </FeatureEnabled>
    );

    unmount();
  });
});
