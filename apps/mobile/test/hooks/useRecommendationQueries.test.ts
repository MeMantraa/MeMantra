import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRecommendations } from '../../hooks/useRecommendationQueries';
import { recommendationService } from '../../services/recommendation.service';

jest.mock('../../services/recommendation.service', () => ({
  recommendationService: {
    getSuggestions: jest.fn(),
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
});

describe('useRecommendations', () => {
  it('calls getSuggestions with no params by default', async () => {
    (recommendationService.getSuggestions as jest.Mock).mockResolvedValue({
      data: { suggestions: [] },
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRecommendations(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(recommendationService.getSuggestions).toHaveBeenCalledWith({});
  });

  it('passes params to getSuggestions', async () => {
    (recommendationService.getSuggestions as jest.Mock).mockResolvedValue({
      data: { suggestions: [] },
    });
    const { wrapper } = createWrapper();
    const params = { limit: 5, category_id: 2 };

    const { result } = renderHook(() => useRecommendations(params), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(recommendationService.getSuggestions).toHaveBeenCalledWith(params);
  });

  it('returns data from the service', async () => {
    const mockData = { data: { suggestions: [{ mantra_id: 1, text: 'Be present' }] } };
    (recommendationService.getSuggestions as jest.Mock).mockResolvedValue(mockData);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRecommendations(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });

  it('does not require a token (no storage import)', async () => {
    (recommendationService.getSuggestions as jest.Mock).mockResolvedValue({
      data: { suggestions: [] },
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRecommendations(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // Verify the service was called directly without any auth token argument
    expect(recommendationService.getSuggestions).toHaveBeenCalledTimes(1);
    const callArgs = (recommendationService.getSuggestions as jest.Mock).mock.calls[0];
    expect(callArgs).toHaveLength(1);
  });
});
