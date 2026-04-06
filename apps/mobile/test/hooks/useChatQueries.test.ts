import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useConversations, useSendMessage } from '../../hooks/useChatQueries';
import { chatService } from '../../services/chat.service';
import { storage } from '../../utils/storage';

jest.mock('../../services/chat.service', () => ({
  chatService: {
    getConversations: jest.fn(),
    sendMessage: jest.fn(),
  },
}));

jest.mock('../../utils/storage', () => ({
  storage: {
    getToken: jest.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { wrapper, queryClient };
};

beforeEach(() => {
  jest.clearAllMocks();
  (storage.getToken as jest.Mock).mockResolvedValue('test-token');
});

describe('useConversations', () => {
  it('calls getConversations with the token from storage', async () => {
    (chatService.getConversations as jest.Mock).mockResolvedValue({ data: { conversations: [] } });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useConversations(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(chatService.getConversations).toHaveBeenCalledWith('test-token');
  });

  it('returns data from the service', async () => {
    const mockData = { data: { conversations: [{ conversation_id: 1 }] } };
    (chatService.getConversations as jest.Mock).mockResolvedValue(mockData);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useConversations(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });
});

describe('useSendMessage', () => {
  it('calls sendMessage with the right args and token', async () => {
    (chatService.sendMessage as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSendMessage(), { wrapper });

    await act(async () => {
      result.current.mutate({ conversationId: 7, content: 'Hello world' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(chatService.sendMessage).toHaveBeenCalledWith(
      { conversation_id: 7, content: 'Hello world' },
      'test-token',
    );
  });

  it('invalidates chat.messages and chat.conversations on success', async () => {
    (chatService.sendMessage as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSendMessage(), { wrapper });

    await act(async () => {
      result.current.mutate({ conversationId: 7, content: 'Hello world' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['chat', 'messages', 7] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['chat', 'conversations'] });
  });
});
