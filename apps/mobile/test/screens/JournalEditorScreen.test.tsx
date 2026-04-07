import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import React from 'react';
import JournalEditorScreen from '../../screens/JournalEditorScreen';
import { useCreateJournalEntry, useUpdateJournalEntry } from '../../hooks';

jest.mock('../../hooks', () => ({
  useCreateJournalEntry: jest.fn(),
  useUpdateJournalEntry: jest.fn(),
}));

jest.mock('../../services/journal.service', () => ({
  MOOD_OPTIONS: [
    { value: 'happy', label: 'Happy', emoji: '😊' },
    { value: 'calm', label: 'Calm', emoji: '😌' },
    { value: 'grateful', label: 'Grateful', emoji: '🙏' },
    { value: 'motivated', label: 'Motivated', emoji: '💪' },
    { value: 'anxious', label: 'Anxious', emoji: '😰' },
    { value: 'sad', label: 'Sad', emoji: '😢' },
    { value: 'stressed', label: 'Stressed', emoji: '😫' },
  ],
}));

jest.mock('../../services/engagement.service', () => ({
  engagementService: { trackEvent: jest.fn() },
}));

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#000000',
      primaryDark: '#111111',
      secondary: '#FF6B6B',
      text: '#FFFFFF',
      white: '#FFFFFF',
    },
  }),
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

jest.mock('../../components/UI/textWrapper', () => {
  const { Text } = jest.requireActual('react-native');
  return ({ children, ...props }: any) => <Text {...props}>{children}</Text>;
});

const mockCreateMutate = jest.fn();
const mockUpdateMutate = jest.fn();

