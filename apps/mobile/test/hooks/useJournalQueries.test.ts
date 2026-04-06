import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useJournalEntries,
  useJournalEntryById,
  useJournalEntriesByMantra,
  useJournalStats,
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useDeleteJournalEntry,
} from '../../hooks/useJournalQueries';
import { journalService } from '../../services/journal.service';
import { storage } from '../../utils/storage';

jest.mock('../../services/journal.service', () => ({
  journalService: {
    getJournalEntries: jest.fn(),
    getJournalEntryById: jest.fn(),
    getJournalEntriesByMantra: jest.fn(),
    getJournalStats: jest.fn(),
    createJournalEntry: jest.fn(),
    updateJournalEntry: jest.fn(),
    deleteJournalEntry: jest.fn(),
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

describe('useJournalEntries', () => {
  it('calls getJournalEntries with the token from storage', async () => {
    (journalService.getJournalEntries as jest.Mock).mockResolvedValue({ data: { entries: [] } });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useJournalEntries(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(journalService.getJournalEntries).toHaveBeenCalledWith('test-token', undefined);
  });

  it('passes options to getJournalEntries', async () => {
    (journalService.getJournalEntries as jest.Mock).mockResolvedValue({ data: { entries: [] } });
    const { wrapper } = createWrapper();
    const options = { search: 'calm', limit: 10 };

    const { result } = renderHook(() => useJournalEntries(options), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(journalService.getJournalEntries).toHaveBeenCalledWith('test-token', options);
  });
});

describe('useJournalEntryById', () => {
  it('calls getJournalEntryById with the id and token', async () => {
    (journalService.getJournalEntryById as jest.Mock).mockResolvedValue({ data: { entry: {} } });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useJournalEntryById(11), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(journalService.getJournalEntryById).toHaveBeenCalledWith(11, 'test-token');
  });

  it('does NOT call getJournalEntryById when id is 0', async () => {
    const { wrapper } = createWrapper();

    renderHook(() => useJournalEntryById(0), { wrapper });

    await new Promise((r) => setTimeout(r, 50));
    expect(journalService.getJournalEntryById).not.toHaveBeenCalled();
  });
});

describe('useJournalEntriesByMantra', () => {
  it('calls getJournalEntriesByMantra with the mantraId and token', async () => {
    (journalService.getJournalEntriesByMantra as jest.Mock).mockResolvedValue({
      data: { entries: [] },
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useJournalEntriesByMantra(5), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(journalService.getJournalEntriesByMantra).toHaveBeenCalledWith(5, 'test-token');
  });

  it('does NOT call getJournalEntriesByMantra when mantraId is 0', async () => {
    const { wrapper } = createWrapper();

    renderHook(() => useJournalEntriesByMantra(0), { wrapper });

    await new Promise((r) => setTimeout(r, 50));
    expect(journalService.getJournalEntriesByMantra).not.toHaveBeenCalled();
  });
});

describe('useJournalStats', () => {
  it('calls getJournalStats with the token from storage', async () => {
    (journalService.getJournalStats as jest.Mock).mockResolvedValue({ data: { stats: {} } });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useJournalStats(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(journalService.getJournalStats).toHaveBeenCalledWith('test-token');
  });
});

describe('useCreateJournalEntry', () => {
  it('calls createJournalEntry with the payload and token', async () => {
    (journalService.createJournalEntry as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper } = createWrapper();
    const payload = { mantra_id: 1, content: 'Today I felt calm', mood: 'happy' as const };

    const { result } = renderHook(() => useCreateJournalEntry(), { wrapper });

    await act(async () => {
      result.current.mutate(payload);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(journalService.createJournalEntry).toHaveBeenCalledWith(payload, 'test-token');
  });

  it('invalidates journal.all and journal.stats on success', async () => {
    (journalService.createJournalEntry as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const payload = { mantra_id: 1, content: 'Today I felt calm', mood: 'happy' as const };

    const { result } = renderHook(() => useCreateJournalEntry(), { wrapper });

    await act(async () => {
      result.current.mutate(payload);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['journal'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['journal', 'stats'] });
  });
});

describe('useUpdateJournalEntry', () => {
  it('calls updateJournalEntry with the right args and token', async () => {
    (journalService.updateJournalEntry as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUpdateJournalEntry(), { wrapper });

    await act(async () => {
      result.current.mutate({ journalId: 3, payload: { content: 'Updated entry' } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(journalService.updateJournalEntry).toHaveBeenCalledWith(
      3,
      { content: 'Updated entry' },
      'test-token',
    );
  });

  it('invalidates journal.all, journal.detail, and journal.stats on success', async () => {
    (journalService.updateJournalEntry as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateJournalEntry(), { wrapper });

    await act(async () => {
      result.current.mutate({ journalId: 3, payload: { content: 'Updated entry' } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['journal'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['journal', 3] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['journal', 'stats'] });
  });
});

describe('useDeleteJournalEntry', () => {
  it('calls deleteJournalEntry with the id and token', async () => {
    (journalService.deleteJournalEntry as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDeleteJournalEntry(), { wrapper });

    await act(async () => {
      result.current.mutate(6);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(journalService.deleteJournalEntry).toHaveBeenCalledWith(6, 'test-token');
  });

  it('invalidates journal.all and journal.stats on success', async () => {
    (journalService.deleteJournalEntry as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteJournalEntry(), { wrapper });

    await act(async () => {
      result.current.mutate(6);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['journal'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['journal', 'stats'] });
  });
});
