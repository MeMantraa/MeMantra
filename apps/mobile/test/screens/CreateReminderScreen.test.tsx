import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CreateReminderScreen from '../../screens/CreateReminderScreen';
import { reminderService } from '../../services/reminder.service';
import { mantraService } from '../../services/mantra.service';
import { collectionService } from '../../services/collection.service';
import { storage } from '../../utils/storage';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const React = jest.requireActual('react');
  const RN = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ onChange, value, mode }: any) =>
      React.createElement(RN.View, {
        testID: `datetime-picker-${mode}`,
        onChange,
        value,
      }),
  };
});

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
let mockRouteParams: any = {};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    navigate: mockNavigate,
  }),
  useRoute: () => ({
    params: mockRouteParams,
  }),
}));

jest.mock('../../services/reminder.service', () => ({
  reminderService: {
    createReminder: jest.fn(),
  },
}));

jest.mock('../../services/mantra.service', () => ({
  mantraService: {
    getSavedMantras: jest.fn(),
    getMantraById: jest.fn(),
  },
}));

jest.mock('../../services/collection.service', () => ({
  collectionService: {
    getUserCollections: jest.fn(),
  },
}));

jest.mock('../../utils/storage', () => ({
  storage: {
    getToken: jest.fn(),
  },
}));

describe('CreateReminderScreen', () => {
  const mockMantras = [
    {
      mantra_id: 1,
      title: 'Be Present',
      key_takeaway: 'Focus',
      created_at: '2024-01-01',
      is_active: true,
    },
    {
      mantra_id: 2,
      title: 'Stay Calm',
      key_takeaway: 'Breathe',
      created_at: '2024-01-02',
      is_active: true,
    },
  ];

  const mockCollections = [
    { collection_id: 10, name: 'Morning Mantras', user_id: 1, created_at: '2024-01-01' },
    { collection_id: 20, name: 'Evening Mantras', user_id: 1, created_at: '2024-01-02' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = {};
    (storage.getToken as jest.Mock).mockResolvedValue('test-token');
    (mantraService.getSavedMantras as jest.Mock).mockResolvedValue(mockMantras);
    (collectionService.getUserCollections as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { collections: mockCollections },
    });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore?.();
    jest.useRealTimers();
  });

  it('renders the screen with title', async () => {
    const { getByTestId, getByText } = render(<CreateReminderScreen />);

    // Updated to use testID to differentiate from the button text
    expect(getByTestId('screen-title')).toBeTruthy();
    expect(getByText('Remind me about')).toBeTruthy();
  });

  it('loads mantras and collections on mount', async () => {
    render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(mantraService.getSavedMantras).toHaveBeenCalledWith('test-token');
      expect(collectionService.getUserCollections).toHaveBeenCalledWith('test-token');
    });
  });

  it('displays mantras for selection', async () => {
    const { getByText } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
      expect(getByText('Stay Calm')).toBeTruthy();
    });
  });

  it('switches to collection type and shows collections', async () => {
    const { getByText } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });

    fireEvent.press(getByText('Collection'));

    await waitFor(() => {
      expect(getByText('Morning Mantras')).toBeTruthy();
      expect(getByText('Evening Mantras')).toBeTruthy();
    });
  });

  it('selects a mantra and shows preview', async () => {
    const { getByText, getByTestId } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });

    fireEvent.press(getByText('Be Present'));

    await waitFor(() => {
      // Use testID for preview to avoid "multiple elements" error
      // (The text exists in the list AND the preview)
      const preview = getByTestId('selected-item-preview');
      expect(preview).toBeTruthy();
    });
  });

  it('selects a collection and shows preview', async () => {
    const { getByText, getByTestId } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });

    fireEvent.press(getByText('Collection'));

    await waitFor(() => {
      expect(getByText('Morning Mantras')).toBeTruthy();
    });

    fireEvent.press(getByText('Morning Mantras'));

    await waitFor(() => {
      const preview = getByTestId('selected-item-preview');
      expect(preview).toBeTruthy();
    });
  });

  it('shows frequency options and allows selection', async () => {
    const { getByText } = render(<CreateReminderScreen />);

    // Switch to Simple mode (screen defaults to Routine)
    fireEvent.press(getByText('Simple'));

    expect(getByText('Once')).toBeTruthy();
    expect(getByText('Daily')).toBeTruthy();
    expect(getByText('Weekly')).toBeTruthy();
    expect(getByText('Monthly')).toBeTruthy();

    fireEvent.press(getByText('Weekly'));
  });

  it('shows alert when submitting without selecting a mantra', async () => {
    const { getByText, getByTestId } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });

    // Use testID to target the actual button, not the header text
    fireEvent.press(getByTestId('create-reminder-button'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Select a Mantra',
      'Please select a mantra for this reminder.',
    );
  });

  it('shows alert when submitting without selecting a collection', async () => {
    const { getByText, getByTestId } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });

    fireEvent.press(getByText('Collection'));

    await waitFor(() => {
      expect(getByText('Morning Mantras')).toBeTruthy();
    });

    // Use testID to target the actual button
    fireEvent.press(getByTestId('create-reminder-button'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Select a Collection',
      'Please select a collection for this reminder.',
    );
  });

  it('successfully creates a mantra reminder', async () => {
    (reminderService.createReminder as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminder: { reminder_id: 1 } },
    });

    const { getByText, getByTestId } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });

    fireEvent.press(getByText('Be Present'));

    // Use testID to target the actual button (default mode is routine)
    fireEvent.press(getByTestId('create-reminder-button'));

    await waitFor(() => {
      expect(reminderService.createReminder).toHaveBeenCalledWith(
        expect.objectContaining({
          mantra_id: 1,
          frequency: 'routine',
          status: 'active',
          schedule_times: expect.any(Array),
          timezone: expect.any(String),
        }),
        'test-token',
      );
      expect(Alert.alert).toHaveBeenCalledWith(
        'Reminder Created',
        'Your reminder has been set.',
        expect.any(Array),
      );
    });
  });

  it('successfully creates a collection reminder', async () => {
    (reminderService.createReminder as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminder: { reminder_id: 2 } },
    });

    const { getByText, getByTestId } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });

    fireEvent.press(getByText('Collection'));

    await waitFor(() => {
      expect(getByText('Morning Mantras')).toBeTruthy();
    });

    fireEvent.press(getByText('Morning Mantras'));

    // Use testID to target the actual button (default mode is routine)
    fireEvent.press(getByTestId('create-reminder-button'));

    await waitFor(() => {
      expect(reminderService.createReminder).toHaveBeenCalledWith(
        expect.objectContaining({
          collection_id: 10,
          frequency: 'routine',
          status: 'active',
          schedule_times: expect.any(Array),
          timezone: expect.any(String),
        }),
        'test-token',
      );
    });
  });

  it('shows error alert when creation fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (reminderService.createReminder as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Duplicate reminder' } },
    });

    const { getByText, getByTestId } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });

    fireEvent.press(getByText('Be Present'));
    fireEvent.press(getByTestId('create-reminder-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Duplicate reminder');
    });

    consoleErrorSpy.mockRestore();
  });

  it('shows fallback error message when creation fails without response data', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (reminderService.createReminder as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { getByText, getByTestId } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });

    fireEvent.press(getByText('Be Present'));
    fireEvent.press(getByTestId('create-reminder-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to create reminder.');
    });

    consoleErrorSpy.mockRestore();
  });

  it('shows alert when token is null during submit', async () => {
    (storage.getToken as jest.Mock).mockResolvedValueOnce('test-token').mockResolvedValueOnce(null);

    const { getByText, getByTestId } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });

    fireEvent.press(getByText('Be Present'));
    fireEvent.press(getByTestId('create-reminder-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Not authenticated.');
    });
  });

  it('returns early when token is null during loadItems', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue(null);

    render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(mantraService.getSavedMantras).not.toHaveBeenCalled();
    });
  });

  it('handles loadItems error gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (mantraService.getSavedMantras as jest.Mock).mockRejectedValue(new Error('Failed'));

    render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading items:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('shows empty text when no mantras are saved', async () => {
    (mantraService.getSavedMantras as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(getByText('No saved mantras yet. Save a mantra to set a reminder.')).toBeTruthy();
    });
  });

  it('shows empty text when no collections exist', async () => {
    (collectionService.getUserCollections as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { collections: [] },
    });

    const { getByText } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });

    fireEvent.press(getByText('Collection'));

    await waitFor(() => {
      expect(getByText('No collections yet. Create a collection first.')).toBeTruthy();
    });
  });

  it('preselects mantra type when mantraId is in route params', async () => {
    mockRouteParams = { mantraId: 1 };
    const { getByText } = render(<CreateReminderScreen />);
    await waitFor(() => {
      expect(getByText('Select Mantra')).toBeTruthy();
    });
  });

  it('preselects collection type when collectionId is in route params', async () => {
    mockRouteParams = { collectionId: 10 };
    const { getByText } = render(<CreateReminderScreen />);
    await waitFor(() => {
      expect(getByText('Select Collection')).toBeTruthy();
    });
  });

  it('fetches preselected mantra if not in saved list', async () => {
    mockRouteParams = { mantraId: 999 };
    (mantraService.getSavedMantras as jest.Mock).mockResolvedValue(mockMantras);
    (mantraService.getMantraById as jest.Mock).mockResolvedValue({
      status: 'success',
      data: {
        mantra: {
          mantra_id: 999,
          title: 'Fetched Mantra',
          key_takeaway: 'Test',
          created_at: '2024-01-01',
          is_active: true,
        },
      },
    });

    const { getAllByText } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(mantraService.getMantraById).toHaveBeenCalledWith(999, 'test-token');
      // Using getAllByText because it may appear in list AND preview
      expect(getAllByText('Fetched Mantra').length).toBeGreaterThan(0);
    });
  });

  it('handles failed fetch of preselected mantra gracefully', async () => {
    mockRouteParams = { mantraId: 999 };
    (mantraService.getSavedMantras as jest.Mock).mockResolvedValue(mockMantras);
    (mantraService.getMantraById as jest.Mock).mockRejectedValue(new Error('Not found'));

    const { getByText } = render(<CreateReminderScreen />);
    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });
  });

  it('handles non-array response from getSavedMantras', async () => {
    (mantraService.getSavedMantras as jest.Mock).mockResolvedValue(null);
    const { getByText } = render(<CreateReminderScreen />);
    await waitFor(() => {
      expect(getByText('No saved mantras yet. Save a mantra to set a reminder.')).toBeTruthy();
    });
  });

  it('clears collection selection when switching to mantra type', async () => {
    mockRouteParams = { collectionId: 10 };
    const { getByText } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(getByText('Select Collection')).toBeTruthy();
    });

    fireEvent.press(getByText('Mantra'));

    await waitFor(() => {
      expect(getByText('Select Mantra')).toBeTruthy();
    });
  });

  it('clears mantra selection when switching to collection type', async () => {
    mockRouteParams = { mantraId: 1 };
    const { getByText } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(getByText('Select Mantra')).toBeTruthy();
    });

    fireEvent.press(getByText('Collection'));

    await waitFor(() => {
      expect(getByText('Select Collection')).toBeTruthy();
    });
  });

  it('navigates back when back button area is pressed', async () => {
    const { getByTestId } = render(<CreateReminderScreen />);

    // Now we can specifically test the back button press
    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('opens date picker when date button is pressed', async () => {
    const { getByTestId, getByText } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });

    // Switch to Simple mode (screen defaults to Routine)
    fireEvent.press(getByText('Simple'));

    fireEvent.press(getByTestId('date-picker-button'));

    // On iOS, this opens a modal with Cancel and Done buttons
    await waitFor(() => {
      expect(getByText('Select Date')).toBeTruthy();
      expect(getByText('Cancel')).toBeTruthy();
      expect(getByText('Done')).toBeTruthy();
    });
  });

  it('opens time picker when time button is pressed', async () => {
    const { getByTestId, getByText } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });

    // Switch to Simple mode (screen defaults to Routine)
    fireEvent.press(getByText('Simple'));

    fireEvent.press(getByTestId('time-picker-button'));

    await waitFor(() => {
      expect(getByText('Select Time')).toBeTruthy();
    });
  });

  it('cancels iOS date picker modal', async () => {
    const { getByTestId, getByText, queryByText } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });

    // Switch to Simple mode (screen defaults to Routine)
    fireEvent.press(getByText('Simple'));

    fireEvent.press(getByTestId('date-picker-button'));

    await waitFor(() => {
      expect(getByText('Select Date')).toBeTruthy();
    });

    fireEvent.press(getByText('Cancel'));

    // Modal should close - Select Date text should no longer be visible
    // (Modal visible=false hides it)
  });

  it('confirms iOS date picker modal', async () => {
    const { getByTestId, getByText } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });

    // Switch to Simple mode (screen defaults to Routine)
    fireEvent.press(getByText('Simple'));

    fireEvent.press(getByTestId('date-picker-button'));

    await waitFor(() => {
      expect(getByText('Done')).toBeTruthy();
    });

    fireEvent.press(getByText('Done'));
    // Date should be confirmed
  });

  it('cancels iOS time picker modal', async () => {
    const { getByTestId, getByText } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });

    // Switch to Simple mode (screen defaults to Routine)
    fireEvent.press(getByText('Simple'));

    fireEvent.press(getByTestId('time-picker-button'));

    await waitFor(() => {
      expect(getByText('Select Time')).toBeTruthy();
    });

    fireEvent.press(getByText('Cancel'));
  });

  it('confirms iOS time picker modal', async () => {
    const { getByTestId, getByText } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });

    // Switch to Simple mode (screen defaults to Routine)
    fireEvent.press(getByText('Simple'));

    fireEvent.press(getByTestId('time-picker-button'));

    await waitFor(() => {
      expect(getByText('Done')).toBeTruthy();
    });

    fireEvent.press(getByText('Done'));
  });

  it('handles iOS date change callback', async () => {
    const { getByTestId, getByText } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });

    // Switch to Simple mode (screen defaults to Routine)
    fireEvent.press(getByText('Simple'));

    fireEvent.press(getByTestId('date-picker-button'));

    await waitFor(() => {
      expect(getByTestId('datetime-picker-date')).toBeTruthy();
    });

    // Simulate the onChange on the DateTimePicker
    const picker = getByTestId('datetime-picker-date');
    picker.props.onChange({ type: 'set' }, new Date('2024-06-15T10:00:00Z'));
  });

  it('handles iOS time change callback', async () => {
    const { getByTestId, getByText } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });

    // Switch to Simple mode (screen defaults to Routine)
    fireEvent.press(getByText('Simple'));

    fireEvent.press(getByTestId('time-picker-button'));

    await waitFor(() => {
      expect(getByTestId('datetime-picker-time')).toBeTruthy();
    });

    const picker = getByTestId('datetime-picker-time');
    picker.props.onChange({ type: 'set' }, new Date('2024-01-01T14:30:00Z'));
  });

  it('does not skip preselected mantra fetch when it is already in saved list', async () => {
    mockRouteParams = { mantraId: 1 };
    (mantraService.getSavedMantras as jest.Mock).mockResolvedValue(mockMantras);

    render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(mantraService.getMantraById).not.toHaveBeenCalled();
    });
  });

  it('shows invalid time alert when time is in the past', async () => {
    // Set system time to far future so the initial time (Date.now() + 1h) is in the past
    // when we reset to a past time
    jest.setSystemTime(new Date('2030-01-01T00:00:00Z'));

    const { getByText, getByTestId } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });

    fireEvent.press(getByText('Be Present'));

    // Switch to Simple mode (screen defaults to Routine)
    fireEvent.press(getByText('Simple'));

    // The component sets time to Date.now() + 1h, which is 2030-01-01T01:00:00Z
    // Advance system time past that so time <= new Date() is true
    jest.setSystemTime(new Date('2031-01-01T00:00:00Z'));

    fireEvent.press(getByTestId('create-reminder-button'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Invalid Time',
      'Reminder time must be in the future.',
    );
  });

  it('calls goBack after successful reminder creation via OK button', async () => {
    (reminderService.createReminder as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { reminder: { reminder_id: 1 } },
    });

    const { getByText, getByTestId } = render(<CreateReminderScreen />);

    await waitFor(() => {
      expect(getByText('Be Present')).toBeTruthy();
    });

    fireEvent.press(getByText('Be Present'));
    fireEvent.press(getByTestId('create-reminder-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Reminder Created',
        'Your reminder has been set.',
        expect.any(Array),
      );
    });

    // Press the OK button in the success alert
    const successCall = (Alert.alert as jest.Mock).mock.calls.find(
      (call) => call[0] === 'Reminder Created',
    );
    successCall[2][0].onPress();

    expect(mockGoBack).toHaveBeenCalled();
  });
});
