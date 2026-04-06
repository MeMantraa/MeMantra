import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserRating, useAverageRating, useRateMantra } from '../../hooks/useRatingQueries';
import { ratingService } from '../../services/rating.service';
import { storage } from '../../utils/storage';

jest.mock('../../services/rating.service', () => ({
  ratingService: {
    getUserRating: jest.fn(),
    getAverageRating: jest.fn(),
    rateMantra: jest.fn(),
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

describe('useUserRating', () => {
  it('calls getUserRating with the mantraId and token', async () => {
    (ratingService.getUserRating as jest.Mock).mockResolvedValue({ data: { rating: null } });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUserRating(12), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(ratingService.getUserRating).toHaveBeenCalledWith(12, 'test-token');
  });

  it('does NOT call getUserRating when mantraId is 0', async () => {
    const { wrapper } = createWrapper();

    renderHook(() => useUserRating(0), { wrapper });

    await new Promise((r) => setTimeout(r, 50));
    expect(ratingService.getUserRating).not.toHaveBeenCalled();
  });
});

describe('useAverageRating', () => {
  it('calls getAverageRating with the mantraId (no token)', async () => {
    (ratingService.getAverageRating as jest.Mock).mockResolvedValue({ data: { average: 4.2 } });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAverageRating(12), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(ratingService.getAverageRating).toHaveBeenCalledWith(12);
    expect(ratingService.getAverageRating).not.toHaveBeenCalledWith(12, expect.anything());
  });

  it('does NOT call getAverageRating when mantraId is 0', async () => {
    const { wrapper } = createWrapper();

    renderHook(() => useAverageRating(0), { wrapper });

    await new Promise((r) => setTimeout(r, 50));
    expect(ratingService.getAverageRating).not.toHaveBeenCalled();
  });
});

describe('useRateMantra', () => {
  it('calls rateMantra with the right args and token', async () => {
    (ratingService.rateMantra as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRateMantra(), { wrapper });

    await act(async () => {
      result.current.mutate({ mantraId: 12, rating: 5, reviewText: 'Great mantra' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(ratingService.rateMantra).toHaveBeenCalledWith(12, 5, 'Great mantra', 'test-token');
  });

  it('calls rateMantra without reviewText when omitted', async () => {
    (ratingService.rateMantra as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRateMantra(), { wrapper });

    await act(async () => {
      result.current.mutate({ mantraId: 12, rating: 4 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(ratingService.rateMantra).toHaveBeenCalledWith(12, 4, undefined, 'test-token');
  });

  it('invalidates ratings.forMantra and ratings.average on success', async () => {
    (ratingService.rateMantra as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRateMantra(), { wrapper });

    await act(async () => {
      result.current.mutate({ mantraId: 12, rating: 5 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['ratings', 'mantra', 12] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['ratings', 'average', 12] });
  });
});
