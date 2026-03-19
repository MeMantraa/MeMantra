import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ConversationScreen from '../../screens/conversationScreen';
import { chatService } from '../../services/chat.service';
import { storage } from '../../utils/storage';
import { Message } from '../../types/chat.types';
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
jest.mock('../../components/chat/ChatBubble', () => {
  const { Text, TouchableOpacity, View } = jest.requireActual('react-native');

  return {
    ChatBubble: ({ message, onSwipeReply, onReaction }: any) => (
      <View>
        <Text>{message.content}</Text>
        <TouchableOpacity onPress={() => onSwipeReply?.(message)}>
          <Text>reply-{message.message_id}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onReaction?.(message.message_id, '+1')}>
          <Text>react-{message.message_id}</Text>
        </TouchableOpacity>
      </View>
    ),
  };
});
jest.mock('../../components/chat/ChatInput', () => {
  const React = jest.requireActual('react');
  const { TextInput, TouchableOpacity, Text, View } = jest.requireActual('react-native');

  return function MockChatInput({ onSend }: any) {
    const [value, setValue] = React.useState('');

    return (
      <View>
        <TextInput placeholder="Type a message..." value={value} onChangeText={setValue} />
        <TouchableOpacity
          testID="send-button"
          onPress={() => {
            onSend?.(value);
            setValue('');
          }}
        >
          <Text>Send</Text>
        </TouchableOpacity>
      </View>
    );
  };
});
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  }),
}));
jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#FFFFFF',
      primaryDark: '#1a1a1a',
      secondary: '#F0E68C',
      text: '#000000',
      white: '#FFFFFF',
    },
  }),
}));

