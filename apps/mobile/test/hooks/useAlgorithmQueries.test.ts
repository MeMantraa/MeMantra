import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useAlgorithmScores,
  useTopCategories,
  useUpdateAlgorithmScore,
  useResetAlgorithmScore,
  useResetAllAlgorithmScores,
} from '../../hooks/useAlgorithmQueries';
import { algorithmService } from '../../services/algorithm.service';
import { storage } from '../../utils/storage';

jest.mock('../../services/algorithm.service', () => ({
  algorithmService: {
    getScores: jest.fn(),
    getTopCategories: jest.fn(),
    updateScore: jest.fn(),
    resetScore: jest.fn(),
    resetAllScores: jest.fn(),
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

describe('useAlgorithmScores', () => {
  it('calls getScores with the token from storage', async () => {
    (algorithmService.getScores as jest.Mock).mockResolvedValue({ data: { scores: [] } });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAlgorithmScores(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(algorithmService.getScores).toHaveBeenCalledWith('test-token');
  });

  it('returns data from the service', async () => {
    const mockData = { data: { scores: [{ category_id: 1, score: 0.8 }] } };
    (algorithmService.getScores as jest.Mock).mockResolvedValue(mockData);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAlgorithmScores(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });
});

describe('useTopCategories', () => {
  it('calls getTopCategories with the token and limit', async () => {
    (algorithmService.getTopCategories as jest.Mock).mockResolvedValue({
      data: { categories: [] },
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useTopCategories(5), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(algorithmService.getTopCategories).toHaveBeenCalledWith('test-token', 5);
  });

  it('uses default limit of 10', async () => {
    (algorithmService.getTopCategories as jest.Mock).mockResolvedValue({
      data: { categories: [] },
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useTopCategories(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(algorithmService.getTopCategories).toHaveBeenCalledWith('test-token', 10);
  });
});

describe('useUpdateAlgorithmScore', () => {
  it('calls updateScore with the right args and token', async () => {
    (algorithmService.updateScore as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUpdateAlgorithmScore(), { wrapper });

    await act(async () => {
      result.current.mutate({ categoryId: 3, score: 0.9 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(algorithmService.updateScore).toHaveBeenCalledWith('test-token', 3, 0.9);
  });

  it('invalidates algorithm.scores on success', async () => {
    (algorithmService.updateScore as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateAlgorithmScore(), { wrapper });

    await act(async () => {
      result.current.mutate({ categoryId: 3, score: 0.9 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['algorithm', 'scores'] });
  });
});

describe('useResetAlgorithmScore', () => {
  it('calls resetScore with the categoryId and token', async () => {
    (algorithmService.resetScore as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useResetAlgorithmScore(), { wrapper });

    await act(async () => {
      result.current.mutate(4);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(algorithmService.resetScore).toHaveBeenCalledWith('test-token', 4);
  });

  it('invalidates algorithm.scores on success', async () => {
    (algorithmService.resetScore as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useResetAlgorithmScore(), { wrapper });

    await act(async () => {
      result.current.mutate(4);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['algorithm', 'scores'] });
  });
});

describe('useResetAllAlgorithmScores', () => {
  it('calls resetAllScores with the token', async () => {
    (algorithmService.resetAllScores as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useResetAllAlgorithmScores(), { wrapper });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(algorithmService.resetAllScores).toHaveBeenCalledWith('test-token');
  });

  it('invalidates algorithm.scores on success', async () => {
    (algorithmService.resetAllScores as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useResetAllAlgorithmScores(), { wrapper });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['algorithm', 'scores'] });
  });
});
