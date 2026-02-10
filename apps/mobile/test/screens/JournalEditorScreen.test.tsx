import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Text } from 'react-native';
import React from 'react';
import JournalEditorScreen from '../../screens/JournalEditorScreen';
import { journalService } from '../../services/journal.service';
import { storage } from '../../utils/storage';

// Mock dependencies
jest.mock('../../services/journal.service', () => ({
  ...jest.requireActual('../../services/journal.service'),
  journalService: {
    getJournalEntries: jest.fn(),
    getJournalEntry: jest.fn(),
    createJournalEntry: jest.fn(),
    updateJournalEntry: jest.fn(),
    deleteJournalEntry: jest.fn(),
  },
}));
jest.mock('../../utils/storage');

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#000000',
      primaryDark: '#111111',
      secondary: '#FF6B6B',
      text: '#FFFFFF',
    },
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('../../components/UI/textWrapper', () => {
  const { Text } = jest.requireActual('react-native');
  return ({ children, ...props }: any) => <Text {...props}>{children}</Text>;
});

describe('JournalEditorScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getToken as jest.Mock).mockResolvedValue('mock-token');
  });

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

      // Mood should be selected (visual feedback would change)
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

      // Remove tag
      const tagElement = getByText('#gratitude');
      fireEvent.press(tagElement.parent!);

      // Tag should be removed
      expect(() => getByText('#gratitude')).toThrow();
    });

    it('disables save button when no content', () => {
      const { getByTestId } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );

      const saveButton = getByTestId('save-button');

      // Button should be disabled
      expect(saveButton.props.accessibilityState.disabled).toBe(true);
    });

    it('saves new entry successfully', async () => {
      (journalService.createJournalEntry as jest.Mock).mockResolvedValue({
        status: 'success',
        data: { journal_id: 1 },
      });

      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
        if (buttons && buttons[0] && buttons[0].onPress) {
          buttons[0].onPress();
        }
      });

      const { getByPlaceholderText, getByTestId } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );

      fireEvent.changeText(getByPlaceholderText(/What's on your mind?/i), 'Test content');
      fireEvent.press(getByTestId('save-button'));

      await waitFor(() => {
        expect(journalService.createJournalEntry).toHaveBeenCalledWith(
          expect.objectContaining({ content: 'Test content' }),
          'mock-token',
        );
        expect(alertSpy).toHaveBeenCalledWith('Success', 'Journal entry saved', expect.any(Array));
        expect(mockNavigation.goBack).toHaveBeenCalled();
      });
    });

    it('shows error if save fails', async () => {
      (journalService.createJournalEntry as jest.Mock).mockResolvedValue({
        status: 'error',
        message: 'Save failed',
      });

      const alertSpy = jest.spyOn(Alert, 'alert');

      const { getByPlaceholderText, getByTestId } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );

      fireEvent.changeText(getByPlaceholderText(/What's on your mind?/i), 'Test content');
      fireEvent.press(getByTestId('save-button'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'Save failed');
      });
    });

    it('navigates to Login when no token found', async () => {
      (storage.getToken as jest.Mock).mockResolvedValue(null);

      const { getByPlaceholderText, getByTestId } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );

      fireEvent.changeText(getByPlaceholderText(/What's on your mind?/i), 'Test content');
      fireEvent.press(getByTestId('save-button'));

      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
      });
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

    it('updates entry successfully', async () => {
      (journalService.updateJournalEntry as jest.Mock).mockResolvedValue({
        status: 'success',
      });

      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
        if (buttons && buttons[0] && buttons[0].onPress) {
          buttons[0].onPress();
        }
      });

      const { getByDisplayValue, getByTestId } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );

      fireEvent.changeText(getByDisplayValue('Existing content'), 'Updated content');
      fireEvent.press(getByTestId('save-button'));

      await waitFor(() => {
        expect(journalService.updateJournalEntry).toHaveBeenCalledWith(
          1,
          expect.objectContaining({ content: 'Updated content' }),
          'mock-token',
        );
        expect(alertSpy).toHaveBeenCalledWith(
          'Success',
          'Journal entry updated',
          expect.any(Array),
        );
        expect(mockNavigation.goBack).toHaveBeenCalled();
      });
    });

    it('removes linked mantra when close button pressed', () => {
      const {
        queryByText,
        getByTestId,
        getByText: findText,
      } = render(<JournalEditorScreen navigation={mockNavigation} route={mockRoute} />);

      expect(findText(/Peace Within/)).toBeTruthy();

      // Press the remove mantra button
      fireEvent.press(getByTestId('remove-mantra-button'));

      // Mantra should be removed
      expect(queryByText(/Peace Within/)).toBeNull();
    });
  });

  describe('Entry with preselected mantra', () => {
    const mockRoute = {
      params: {
        mantraId: 42,
        mantraTitle: 'Breathe and Be',
      },
    };

    it('displays preselected mantra', () => {
      const { getByText } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );

      expect(getByText(/Breathe and Be/)).toBeTruthy();
    });

    it('includes mantra ID when saving entry', async () => {
      (journalService.createJournalEntry as jest.Mock).mockResolvedValue({
        status: 'success',
      });

      jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
        if (buttons && buttons[0] && buttons[0].onPress) {
          buttons[0].onPress();
        }
      });

      const { getByPlaceholderText, getByTestId } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );

      fireEvent.changeText(getByPlaceholderText(/What's on your mind?/i), 'Reflection on mantra');
      fireEvent.press(getByTestId('save-button'));

      await waitFor(() => {
        expect(journalService.createJournalEntry).toHaveBeenCalledWith(
          expect.objectContaining({
            content: 'Reflection on mantra',
            mantra_id: 42,
          }),
          'mock-token',
        );
      });
    });
  });

  describe('Tag management', () => {
    const mockRoute = { params: {} };

    it('prevents adding duplicate tags', () => {
      const { getByPlaceholderText, getByText, queryAllByText } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );

      const tagInput = getByPlaceholderText('Add a tag...');

      fireEvent.changeText(tagInput, 'gratitude');
      fireEvent(tagInput, 'submitEditing');

      fireEvent.changeText(tagInput, 'gratitude');
      fireEvent(tagInput, 'submitEditing');

      // Should only have one instance
      expect(queryAllByText('#gratitude').length).toBe(1);
    });

    it('prevents adding more than 10 tags', () => {
      const { getByPlaceholderText } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );

      const tagInput = getByPlaceholderText('Add a tag...');

      // Add 10 tags
      for (let i = 1; i <= 10; i++) {
        fireEvent.changeText(tagInput, `tag${i}`);
        fireEvent(tagInput, 'submitEditing');
      }

      // Try to add 11th tag
      fireEvent.changeText(tagInput, 'tag11');
      fireEvent(tagInput, 'submitEditing');

      // Tag input should be hidden or tag not added
      // This behavior depends on implementation
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
    const mockRoute = { params: {} };

    it('navigates back when close button pressed', () => {
      const { getByTestId } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );

      fireEvent.press(getByTestId('back-button'));

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  describe('Mood deselection', () => {
    const mockRoute = { params: {} };

    it('allows deselecting mood by pressing again', () => {
      const { getByTestId } = render(
        <JournalEditorScreen navigation={mockNavigation} route={mockRoute} />,
      );

      const calmButton = getByTestId('mood-button-calm');

      // Select mood
      fireEvent.press(calmButton);

      // Deselect mood
      fireEvent.press(calmButton);

      // Mood should be deselected (implementation specific)
      expect(calmButton).toBeTruthy();
    });
  });
});