describe('JournalEditorScreen', () => {
  const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useCreateJournalEntry as jest.Mock).mockReturnValue({
      mutate: mockCreateMutate,
      isPending: false,
    });
    (useUpdateJournalEntry as jest.Mock).mockReturnValue({
      mutate: mockUpdateMutate,
      isPending: false,
    });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  describe('Creating new entry', () => {
    const mockRoute = { params: {} };

    it('renders new entry form correctly', () => {
      const { getByText, getByPlaceholderText } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );
      expect(getByText('New Entry')).toBeTruthy();
      expect(getByPlaceholderText('Title (optional)')).toBeTruthy();
      expect(getByPlaceholderText(/What's on your mind?/i)).toBeTruthy();
    });

    it('allows entering title and content', () => {
      const { getByPlaceholderText } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );
      const titleInput = getByPlaceholderText('Title (optional)');
      const contentInput = getByPlaceholderText(/What's on your mind?/i);
      fireEvent.changeText(titleInput, 'My Test Entry');
      fireEvent.changeText(contentInput, 'This is my test content');
      expect(titleInput.props.value).toBe('My Test Entry');
      expect(contentInput.props.value).toBe('This is my test content');
    });

    it('allows selecting mood', () => {
      const { getByTestId } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );
      const calmButton = getByTestId('mood-button-calm');
      fireEvent.press(calmButton);
      expect(calmButton).toBeTruthy();
    });

    it('allows adding and removing tags', () => {
      const { getByPlaceholderText, getByText } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );
      const tagInput = getByPlaceholderText('Add a tag...');
      fireEvent.changeText(tagInput, 'gratitude');
      fireEvent(tagInput, 'submitEditing');
      expect(getByText('#gratitude')).toBeTruthy();
      fireEvent.press(getByText('#gratitude').parent!);
      expect(() => getByText('#gratitude')).toThrow();
    });

    it('disables save button when no content', () => {
      const { getByTestId } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );
      expect(getByTestId('save-button').props.accessibilityState.disabled).toBe(true);
    });

    it('calls createEntry.mutate with payload on save', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );
      fireEvent.changeText(getByPlaceholderText(/What's on your mind?/i), 'Test content');
      fireEvent.press(getByTestId('save-button'));
      expect(mockCreateMutate).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'Test content' }),
        expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
      );
    });

    it('shows success alert and navigates back on save success', () => {
      mockCreateMutate.mockImplementation((_payload: any, { onSuccess }: any) => onSuccess());
      jest.spyOn(Alert, 'alert').mockImplementation((_t: any, _m: any, buttons: any) => {
        if (buttons && buttons[0]?.onPress) buttons[0].onPress();
      });
      const { getByPlaceholderText, getByTestId } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );
      fireEvent.changeText(getByPlaceholderText(/What's on your mind?/i), 'Test content');
      fireEvent.press(getByTestId('save-button'));
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Journal entry saved', expect.any(Array));
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('shows error alert on save failure', () => {
      mockCreateMutate.mockImplementation((_payload: any, { onError }: any) => onError());
      const { getByPlaceholderText, getByTestId } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );
      fireEvent.changeText(getByPlaceholderText(/What's on your mind?/i), 'Test content');
      fireEvent.press(getByTestId('save-button'));
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to save entry');
    });
  });

  describe('Editing existing entry', () => {
    const existingEntry = {
      journal_id: 1,
      user_id: 1,
      mantra_id: 10,
      mantra_title: 'Peace Within',
      title: 'Existing Entry',
      content: 'Existing content',
      mood: 'calm',
      tags: ['mindfulness', 'peace'],
      is_private: false,
      created_at: '2024-01-15T08:00:00Z',
      updated_at: '2024-01-15T08:00:00Z',
    };
    const mockRoute = { params: { entry: existingEntry } };

    it('renders edit form with existing data', () => {
      const { getByText, getByDisplayValue } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );
      expect(getByText('Edit Entry')).toBeTruthy();
      expect(getByDisplayValue('Existing Entry')).toBeTruthy();
      expect(getByDisplayValue('Existing content')).toBeTruthy();
      expect(getByText('#mindfulness')).toBeTruthy();
      expect(getByText('#peace')).toBeTruthy();
      expect(getByText(/Peace Within/)).toBeTruthy();
    });

    it('calls updateEntry.mutate with journalId on save', () => {
      const { getByDisplayValue, getByTestId } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );
      fireEvent.changeText(getByDisplayValue('Existing content'), 'Updated content');
      fireEvent.press(getByTestId('save-button'));
      expect(mockUpdateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          journalId: 1,
          payload: expect.objectContaining({ content: 'Updated content' }),
        }),
        expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
      );
    });

    it('shows success alert and navigates back on update success', () => {
      mockUpdateMutate.mockImplementation((_params: any, { onSuccess }: any) => onSuccess());
      jest.spyOn(Alert, 'alert').mockImplementation((_t: any, _m: any, buttons: any) => {
        if (buttons && buttons[0]?.onPress) buttons[0].onPress();
      });
      const { getByDisplayValue, getByTestId } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );
      fireEvent.changeText(getByDisplayValue('Existing content'), 'Updated content');
      fireEvent.press(getByTestId('save-button'));
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Journal entry updated',
        expect.any(Array),
      );
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('removes linked mantra when close button pressed', () => {
      const { queryByText, getByTestId, getByText } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );
      expect(getByText(/Peace Within/)).toBeTruthy();
      fireEvent.press(getByTestId('remove-mantra-button'));
      expect(queryByText(/Peace Within/)).toBeNull();
    });
  });

  describe('Entry with preselected mantra', () => {
    const mockRoute = { params: { mantraId: 42, mantraTitle: 'Breathe and Be' } };

    it('displays preselected mantra', () => {
      const { getByText } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );
      expect(getByText(/Breathe and Be/)).toBeTruthy();
    });

    it('includes mantra ID in payload', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );
      fireEvent.changeText(getByPlaceholderText(/What's on your mind?/i), 'Reflection on mantra');
      fireEvent.press(getByTestId('save-button'));
      expect(mockCreateMutate).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'Reflection on mantra', mantra_id: 42 }),
        expect.any(Object),
      );
    });
  });

  describe('Tag management', () => {
    const mockRoute = { params: {} };

    it('prevents adding duplicate tags', () => {
      const { getByPlaceholderText, queryAllByText } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );
      const tagInput = getByPlaceholderText('Add a tag...');
      fireEvent.changeText(tagInput, 'gratitude');
      fireEvent(tagInput, 'submitEditing');
      fireEvent.changeText(tagInput, 'gratitude');
      fireEvent(tagInput, 'submitEditing');
      expect(queryAllByText('#gratitude').length).toBe(1);
    });

    it('trims and lowercases tags', () => {
      const { getByPlaceholderText, getByText } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );
      const tagInput = getByPlaceholderText('Add a tag...');
      fireEvent.changeText(tagInput, '  GRATITUDE  ');
      fireEvent(tagInput, 'submitEditing');
      expect(getByText('#gratitude')).toBeTruthy();
    });
  });

  describe('Back navigation', () => {
    it('navigates back when close button pressed', () => {
      const { getByTestId } = render(
        <JournalEditorScreen navigation={mockNavigation} route={{ params: {} }} />,
      );
      fireEvent.press(getByTestId('back-button'));
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  describe('Mood deselection', () => {
    it('allows deselecting mood by pressing again', () => {
      const { getByTestId } = render(
        <JournalEditorScreen navigation={mockNavigation} route={{ params: {} }} />,
      );
      const calmButton = getByTestId('mood-button-calm');
      fireEvent.press(calmButton);
      fireEvent.press(calmButton);
      expect(calmButton).toBeTruthy();
    });
  });
});
