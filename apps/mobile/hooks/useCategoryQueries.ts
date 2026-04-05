import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryClient';
import {
  categoryService,
  CategoryResponse,
  SingleCategoryResponse,
} from '../services/category.service';
import { storage } from '../utils/storage';

async function getToken() {
  return (await storage.getToken()) || '';
}

export function useAllCategories() {
  return useQuery<CategoryResponse>({
    queryKey: queryKeys.categories.all,
    queryFn: async () => {
      const token = await getToken();
      return categoryService.getAllCategories(token);
    },
    staleTime: 10 * 60 * 1000, // Categories rarely change — 10 min
  });
}

export function useCategoryById(id: number) {
  return useQuery<SingleCategoryResponse>({
    queryKey: queryKeys.categories.detail(id),
    queryFn: async () => {
      const token = await getToken();
      return categoryService.getCategoryById(id, token);
    },
    enabled: !!id,
  });
}

export function useCategoriesForMantra(mantraId: number) {
  return useQuery<CategoryResponse>({
    queryKey: queryKeys.categories.forMantra(mantraId),
    queryFn: async () => {
      const token = await getToken();
      return categoryService.getCategoriesForMantra(mantraId, token);
    },
    enabled: !!mantraId,
  });
}
