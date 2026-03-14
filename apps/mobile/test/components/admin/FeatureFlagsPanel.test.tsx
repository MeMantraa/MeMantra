import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import FeatureFlagsPanel from '../../../components/admin/FeatureFlagsPanel';

const defaultProps = {
  colors: {
    primaryDark: '#111111',
    secondary: '#eeeeee',
    text: '#ffffff',
  },
  loading: false,
  submitting: false,
  flags: [
    { key: 'DARK_MODE', label: 'Dark Mode', description: 'Enable dark mode' },
    { key: 'ADVANCED_ANALYTICS', label: 'Advanced Analytics' },
  ],
  selectedFlagKey: 'DARK_MODE',
  rolloutPercentage: '25',
  userSearchQuery: '',
  users: [
    {
      user_id: 1,
      username: 'alice',
      email: 'alice@example.com',
      feature_flags: ['DARK_MODE'],
    },
    {
      user_id: 2,
      username: 'bob',
      email: 'bob@example.com',
      feature_flags: [],
    },
  ],
  selectedUserIds: [1],
  onSelectFlag: jest.fn(),
  onChangeRolloutPercentage: jest.fn(),
  onApplyRollout: jest.fn(),
  onEnableAll: jest.fn(),
  onDisableAll: jest.fn(),
  onToggleUserFlag: jest.fn(),
  onToggleUserSelection: jest.fn(),
  onSelectAllUsers: jest.fn(),
  onClearUserSelection: jest.fn(),
  onApplySelectedUsers: jest.fn(),
  onChangeUserSearchQuery: jest.fn(),
};

describe('FeatureFlagsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a loading spinner while data is loading', () => {
    const { queryByText } = render(<FeatureFlagsPanel {...defaultProps} loading />);
    expect(queryByText('Flag List')).toBeNull();
  });

  it('emits handlers for flag, rollout, global, selection, and per-user actions', () => {
    const { getByText, getByDisplayValue, getByPlaceholderText } = render(
      <FeatureFlagsPanel {...defaultProps} />,
    );

    fireEvent.press(getByText('Advanced Analytics'));
    expect(defaultProps.onSelectFlag).toHaveBeenCalledWith('ADVANCED_ANALYTICS');

    fireEvent.changeText(getByDisplayValue('25'), '60');
    fireEvent.press(getByText('Apply Rollout'));
    expect(defaultProps.onChangeRolloutPercentage).toHaveBeenCalledWith('60');
    expect(defaultProps.onApplyRollout).toHaveBeenCalledWith('DARK_MODE');

    fireEvent.press(getByText('Enable All'));
    expect(defaultProps.onEnableAll).toHaveBeenCalledWith('DARK_MODE');

    fireEvent.press(getByText('Disable All'));
    expect(defaultProps.onDisableAll).toHaveBeenCalledWith('DARK_MODE');

    fireEvent.changeText(getByPlaceholderText('Search users here'), 'alice');
    expect(defaultProps.onChangeUserSearchQuery).toHaveBeenCalledWith('alice');

    fireEvent.press(getByText('Select Filtered'));
    expect(defaultProps.onSelectAllUsers).toHaveBeenCalledWith([1, 2]);

    fireEvent.press(getByText('Clear Selection'));
    expect(defaultProps.onClearUserSelection).toHaveBeenCalled();

    fireEvent.press(getByText('Assign to Selected'));
    expect(defaultProps.onApplySelectedUsers).toHaveBeenCalledWith('DARK_MODE', true);

    fireEvent.press(getByText('Unassign from Selected'));
    expect(defaultProps.onApplySelectedUsers).toHaveBeenCalledWith('DARK_MODE', false);

    fireEvent.press(getByText('Selected'));
    expect(defaultProps.onToggleUserSelection).toHaveBeenCalledWith(1);

    fireEvent.press(getByText('Unassign Selected Flag'));
    expect(defaultProps.onToggleUserFlag).toHaveBeenCalledWith(1, 'DARK_MODE', false);

    fireEvent.press(getByText('Assign Selected Flag'));
    expect(defaultProps.onToggleUserFlag).toHaveBeenCalledWith(2, 'DARK_MODE', true);
  });

  it('filters the selected-users action against the current search', () => {
    const { getByText } = render(
      <FeatureFlagsPanel {...defaultProps} userSearchQuery="alice" selectedUserIds={[]} />,
    );

    fireEvent.press(getByText('Select Filtered'));
    expect(defaultProps.onSelectAllUsers).toHaveBeenCalledWith([1]);
  });
});
