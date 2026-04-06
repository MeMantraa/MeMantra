import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useUserCollections,
  useCollectionById,
  useCreateCollection,
  useUpdateCollection,
  useDeleteCollection,
  useAddMantraToCollection,
  useRemoveMantraFromCollection,
} from '../../hooks/useCollectionQueries';
import { collectionService } from '../../services/collection.service';
import { storage } from '../../utils/storage';

jest.mock('../../services/collection.service', () => ({
  collectionService: {
    getUserCollections: jest.fn(),
    getCollectionById: jest.fn(),
    createCollection: jest.fn(),
    updateCollection: jest.fn(),
    deleteCollection: jest.fn(),
    addMantraToCollection: jest.fn(),
    removeMantraFromCollection: jest.fn(),
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

describe('useCreateCollection', () => {
  it('calls createCollection with the right args and token', async () => {
    (collectionService.createCollection as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateCollection(), { wrapper });

    await act(async () => {
      result.current.mutate({ name: 'Morning', description: 'AM mantras', icon: '🌅' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(collectionService.createCollection).toHaveBeenCalledWith(
      'Morning',
      'AM mantras',
      'test-token',
      '🌅',
    );
  });

  it('invalidates collections.all on success', async () => {
    (collectionService.createCollection as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateCollection(), { wrapper });

    await act(async () => {
      result.current.mutate({ name: 'Evening' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['collections'] });
  });
});

describe('useUpdateCollection', () => {
  it('calls updateCollection with the right args and token', async () => {
    (collectionService.updateCollection as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUpdateCollection(), { wrapper });

    await act(async () => {
      result.current.mutate({ collectionId: 2, updates: { name: 'Updated' } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(collectionService.updateCollection).toHaveBeenCalledWith(
      2,
      { name: 'Updated' },
      'test-token',
    );
  });

  it('invalidates collections.all and collections.detail on success', async () => {
    (collectionService.updateCollection as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateCollection(), { wrapper });

    await act(async () => {
      result.current.mutate({ collectionId: 2, updates: { name: 'Updated' } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['collections'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['collections', 2] });
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

describe('useAddMantraToCollection', () => {
  it('calls addMantraToCollection with the right args and token', async () => {
    (collectionService.addMantraToCollection as jest.Mock).mockResolvedValue({
      status: 'success',
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAddMantraToCollection(), { wrapper });

    await act(async () => {
      result.current.mutate({ collectionId: 4, mantraId: 10 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(collectionService.addMantraToCollection).toHaveBeenCalledWith(4, 10, 'test-token');
  });

  it('invalidates collections.all and collections.detail on success', async () => {
    (collectionService.addMantraToCollection as jest.Mock).mockResolvedValue({
      status: 'success',
    });
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useAddMantraToCollection(), { wrapper });

    await act(async () => {
      result.current.mutate({ collectionId: 4, mantraId: 10 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['collections'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['collections', 4] });
  });
});

describe('useRemoveMantraFromCollection', () => {
  it('calls removeMantraFromCollection with the right args and token', async () => {
    (collectionService.removeMantraFromCollection as jest.Mock).mockResolvedValue({
      status: 'success',
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRemoveMantraFromCollection(), { wrapper });

    await act(async () => {
      result.current.mutate({ collectionId: 4, mantraId: 10 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(collectionService.removeMantraFromCollection).toHaveBeenCalledWith(4, 10, 'test-token');
  });

  it('invalidates collections.all and collections.detail on success', async () => {
    (collectionService.removeMantraFromCollection as jest.Mock).mockResolvedValue({
      status: 'success',
    });
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRemoveMantraFromCollection(), { wrapper });

    await act(async () => {
      result.current.mutate({ collectionId: 4, mantraId: 10 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['collections'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['collections', 4] });
  });
});
