import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ChatScreen from '../../screens/ChatScreen';
import { chatService } from '../../services/chat.service';
import { storage } from '../../utils/storage';
import { Conversation } from '../../types/chat.types';

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../../services/chat.service');
jest.mock('../../utils/storage');

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
  }),
}));

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

describe('ChatScreen', () => {
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
    addListener: jest.fn((event, callback) => jest.fn()),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getToken as jest.Mock).mockResolvedValue('mock-token');
  });

  it('renders screen title and loads conversations on mount', async () => {
    (chatService.getConversations as jest.Mock).mockResolvedValue(mockConversations);

    const { getByText, findByText } = render(<ChatScreen navigation={mockNavigation} />);

    expect(getByText('Messages')).toBeTruthy();

    // Wait for conversations to load
    await findByText('john_doe');
    await findByText('jane_smith');

    expect(storage.getToken).toHaveBeenCalled();
    expect(chatService.getConversations).toHaveBeenCalledWith('mock-token');
  }, 10000);

  it('navigates to new conversation when FAB is pressed', async () => {
    (chatService.getConversations as jest.Mock).mockResolvedValue(mockConversations);

    const { getByText } = render(<ChatScreen navigation={mockNavigation} />);

    await waitFor(() => expect(getByText('+')).toBeTruthy());

    fireEvent.press(getByText('+'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('NewConversation');
  });

  it('handles error when loading conversations fails', async () => {
    (chatService.getConversations as jest.Mock).mockRejectedValue(new Error('Network error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<ChatScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error loading conversations:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('reloads conversations when screen comes into focus', async () => {
    let focusCallback: (() => void) | undefined;
    (chatService.getConversations as jest.Mock).mockResolvedValue(mockConversations);
    (mockNavigation.addListener as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'focus') focusCallback = callback;
      return jest.fn();
    });

    render(<ChatScreen navigation={mockNavigation} />);

    await waitFor(() => expect(chatService.getConversations).toHaveBeenCalledTimes(1));

    focusCallback?.();

    await waitFor(() => expect(chatService.getConversations).toHaveBeenCalledTimes(2));
  });

  it('uses mock token when storage token is null', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue(null);
    (chatService.getConversations as jest.Mock).mockResolvedValue([]);

    render(<ChatScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(chatService.getConversations).toHaveBeenCalledWith('mock-token');
    });
  });

  it('cleans up focus listener on unmount', () => {
    const unsubscribeMock = jest.fn();
    (mockNavigation.addListener as jest.Mock).mockReturnValue(unsubscribeMock);
    (chatService.getConversations as jest.Mock).mockResolvedValue([]);

    const { unmount } = render(<ChatScreen navigation={mockNavigation} />);
    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });
});
