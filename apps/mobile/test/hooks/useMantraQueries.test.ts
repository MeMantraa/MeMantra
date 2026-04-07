import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLikedMantras, useSavedMantras } from '../../hooks/useMantraQueries';
import { mantraService } from '../../services/mantra.service';
import { storage } from '../../utils/storage';

jest.mock('../../services/mantra.service', () => ({
  mantraService: {
    getLikedMantras: jest.fn(),
    getSavedMantras: jest.fn(),
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
