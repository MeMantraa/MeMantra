import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ShareMantraScreen from '../../screens/ShareMantraScreen';
import { useConversations, useSendMessage } from '../../hooks';
import { Alert } from 'react-native';

jest.mock('../../hooks', () => ({
  useConversations: jest.fn(),
  useSendMessage: jest.fn(),
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

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('../../components/UI/textWrapper', () => {
  const { Text } = jest.requireActual('react-native');
  return ({ children, ...props }: any) => <Text {...props}>{children}</Text>;
});

jest.mock('../../components/chat/ChatList', () => {
  const { View, TouchableOpacity, Text } = jest.requireActual('react-native');
  return ({ conversations, loading, onConversationPress }: any) => {
    if (loading) return <View testID="chat-loading" />;
    return (
      <View>
        {conversations.map((c: any) => (
          <TouchableOpacity key={c.conversation_id} onPress={() => onConversationPress(c)}>
            <Text>{c.participant_username}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
});

const mockMantra = {
  mantra_id: 123,
  title: 'Peace begins with a smile',
  category: 'Peace',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockConversations = [
  {
    conversation_id: 1,
    participant_id: 2,
    participant_username: 'john_doe',
    participant_email: 'john@example.com',
    last_message: 'Hey!',
    last_message_time: new Date().toISOString(),
    unread_count: 1,
  },
  {
    conversation_id: 2,
    participant_id: 3,
    participant_username: 'jane_smith',
    participant_email: 'jane@example.com',
    last_message: 'Thanks!',
    last_message_time: new Date().toISOString(),
    unread_count: 0,
  },
];

const mockNavigation = { setOptions: jest.fn(), navigate: jest.fn(), goBack: jest.fn() };
const mockRoute = { params: { mantra: mockMantra } };
const mockMutate = jest.fn();

describe('ShareMantraScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useConversations as jest.Mock).mockReturnValue({
      data: mockConversations,
      isLoading: false,
    });
    (useSendMessage as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  it('sets screen title on mount', () => {
    render(<ShareMantraScreen route={mockRoute} navigation={mockNavigation} />);
    expect(mockNavigation.setOptions).toHaveBeenCalledWith({ title: 'Share mantra' });
  });

  it('displays instruction text', () => {
    const { getByText } = render(
      <ShareMantraScreen route={mockRoute} navigation={mockNavigation} />,
    );
    expect(getByText('Select a conversation to share:')).toBeTruthy();
  });

  it('shows loading state when isLoading', () => {
    (useConversations as jest.Mock).mockReturnValue({
      data: [],
      isLoading: true,
    });
    const { getByTestId } = render(
      <ShareMantraScreen route={mockRoute} navigation={mockNavigation} />,
    );
    expect(getByTestId('chat-loading')).toBeTruthy();
  });

  it('calls sendMessage mutate when conversation is pressed', () => {
    const { getByText } = render(
      <ShareMantraScreen route={mockRoute} navigation={mockNavigation} />,
    );
    fireEvent.press(getByText('john_doe'));
    expect(mockMutate).toHaveBeenCalledWith(
      {
        conversationId: 1,
        content: JSON.stringify({
          type: 'mantra_share',
          mantra_id: 123,
          text: 'Peace begins with a smile',
        }),
      },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
  });

  it('navigates to MainApp on send success', () => {
    mockMutate.mockImplementation((_args: any, options: any) => {
      options?.onSuccess?.();
    });
    const { getByText } = render(
      <ShareMantraScreen route={mockRoute} navigation={mockNavigation} />,
    );
    fireEvent.press(getByText('john_doe'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('MainApp', {
      screen: 'Home',
      params: { returnToMantraId: 123 },
    });
  });

  it('shows error alert on send failure', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockMutate.mockImplementation((_args: any, options: any) => {
      options?.onError?.();
    });
    const { getByText } = render(
      <ShareMantraScreen route={mockRoute} navigation={mockNavigation} />,
    );
    fireEvent.press(getByText('john_doe'));
    expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to share the mantra');
    alertSpy.mockRestore();
  });
});
