import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useUserCollections,
  useCollectionById,
  useDeleteCollection,
} from '../../hooks/useCollectionQueries';
import { collectionService } from '../../services/collection.service';
import { storage } from '../../utils/storage';

jest.mock('../../services/collection.service', () => ({
  collectionService: {
    getUserCollections: jest.fn(),
    getCollectionById: jest.fn(),
    deleteCollection: jest.fn(),
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

describe('useUserCollections', () => {
  it('calls getUserCollections with the token from storage', async () => {
    (collectionService.getUserCollections as jest.Mock).mockResolvedValue({
      data: { collections: [] },
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUserCollections(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(collectionService.getUserCollections).toHaveBeenCalledWith('test-token');
  });
});

describe('useCollectionById', () => {
  it('calls getCollectionById with the id and token', async () => {
    (collectionService.getCollectionById as jest.Mock).mockResolvedValue({
      data: { collection: {} },
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCollectionById(5), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(collectionService.getCollectionById).toHaveBeenCalledWith(5, 'test-token');
  });

  it('does NOT call getCollectionById when id is 0', async () => {
    const { wrapper } = createWrapper();

    renderHook(() => useCollectionById(0), { wrapper });

    await new Promise((r) => setTimeout(r, 50));
    expect(collectionService.getCollectionById).not.toHaveBeenCalled();
  });
});

describe('useDeleteCollection', () => {
  it('calls deleteCollection with the id and token', async () => {
    (collectionService.deleteCollection as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDeleteCollection(), { wrapper });

    await act(async () => {
      result.current.mutate(3);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(collectionService.deleteCollection).toHaveBeenCalledWith(3, 'test-token');
  });

  it('invalidates collections.all on success', async () => {
    (collectionService.deleteCollection as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteCollection(), { wrapper });

    await act(async () => {
      result.current.mutate(3);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['collections'] });
  });
});
