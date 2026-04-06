import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useAllCategories,
  useCategoryById,
  useCategoriesForMantra,
} from '../../hooks/useCategoryQueries';
import { categoryService } from '../../services/category.service';
import { storage } from '../../utils/storage';

jest.mock('../../services/category.service', () => ({
  categoryService: {
    getAllCategories: jest.fn(),
    getCategoryById: jest.fn(),
    getCategoriesForMantra: jest.fn(),
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

describe('useAllCategories', () => {
  it('calls getAllCategories with the token from storage', async () => {
    (categoryService.getAllCategories as jest.Mock).mockResolvedValue({ data: { categories: [] } });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAllCategories(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(categoryService.getAllCategories).toHaveBeenCalledWith('test-token');
  });

  it('returns data from the service', async () => {
    const mockData = { data: { categories: [{ category_id: 1, name: 'Focus' }] } };
    (categoryService.getAllCategories as jest.Mock).mockResolvedValue(mockData);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAllCategories(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });
});

describe('useCategoryById', () => {
  it('calls getCategoryById with the id and token', async () => {
    (categoryService.getCategoryById as jest.Mock).mockResolvedValue({ data: { category: {} } });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCategoryById(10), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(categoryService.getCategoryById).toHaveBeenCalledWith(10, 'test-token');
  });

  it('does NOT call getCategoryById when id is 0', async () => {
    const { wrapper } = createWrapper();

    renderHook(() => useCategoryById(0), { wrapper });

    await new Promise((r) => setTimeout(r, 50));
    expect(categoryService.getCategoryById).not.toHaveBeenCalled();
  });
});

describe('useCategoriesForMantra', () => {
  it('calls getCategoriesForMantra with the mantraId and token', async () => {
    (categoryService.getCategoriesForMantra as jest.Mock).mockResolvedValue({
      data: { categories: [] },
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCategoriesForMantra(20), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(categoryService.getCategoriesForMantra).toHaveBeenCalledWith(20, 'test-token');
  });

  it('does NOT call getCategoriesForMantra when mantraId is 0', async () => {
    const { wrapper } = createWrapper();

    renderHook(() => useCategoriesForMantra(0), { wrapper });

    await new Promise((r) => setTimeout(r, 50));
    expect(categoryService.getCategoriesForMantra).not.toHaveBeenCalled();
  });
});
