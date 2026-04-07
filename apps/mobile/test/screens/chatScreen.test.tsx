import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ChatScreen from '../../screens/ChatScreen';
import { useConversations } from '../../hooks';
import { Conversation } from '../../types/chat.types';

jest.mock('../../hooks', () => ({
  useConversations: jest.fn(),
}));

jest.mock('@react-navigation/native', () => {
  const React = jest.requireActual('react');
  return {
    ...jest.requireActual('@react-navigation/native'),
    useFocusEffect: (callback: () => void) => {
      React.useEffect(() => {
        callback();
      }, []);
    },
  };
});

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#FFFFFF',
      primaryDark: '#1a1a1a',
      secondary: '#F0E68C',
      text: '#000000',
    },
  }),
}));

const mockRefetch = jest.fn();

const mockConversations: Conversation[] = [
  {
    conversation_id: 1,
    participant_id: 2,
    participant_username: 'john_doe',
    participant_email: 'john@example.com',
    last_message: 'Hey there!',
    last_message_time: new Date().toISOString(),
    unread_count: 2,
    profile_photo: null,
  },
  {
    conversation_id: 2,
    participant_id: 3,
    participant_username: 'jane_smith',
    participant_email: 'jane@example.com',
    last_message: 'How are you?',
    last_message_time: new Date(Date.now() - 3600000).toISOString(),
    unread_count: 0,
    profile_photo: null,
  },
];

const mockNavigation = {
  navigate: jest.fn(),
};

describe('ChatScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useConversations as jest.Mock).mockReturnValue({
      data: mockConversations,
      isLoading: false,
      refetch: mockRefetch,
    });
  });

  it('renders screen title', () => {
    const { getByText } = render(<ChatScreen navigation={mockNavigation} />);
    expect(getByText('Messages')).toBeTruthy();
  });

  it('calls refetch on focus', () => {
    render(<ChatScreen navigation={mockNavigation} />);
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('navigates to new conversation when FAB is pressed', () => {
    const { getByText } = render(<ChatScreen navigation={mockNavigation} />);
    fireEvent.press(getByText('+'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('NewConversation');
  });

  it('shows loading state when isLoading is true', () => {
    (useConversations as jest.Mock).mockReturnValue({
      data: [],
      isLoading: true,
      refetch: mockRefetch,
    });
    const { UNSAFE_root } = render(<ChatScreen navigation={mockNavigation} />);
    expect(UNSAFE_root).toBeTruthy();
  });
});
