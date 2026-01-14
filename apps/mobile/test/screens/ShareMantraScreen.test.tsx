import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ShareMantraScreen from '../../screens/ShareMantraScreen';
import { chatService } from '../../services/chat.service';
import { storage } from '../../utils/storage';
import { Alert } from 'react-native';

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

describe('ShareMantraScreen', () => {
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

  const mockNavigation = {
    setOptions: jest.fn(),
    navigate: jest.fn(),
  };

  const mockRoute = {
    params: {
      mantra: mockMantra,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getToken as jest.Mock).mockResolvedValue('mock-token');
  });

  it('sets screen title on mount', () => {
    (chatService.getConversations as jest.Mock).mockResolvedValue([]);

    render(<ShareMantraScreen route={mockRoute} navigation={mockNavigation} />);

    expect(mockNavigation.setOptions).toHaveBeenCalledWith({ title: 'Share mantra' });
  });

  it('renders loading state initially', () => {
    (chatService.getConversations as jest.Mock).mockReturnValue(new Promise(() => {}));

    const { getByText } = render(
      <ShareMantraScreen route={mockRoute} navigation={mockNavigation} />,
    );

    expect(getByText('Loading conversations...')).toBeTruthy();
  });

  it('loads and displays conversations', async () => {
    (chatService.getConversations as jest.Mock).mockResolvedValue(mockConversations);

    const { getByText } = render(
      <ShareMantraScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByText('john_doe')).toBeTruthy();
      expect(getByText('jane_smith')).toBeTruthy();
    });
  });

  it('displays instruction text', async () => {
    (chatService.getConversations as jest.Mock).mockResolvedValue(mockConversations);

    const { getByText } = render(
      <ShareMantraScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByText('Select a conversation to share:')).toBeTruthy();
    });
  });

  it('sends mantra to selected conversation and navigates', async () => {
    (chatService.getConversations as jest.Mock).mockResolvedValue(mockConversations);
    (chatService.sendMessage as jest.Mock).mockResolvedValue({
      message_id: 1,
      conversation_id: 1,
      sender_id: 1,
      content: JSON.stringify({
        type: 'mantra_share',
        mantra_id: 123,
        text: 'Peace begins with a smile',
      }),
      created_at: new Date().toISOString(),
      read: false,
    });

    const { getByText } = render(
      <ShareMantraScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByText('john_doe')).toBeTruthy();
    });

    fireEvent.press(getByText('john_doe'));

    await waitFor(() => {
      expect(chatService.sendMessage).toHaveBeenCalledWith(
        {
          conversation_id: 1,
          content: JSON.stringify({
            type: 'mantra_share',
            mantra_id: 123,
            text: 'Peace begins with a smile',
          }),
        },
        'mock-token',
      );

      expect(mockNavigation.navigate).toHaveBeenCalledWith('MainApp', {
        screen: 'Home',
        params: { returnToMantraId: 123 },
      });
    });
  });

  it('handles error when sending mantra fails', async () => {
    (chatService.getConversations as jest.Mock).mockResolvedValue(mockConversations);
    (chatService.sendMessage as jest.Mock).mockRejectedValue(new Error('Send failed'));

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText } = render(
      <ShareMantraScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByText('john_doe')).toBeTruthy();
    });

    const conversationButton = getByText('john_doe');
    fireEvent.press(conversationButton);

    await waitFor(() => {
      expect(chatService.sendMessage).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to share the mantra');
    });

    alertSpy.mockRestore();
  });

  it('handles error when loading conversations fails', async () => {
    (chatService.getConversations as jest.Mock).mockRejectedValue(new Error('Network error'));

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { queryByText } = render(
      <ShareMantraScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(
      () => {
        expect(queryByText('Loading conversations...')).toBeNull();
        expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to load conversations');
      },
      { timeout: 3000 },
    );

    alertSpy.mockRestore();
  });

  it('shows empty state when no conversations', async () => {
    (chatService.getConversations as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(
      <ShareMantraScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByText(/No conversations yet/)).toBeTruthy();
    });
  });

  it('creates correct mantra share payload', async () => {
    (chatService.getConversations as jest.Mock).mockResolvedValue(mockConversations);
    (chatService.sendMessage as jest.Mock).mockResolvedValue({});

    const { getByText } = render(
      <ShareMantraScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByText('jane_smith')).toBeTruthy();
    });

    fireEvent.press(getByText('jane_smith'));

    await waitFor(() => {
      const expectedPayload = JSON.stringify({
        type: 'mantra_share',
        mantra_id: 123,
        text: 'Peace begins with a smile',
      });

      expect(chatService.sendMessage).toHaveBeenCalledWith(
        {
          conversation_id: 2,
          content: expectedPayload,
        },
        'mock-token',
      );
    });
  });

  it('uses correct token from storage', async () => {
    (storage.getToken as jest.Mock).mockResolvedValue('custom-token-456');
    (chatService.getConversations as jest.Mock).mockResolvedValue([]);

    render(<ShareMantraScreen route={mockRoute} navigation={mockNavigation} />);

    await waitFor(() => {
      expect(chatService.getConversations).toHaveBeenCalledWith('custom-token-456');
    });
  });
});
