import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import NewConversationScreen from '../../screens/NewConversationScreen';
import { userService } from '../../services/user.service';
import { chatService } from '../../services/chat.service';
import { storage } from '../../utils/storage';

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

jest.mock('../../services/user.service');
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

describe('NewConversationScreen', () => {
  const mockNavigation = {
    goBack: jest.fn(),
    replace: jest.fn(),
  };

  const mockUsers = [
    {
      user_id: 2,
      username: 'john_doe',
      email: 'john@example.com',
      created_at: new Date().toISOString(),
    },
    {
      user_id: 3,
      username: 'jane_smith',
      email: 'jane@example.com',
      created_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getToken as jest.Mock).mockResolvedValue('mock-token');
    (storage.getUserId as jest.Mock).mockResolvedValue(1);
  });

  it('renders loading state initially', () => {
    (userService.getAllUsers as jest.Mock).mockReturnValue(new Promise(() => {}));

    const { getByText } = render(<NewConversationScreen navigation={mockNavigation} />);

    expect(getByText('Loading users...')).toBeTruthy();
  });

  it('loads and displays users', async () => {
    (userService.getAllUsers as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { users: mockUsers },
    });

    const { getByText } = render(<NewConversationScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(getByText('john_doe')).toBeTruthy();
      expect(getByText('jane_smith')).toBeTruthy();
    });
  });

  it('filters out current user from the list', async () => {
    const usersWithCurrentUser = [
      ...mockUsers,
      {
        user_id: 1,
        username: 'current_user',
        email: 'current@example.com',
        created_at: new Date().toISOString(),
      },
    ];

    (userService.getAllUsers as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { users: usersWithCurrentUser },
    });

    const { getByText, queryByText } = render(
      <NewConversationScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByText('john_doe')).toBeTruthy();
      expect(queryByText('current_user')).toBeNull();
    });
  });

  it('filters users by username when searching', async () => {
    (userService.getAllUsers as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { users: mockUsers },
    });

    const { getByPlaceholderText, getByText, queryByText } = render(
      <NewConversationScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByText('john_doe')).toBeTruthy();
    });

    const searchInput = getByPlaceholderText('Search users...');
    fireEvent.changeText(searchInput, 'john');

    await waitFor(() => {
      expect(getByText('john_doe')).toBeTruthy();
      expect(queryByText('jane_smith')).toBeNull();
    });
  });

  it('filters users by email when searching', async () => {
    (userService.getAllUsers as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { users: mockUsers },
    });

    const { getByPlaceholderText, getByText, queryByText } = render(
      <NewConversationScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByText('john_doe')).toBeTruthy();
    });

    const searchInput = getByPlaceholderText('Search users...');
    fireEvent.changeText(searchInput, 'jane@');

    await waitFor(() => {
      expect(getByText('jane_smith')).toBeTruthy();
      expect(queryByText('john_doe')).toBeNull();
    });
  });

  it('shows no users found message when search has no results', async () => {
    (userService.getAllUsers as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { users: mockUsers },
    });

    const { getByPlaceholderText, getByText } = render(
      <NewConversationScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByText('john_doe')).toBeTruthy();
    });

    const searchInput = getByPlaceholderText('Search users...');
    fireEvent.changeText(searchInput, 'nonexistent');

    await waitFor(() => {
      expect(getByText('No users found')).toBeTruthy();
    });
  });

  it('creates conversation and navigates when user is selected', async () => {
    (userService.getAllUsers as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { users: mockUsers },
    });

    const mockConversation = {
      conversation_id: 1,
      participant_id: 2,
      participant_username: 'john_doe',
      last_message: '',
      last_message_time: new Date().toISOString(),
      unread_count: 0,
    };

    (chatService.createConversation as jest.Mock).mockResolvedValue(mockConversation);

    const { getByText } = render(<NewConversationScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(getByText('john_doe')).toBeTruthy();
    });

    fireEvent.press(getByText('john_doe'));

    await waitFor(() => {
      expect(chatService.createConversation).toHaveBeenCalledWith(
        { participant_id: 2 },
        'mock-token',
      );
      expect(mockNavigation.replace).toHaveBeenCalledWith('Conversation', {
        conversation: mockConversation,
      });
    });
  });

  it('displays user avatar with first letter of username', async () => {
    (userService.getAllUsers as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { users: mockUsers },
    });

    const { getAllByText } = render(<NewConversationScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(getAllByText('J').length).toBeGreaterThan(0); // john_doe avatar
    });
  });

  it('handles users with null username gracefully', async () => {
    const usersWithNullName = [
      {
        user_id: 2,
        username: null,
        email: 'unknown@example.com',
        created_at: new Date().toISOString(),
      },
    ];

    (userService.getAllUsers as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { users: usersWithNullName },
    });

    const { getByText } = render(<NewConversationScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(getByText('Unknown User')).toBeTruthy();
    });
  });

  it('navigates back when back button is pressed', async () => {
    (userService.getAllUsers as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { users: mockUsers },
    });

    const { getByText } = render(<NewConversationScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(getByText('john_doe')).toBeTruthy();
    });

    fireEvent.press(getByText('← Back'));

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('shows "No users available" when user list is empty', async () => {
    (userService.getAllUsers as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { users: [] },
    });

    const { getByText } = render(<NewConversationScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(getByText('No users available')).toBeTruthy();
    });
  });
});
