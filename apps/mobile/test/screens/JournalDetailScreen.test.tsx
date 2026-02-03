import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import React from 'react';
import JournalDetailScreen from '../../screens/JournalDetailScreen';

// Mock dependencies
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

describe('JournalDetailScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  const mockEntry = {
    journal_id: 1,
    user_id: 1,
    mantra_id: 10,
    mantra_title: 'Peace Begins Within',
    mantra_key_takeaway: 'Find inner peace through mindfulness',
    title: 'Morning Reflection',
    content:
      'Today I practiced mindfulness meditation for 20 minutes. I felt a deep sense of peace and clarity. The mantra helped me center myself and let go of anxiety about the day ahead.',
    mood: 'calm',
    tags: ['mindfulness', 'peace', 'meditation'],
    is_private: false,
    created_at: '2024-01-15T08:30:00Z',
    updated_at: '2024-01-15T08:30:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic rendering', () => {
    const mockRoute = { params: { entry: mockEntry } };

    it('renders journal entry details correctly', () => {
      const { getByText } = render(
        <JournalDetailScreen navigation={mockNavigation} route={mockRoute} />,
      );

      expect(getByText('Morning Reflection')).toBeTruthy();
      expect(getByText(/Today I practiced mindfulness/)).toBeTruthy();
      expect(getByText('Peace Begins Within')).toBeTruthy();
    });

    it('displays formatted date correctly', () => {
      const { getByText } = render(
        <JournalDetailScreen navigation={mockNavigation} route={mockRoute} />,
      );

      // Should show full date format
      expect(getByText(/Monday, January 15, 2024/i)).toBeTruthy();
    });

    it('displays formatted time correctly', () => {
      const { getByText } = render(
        <JournalDetailScreen navigation={mockNavigation} route={mockRoute} />,
      );

      // Should show time (timezone may vary, look for AM/PM)
      expect(getByText(/AM|PM/)).toBeTruthy();
    });

    it('displays mood with emoji and label', () => {
      const { getByText } = render(
        <JournalDetailScreen navigation={mockNavigation} route={mockRoute} />,
      );

      expect(getByText('😌')).toBeTruthy();
      expect(getByText(/Feeling calm/i)).toBeTruthy();
    });

    it('displays all tags', () => {
      const { getByText } = render(
        <JournalDetailScreen navigation={mockNavigation} route={mockRoute} />,
      );

      expect(getByText('#mindfulness')).toBeTruthy();
      expect(getByText('#peace')).toBeTruthy();
      expect(getByText('#meditation')).toBeTruthy();
    });

    it('displays linked mantra information', () => {
      const { getByText } = render(
        <JournalDetailScreen navigation={mockNavigation} route={mockRoute} />,
      );

      expect(getByText('Peace Begins Within')).toBeTruthy();
      expect(getByText('Find inner peace through mindfulness')).toBeTruthy();
      expect(getByText(/Reflecting on/i)).toBeTruthy();
    });
  });

  describe('Entry without title', () => {
    const entryWithoutTitle = {
      ...mockEntry,
      title: null,
    };

    const mockRoute = { params: { entry: entryWithoutTitle } };

    it('displays "Untitled Entry" when no title provided', () => {
      const { getByText } = render(
        <JournalDetailScreen navigation={mockNavigation} route={mockRoute} />,
      );

      expect(getByText('Untitled Entry')).toBeTruthy();
    });
  });

  describe('Entry without mood', () => {
    const entryWithoutMood = {
      ...mockEntry,
      mood: null,
    };

    const mockRoute = { params: { entry: entryWithoutMood } };

    it('does not display mood section when mood is null', () => {
      const { queryByText } = render(
        <JournalDetailScreen navigation={mockNavigation} route={mockRoute} />,
      );

      expect(queryByText(/Feeling/i)).toBeNull();
    });
  });

  describe('Entry without mantra', () => {
    const entryWithoutMantra = {
      ...mockEntry,
      mantra_id: null,
      mantra_title: null,
      mantra_key_takeaway: null,
    };

    const mockRoute = { params: { entry: entryWithoutMantra } };

    it('does not display mantra section when no mantra linked', () => {
      const { queryByText } = render(
        <JournalDetailScreen navigation={mockNavigation} route={mockRoute} />,
      );

      expect(queryByText(/Reflecting on/i)).toBeNull();
    });
  });

  describe('Entry without tags', () => {
    const entryWithoutTags = {
      ...mockEntry,
      tags: [],
    };

    const mockRoute = { params: { entry: entryWithoutTags } };

    it('does not display tags section when no tags exist', () => {
      const { queryByText } = render(
        <JournalDetailScreen navigation={mockNavigation} route={mockRoute} />,
      );

      expect(queryByText('Tags')).toBeNull();
    });
  });

  describe('Entry with tags but no key takeaway', () => {
    const entryNoTakeaway = {
      ...mockEntry,
      mantra_key_takeaway: null,
    };

    const mockRoute = { params: { entry: entryNoTakeaway } };

    it('displays mantra without key takeaway', () => {
      const { getByText, queryByText } = render(
        <JournalDetailScreen navigation={mockNavigation} route={mockRoute} />,
      );

      expect(getByText('Peace Begins Within')).toBeTruthy();
      expect(queryByText('Find inner peace through mindfulness')).toBeNull();
    });
  });

  describe('Navigation', () => {
    const mockRoute = { params: { entry: mockEntry } };

    it('navigates back when back button pressed', () => {
      const { getByTestId } = render(
        <JournalDetailScreen navigation={mockNavigation} route={mockRoute} />,
      );

      fireEvent.press(getByTestId('back-button'));

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('navigates to edit screen when edit button pressed', () => {
      const { getByTestId } = render(
        <JournalDetailScreen navigation={mockNavigation} route={mockRoute} />,
      );

      fireEvent.press(getByTestId('edit-button'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('JournalEditor', {
        entry: mockEntry,
      });
    });
  });

  describe('Different moods', () => {
    it('displays happy mood correctly', () => {
      const happyEntry = { ...mockEntry, mood: 'happy' };
      const mockRoute = { params: { entry: happyEntry } };

      const { getByText } = render(
        <JournalDetailScreen navigation={mockNavigation} route={mockRoute} />,
      );

      expect(getByText('😊')).toBeTruthy();
      expect(getByText(/Feeling happy/i)).toBeTruthy();
    });

    it('displays grateful mood correctly', () => {
      const gratefulEntry = { ...mockEntry, mood: 'grateful' };
      const mockRoute = { params: { entry: gratefulEntry } };

      const { getByText } = render(
        <JournalDetailScreen navigation={mockNavigation} route={mockRoute} />,
      );

      expect(getByText('🙏')).toBeTruthy();
      expect(getByText(/Feeling grateful/i)).toBeTruthy();
    });

    it('displays anxious mood correctly', () => {
      const anxiousEntry = { ...mockEntry, mood: 'anxious' };
      const mockRoute = { params: { entry: anxiousEntry } };

      const { getByText } = render(
        <JournalDetailScreen navigation={mockNavigation} route={mockRoute} />,
      );

      expect(getByText('😰')).toBeTruthy();
      expect(getByText(/Feeling anxious/i)).toBeTruthy();
    });

    it('displays stressed mood correctly', () => {
      const stressedEntry = { ...mockEntry, mood: 'stressed' };
      const mockRoute = { params: { entry: stressedEntry } };

      const { getByText } = render(
        <JournalDetailScreen navigation={mockNavigation} route={mockRoute} />,
      );

      // Stressed emoji is 😫 not 😓
      expect(getByText('😫')).toBeTruthy();
      expect(getByText(/Feeling stressed/i)).toBeTruthy();
    });
  });

  describe('Long content', () => {
    const longEntry = {
      ...mockEntry,
      content: 'A'.repeat(1000) + ' This is the end.',
    };

    const mockRoute = { params: { entry: longEntry } };

    it('displays full long content', () => {
      const { getByText } = render(
        <JournalDetailScreen navigation={mockNavigation} route={mockRoute} />,
      );

      expect(getByText(/AAAA/)).toBeTruthy();
      expect(getByText(/This is the end/)).toBeTruthy();
    });
  });

  describe('Multiple tags', () => {
    const manyTagsEntry = {
      ...mockEntry,
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'],
    };

    const mockRoute = { params: { entry: manyTagsEntry } };

    it('displays all tags', () => {
      const { getByText } = render(
        <JournalDetailScreen navigation={mockNavigation} route={mockRoute} />,
      );

      expect(getByText('#tag1')).toBeTruthy();
      expect(getByText('#tag2')).toBeTruthy();
      expect(getByText('#tag3')).toBeTruthy();
      expect(getByText('#tag4')).toBeTruthy();
      expect(getByText('#tag5')).toBeTruthy();
      expect(getByText('#tag6')).toBeTruthy();
    });
  });
});