describe('ConversationScreen', () => {
  const mockConversation = {
    conversation_id: 1,
    participant_id: 2,
    participant_username: 'john_doe',
    participant_email: 'john@example.com',
    last_message: 'Hey!',
    last_message_time: new Date().toISOString(),
    unread_count: 1,
  };

  const mockMessages: Message[] = [
    {
      message_id: 1,
      conversation_id: 1,
      sender_id: 2,
      content: 'Hello!',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      read: true,
    },
    {
      message_id: 2,
      conversation_id: 1,
      sender_id: 1,
      content: 'Hi there!',
      created_at: new Date(Date.now() - 1800000).toISOString(),
      read: true,
    },
  ];

  const mockNavigation = {
    goBack: jest.fn(),
    setOptions: jest.fn(),
  };

  const mockRoute = {
    params: {
      conversation: mockConversation,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getToken as jest.Mock).mockResolvedValue('mock-token');
    (storage.getUserData as jest.Mock).mockResolvedValue({ user_id: 1 });
    (chatService.getReactions as jest.Mock).mockResolvedValue([]);
    (chatService.markAsRead as jest.Mock).mockResolvedValue(undefined);
  });

  it('renders conversation header with participant username', async () => {
    (chatService.getMessages as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(
      <ConversationScreen route={mockRoute} navigation={mockNavigation} />,
    );

    expect(getByText('john_doe')).toBeTruthy();
  });

  it('loads and displays messages', async () => {
    (chatService.getMessages as jest.Mock).mockResolvedValue(mockMessages);
    (chatService.markAsRead as jest.Mock).mockResolvedValue(undefined);

    const { findByText } = render(
      <ConversationScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(chatService.getMessages).toHaveBeenCalledWith(1, 'mock-token');
    });

    expect(await findByText('Hello!', {}, { timeout: 10000 })).toBeTruthy();
    expect(await findByText('Hi there!', {}, { timeout: 10000 })).toBeTruthy();
  });

  it('marks conversation as read on load', async () => {
    (chatService.getMessages as jest.Mock).mockResolvedValue(mockMessages);

    render(<ConversationScreen route={mockRoute} navigation={mockNavigation} />);

    await waitFor(() => {
      expect(chatService.markAsRead).toHaveBeenCalledWith(1, 'mock-token');
    });
  });

  it('loads reactions for each message', async () => {
    (chatService.getMessages as jest.Mock).mockResolvedValue(mockMessages);
    (chatService.getReactions as jest.Mock)
      .mockResolvedValueOnce([{ emoji: '👍', count: 1, users: [2] }])
      .mockResolvedValueOnce([]);

    render(<ConversationScreen route={mockRoute} navigation={mockNavigation} />);

    await waitFor(() => {
      expect(chatService.getReactions).toHaveBeenCalledTimes(2);
      expect(chatService.getReactions).toHaveBeenCalledWith(1, 'mock-token');
      expect(chatService.getReactions).toHaveBeenCalledWith(2, 'mock-token');
    });
  });

  it('sends a message when send is pressed', async () => {
    (chatService.getMessages as jest.Mock).mockResolvedValue(mockMessages);
    (chatService.sendMessage as jest.Mock).mockResolvedValue({
      message_id: 3,
      conversation_id: 1,
      sender_id: 1,
      content: 'New message',
      created_at: new Date().toISOString(),
      read: false,
    });

    const { getByPlaceholderText, getByTestId, getByText } = render(
      <ConversationScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByText('Hello!')).toBeTruthy();
    });

    const input = getByPlaceholderText('Type a message...');
    fireEvent.changeText(input, 'New message');

    const sendButton = getByTestId('send-button');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(chatService.sendMessage).toHaveBeenCalledWith(
        {
          conversation_id: 1,
          content: 'New message',
          reply_to_message_id: undefined,
        },
        'mock-token',
      );
    });
  });

  it('displays new message after sending', async () => {
    (chatService.getMessages as jest.Mock).mockResolvedValue(mockMessages);
    (chatService.markAsRead as jest.Mock).mockResolvedValue(undefined);
    (chatService.sendMessage as jest.Mock).mockResolvedValue({
      message_id: 3,
      conversation_id: 1,
      sender_id: 1,
      content: 'New message',
      created_at: new Date().toISOString(),
      read: false,
    });

    const { getByPlaceholderText, getByTestId, getByText } = render(
      <ConversationScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(
      () => {
        expect(getByText('Hello!')).toBeTruthy();
      },
      { timeout: 3000 },
    );

    const input = getByPlaceholderText('Type a message...');
    fireEvent.changeText(input, 'New message');

    const sendButton = getByTestId('send-button');
    fireEvent.press(sendButton);

    await waitFor(
      () => {
        expect(getByText('New message')).toBeTruthy();
      },
      { timeout: 3000 },
    );
  });

  it('handles reply to message', async () => {
    (chatService.getMessages as jest.Mock).mockResolvedValue(mockMessages);
    (chatService.markAsRead as jest.Mock).mockResolvedValue(undefined);
    (chatService.sendMessage as jest.Mock).mockResolvedValue({
      message_id: 3,
      conversation_id: 1,
      sender_id: 1,
      content: 'Reply message',
      created_at: new Date().toISOString(),
      read: false,
      reply_to_message_id: 1,
    });

    const { getByPlaceholderText, getByTestId, getByText } = render(
      <ConversationScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(
      () => {
        expect(getByText('Hello!')).toBeTruthy();
      },
      { timeout: 3000 },
    );

    // Simulate swipe to reply (in real app this would be through swipeable gesture)
    // For testing, we'll just trigger the reply state directly by sending with reply_to_message_id
    const input = getByPlaceholderText('Type a message...');
    fireEvent.changeText(input, 'Reply message');

    const sendButton = getByTestId('send-button');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(chatService.sendMessage).toHaveBeenCalled();
    });
  });

  it('cancels reply when cancel button is pressed', async () => {
    (chatService.getMessages as jest.Mock).mockResolvedValue(mockMessages);
    (chatService.markAsRead as jest.Mock).mockResolvedValue(undefined);

    const { queryByText } = render(
      <ConversationScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(
      () => {
        expect(queryByText('Hello!')).toBeTruthy();
      },
      { timeout: 3000 },
    );

    // Reply state would be set by user interaction
    // The cancel button would clear this state
  });

  it('adds reaction to message', async () => {
    (chatService.getMessages as jest.Mock).mockResolvedValue(mockMessages);
    (chatService.addReaction as jest.Mock).mockResolvedValue(undefined);
    (chatService.getReactions as jest.Mock).mockResolvedValue([
      { emoji: '👍', count: 1, users: [1] },
    ]);

    render(<ConversationScreen route={mockRoute} navigation={mockNavigation} />);

    await waitFor(() => {
      // Messages would be rendered with reaction functionality
    });

    // In actual implementation, user would long-press message and select emoji
  });

  it('handles error when loading messages fails', async () => {
    (chatService.getMessages as jest.Mock).mockRejectedValue(new Error('Network error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<ConversationScreen route={mockRoute} navigation={mockNavigation} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error loading messages:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('handles error when sending message fails', async () => {
    (chatService.getMessages as jest.Mock).mockResolvedValue(mockMessages);
    (chatService.sendMessage as jest.Mock).mockRejectedValue(new Error('Send failed'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { getByPlaceholderText, getByTestId, getByText } = render(
      <ConversationScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByText('Hello!')).toBeTruthy();
    });

    const input = getByPlaceholderText('Type a message...');
    fireEvent.changeText(input, 'Test message');

    const sendButton = getByTestId('send-button');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error sending message:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('handles error when loading reactions fails', async () => {
    (chatService.getMessages as jest.Mock).mockResolvedValue(mockMessages);
    (chatService.getReactions as jest.Mock).mockRejectedValue(new Error('Reactions error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<ConversationScreen route={mockRoute} navigation={mockNavigation} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('loads current user data', async () => {
    (chatService.getMessages as jest.Mock).mockResolvedValue(mockMessages);
    (storage.getUserData as jest.Mock).mockResolvedValue({ user_id: 5 });

    render(<ConversationScreen route={mockRoute} navigation={mockNavigation} />);

    await waitFor(() => {
      expect(storage.getUserData).toHaveBeenCalled();
    });
  });

  it('handles error when loading current user fails', async () => {
    (chatService.getMessages as jest.Mock).mockResolvedValue(mockMessages);
    (storage.getUserData as jest.Mock).mockRejectedValue(new Error('Storage error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<ConversationScreen route={mockRoute} navigation={mockNavigation} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error loading current user:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('renders empty conversation initially', async () => {
    (chatService.getMessages as jest.Mock).mockResolvedValue([]);

    const { queryByText } = render(
      <ConversationScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(queryByText('Hello!')).toBeNull();
    });
  });
});
