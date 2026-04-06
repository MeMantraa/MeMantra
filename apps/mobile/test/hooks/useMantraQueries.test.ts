import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFeedMantras,
  useAllMantras,
  useMantraById,
  useLikedMantras,
  useSavedMantras,
  useLikeMantra,
  useUnlikeMantra,
  useSaveMantra,
  useUnsaveMantra,
} from '../../hooks/useMantraQueries';
import { mantraService } from '../../services/mantra.service';
import { storage } from '../../utils/storage';

jest.mock('../../services/mantra.service', () => ({
  mantraService: {
    getFeedMantras: jest.fn(),
    getAllMantras: jest.fn(),
    getMantraById: jest.fn(),
    getLikedMantras: jest.fn(),
    getSavedMantras: jest.fn(),
    likeMantra: jest.fn(),
    unlikeMantra: jest.fn(),
    saveMantra: jest.fn(),
    unsaveMantra: jest.fn(),
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

describe('useFeedMantras', () => {
  it('calls getFeedMantras with the token from storage', async () => {
    (mantraService.getFeedMantras as jest.Mock).mockResolvedValue({ data: { mantras: [] } });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useFeedMantras(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mantraService.getFeedMantras).toHaveBeenCalledWith('test-token');
  });

  it('returns data from the service', async () => {
    const mockData = { data: { mantras: [{ mantra_id: 1, text: 'hello' }] } };
    (mantraService.getFeedMantras as jest.Mock).mockResolvedValue(mockData);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useFeedMantras(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });
});

describe('useAllMantras', () => {
  it('calls getAllMantras with the token from storage', async () => {
    (mantraService.getAllMantras as jest.Mock).mockResolvedValue({ data: { mantras: [] } });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAllMantras(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mantraService.getAllMantras).toHaveBeenCalledWith('test-token');
  });
});

describe('useMantraById', () => {
  it('calls getMantraById with the token and id', async () => {
    (mantraService.getMantraById as jest.Mock).mockResolvedValue({ data: { mantra: {} } });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMantraById(42), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mantraService.getMantraById).toHaveBeenCalledWith(42, 'test-token');
  });

  it('does NOT call getMantraById when id is 0', async () => {
    const { wrapper } = createWrapper();

    renderHook(() => useMantraById(0), { wrapper });

    await new Promise((r) => setTimeout(r, 50));
    expect(mantraService.getMantraById).not.toHaveBeenCalled();
  });
});

describe('useLikedMantras', () => {
  it('calls getLikedMantras with the token from storage', async () => {
    (mantraService.getLikedMantras as jest.Mock).mockResolvedValue({ data: { mantras: [] } });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useLikedMantras(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mantraService.getLikedMantras).toHaveBeenCalledWith('test-token');
  });
});

describe('useSavedMantras', () => {
  it('calls getSavedMantras with the token from storage', async () => {
    (mantraService.getSavedMantras as jest.Mock).mockResolvedValue([]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSavedMantras(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mantraService.getSavedMantras).toHaveBeenCalledWith('test-token');
  });
});

describe('useLikeMantra', () => {
  it('calls likeMantra with the id and token', async () => {
    (mantraService.likeMantra as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useLikeMantra(), { wrapper });

    await act(async () => {
      result.current.mutate(5);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mantraService.likeMantra).toHaveBeenCalledWith(5, 'test-token');
  });

  it('invalidates feed and liked query keys on success', async () => {
    (mantraService.likeMantra as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useLikeMantra(), { wrapper });

    await act(async () => {
      result.current.mutate(5);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['mantras', 'feed'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['mantras', 'liked'] });
  });
});

describe('useUnlikeMantra', () => {
  it('calls unlikeMantra with the id and token', async () => {
    (mantraService.unlikeMantra as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUnlikeMantra(), { wrapper });

    await act(async () => {
      result.current.mutate(7);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mantraService.unlikeMantra).toHaveBeenCalledWith(7, 'test-token');
  });

  it('invalidates feed and liked query keys on success', async () => {
    (mantraService.unlikeMantra as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUnlikeMantra(), { wrapper });

    await act(async () => {
      result.current.mutate(7);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['mantras', 'feed'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['mantras', 'liked'] });
  });
});

describe('useSaveMantra', () => {
  it('calls saveMantra with the id and token', async () => {
    (mantraService.saveMantra as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSaveMantra(), { wrapper });

    await act(async () => {
      result.current.mutate(3);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mantraService.saveMantra).toHaveBeenCalledWith(3, 'test-token');
  });

  it('invalidates feed, saved, and collections query keys on success', async () => {
    (mantraService.saveMantra as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSaveMantra(), { wrapper });

    await act(async () => {
      result.current.mutate(3);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['mantras', 'feed'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['mantras', 'saved'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['collections'] });
  });
});

describe('useUnsaveMantra', () => {
  it('calls unsaveMantra with the id and token', async () => {
    (mantraService.unsaveMantra as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUnsaveMantra(), { wrapper });

    await act(async () => {
      result.current.mutate(3);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mantraService.unsaveMantra).toHaveBeenCalledWith(3, 'test-token');
  });

  it('invalidates feed, saved, and collections query keys on success', async () => {
    (mantraService.unsaveMantra as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUnsaveMantra(), { wrapper });

    await act(async () => {
      result.current.mutate(3);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['mantras', 'feed'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['mantras', 'saved'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['collections'] });
  });
});
