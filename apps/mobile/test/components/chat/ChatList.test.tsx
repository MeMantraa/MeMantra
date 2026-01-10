import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ChatList from '../../../components/chat/ChatList';
import { Conversation } from '../../../types/chat.types';

jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#FFFFFF',
      primaryDark: '#1a1a1a',
      secondary: '#F0E68C',
      text: '#000000',
    },
  }),
}));

describe('ChatList', () => {
  const mockConversations: Conversation[] = [
    {
      conversation_id: 1,
      participant_id: 2,
      participant_username: 'john_doe',
      participant_email: 'john@example.com',
      last_message: 'Hey! How are you?',
      last_message_time: new Date(Date.now() - 3600000).toISOString(),
      unread_count: 2,
    },
    {
      conversation_id: 2,
      participant_id: 3,
      participant_username: 'jane_smith',
      participant_email: 'jane@example.com',
      last_message: 'Thanks!',
      last_message_time: new Date(Date.now() - 7200000).toISOString(),
      unread_count: 0,
    },
  ];

  it('renders loading state', () => {
    const { getByText } = render(
      <ChatList conversations={[]} loading={true} onConversationPress={jest.fn()} />,
    );

    expect(getByText('Loading conversations...')).toBeTruthy();
  });

  it('renders empty state when no conversations', () => {
    const { getByText } = render(
      <ChatList conversations={[]} loading={false} onConversationPress={jest.fn()} />,
    );

    expect(getByText(/No conversations yet/)).toBeTruthy();
    expect(getByText(/Start chatting with other users!/)).toBeTruthy();
  });

  it('renders list of conversations', () => {
    const { getByText } = render(
      <ChatList
        conversations={mockConversations}
        loading={false}
        onConversationPress={jest.fn()}
      />,
    );

    expect(getByText('john_doe')).toBeTruthy();
    expect(getByText('jane_smith')).toBeTruthy();
    expect(getByText('Hey! How are you?')).toBeTruthy();
    expect(getByText('Thanks!')).toBeTruthy();
  });

  it('displays unread count badge', () => {
    const { getByText } = render(
      <ChatList
        conversations={mockConversations}
        loading={false}
        onConversationPress={jest.fn()}
      />,
    );

    expect(getByText('2')).toBeTruthy();
  });

  it('calls onConversationPress when conversation is pressed', () => {
    const onConversationPress = jest.fn();
    const { getByText } = render(
      <ChatList
        conversations={mockConversations}
        loading={false}
        onConversationPress={onConversationPress}
      />,
    );

    fireEvent.press(getByText('john_doe'));

    expect(onConversationPress).toHaveBeenCalledWith(mockConversations[0]);
  });

  describe('Time formatting', () => {
    it('shows "Just now" for recent messages', () => {
      const recentConversations: Conversation[] = [
        {
          ...mockConversations[0],
          last_message_time: new Date().toISOString(),
        },
      ];

      const { getByText } = render(
        <ChatList
          conversations={recentConversations}
          loading={false}
          onConversationPress={jest.fn()}
        />,
      );

      expect(getByText('Just now')).toBeTruthy();
    });

    it('shows minutes ago for messages under an hour', () => {
      const conversations: Conversation[] = [
        {
          ...mockConversations[0],
          last_message_time: new Date(Date.now() - 30 * 60000).toISOString(),
        },
      ];

      const { getByText } = render(
        <ChatList conversations={conversations} loading={false} onConversationPress={jest.fn()} />,
      );

      expect(getByText('30m ago')).toBeTruthy();
    });

    it('shows hours ago for messages under a day', () => {
      const conversations: Conversation[] = [
        {
          ...mockConversations[0],
          last_message_time: new Date(Date.now() - 5 * 3600000).toISOString(),
        },
      ];

      const { getByText } = render(
        <ChatList conversations={conversations} loading={false} onConversationPress={jest.fn()} />,
      );

      expect(getByText('5h ago')).toBeTruthy();
    });

    it('shows days ago for messages under a week', () => {
      const conversations: Conversation[] = [
        {
          ...mockConversations[0],
          last_message_time: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
      ];

      const { getByText } = render(
        <ChatList conversations={conversations} loading={false} onConversationPress={jest.fn()} />,
      );

      expect(getByText('3d ago')).toBeTruthy();
    });

    it('shows date for older messages', () => {
      const oldDate = new Date(Date.now() - 10 * 86400000);
      const conversations: Conversation[] = [
        {
          ...mockConversations[0],
          last_message_time: oldDate.toISOString(),
        },
      ];

      const { getByText } = render(
        <ChatList conversations={conversations} loading={false} onConversationPress={jest.fn()} />,
      );

      expect(getByText(oldDate.toLocaleDateString())).toBeTruthy();
    });
  });

  describe('Message preview', () => {
    it('shows "No messages yet" when last_message is null', () => {
      const conversations: Conversation[] = [
        {
          ...mockConversations[0],
          last_message: null,
        },
      ];

      const { getByText } = render(
        <ChatList conversations={conversations} loading={false} onConversationPress={jest.fn()} />,
      );

      expect(getByText('No messages yet')).toBeTruthy();
    });

    it('shows "No messages yet" when last_message is undefined', () => {
      const conversations: Conversation[] = [
        {
          ...mockConversations[0],
          last_message: undefined,
        },
      ];

      const { getByText } = render(
        <ChatList conversations={conversations} loading={false} onConversationPress={jest.fn()} />,
      );

      expect(getByText('No messages yet')).toBeTruthy();
    });

    it('shows "Shared a mantra" for mantra share messages', () => {
      const conversations: Conversation[] = [
        {
          ...mockConversations[0],
          last_message: JSON.stringify({
            type: 'mantra_share',
            text: 'Peace begins with a smile',
            mantra_id: 123,
          }),
        },
      ];

      const { getByText } = render(
        <ChatList conversations={conversations} loading={false} onConversationPress={jest.fn()} />,
      );

      expect(getByText('Shared a mantra')).toBeTruthy();
    });

    it('shows text content for regular messages', () => {
      const { getByText } = render(
        <ChatList
          conversations={mockConversations}
          loading={false}
          onConversationPress={jest.fn()}
        />,
      );

      expect(getByText('Hey! How are you?')).toBeTruthy();
    });

    it('handles malformed JSON gracefully', () => {
      const conversations: Conversation[] = [
        {
          ...mockConversations[0],
          last_message: '{invalid json}',
        },
      ];

      const { getByText } = render(
        <ChatList conversations={conversations} loading={false} onConversationPress={jest.fn()} />,
      );

      expect(getByText('{invalid json}')).toBeTruthy();
    });
  });

  describe('Avatar', () => {
    it('displays first letter of username', () => {
      const { getAllByText } = render(
        <ChatList
          conversations={mockConversations}
          loading={false}
          onConversationPress={jest.fn()}
        />,
      );

      expect(getAllByText('J').length).toBeGreaterThan(0); // john_doe avatar
    });

    it('displays uppercase letter', () => {
      const conversations: Conversation[] = [
        {
          ...mockConversations[0],
          participant_username: 'alice',
        },
      ];

      const { getByText } = render(
        <ChatList conversations={conversations} loading={false} onConversationPress={jest.fn()} />,
      );

      expect(getByText('A')).toBeTruthy();
    });
  });
});
