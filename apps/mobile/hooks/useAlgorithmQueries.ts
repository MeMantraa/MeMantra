import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryClient';
import {
  algorithmService,
  AlgorithmScoresResponse,
  TopCategoriesResponse,
} from '../services/algorithm.service';
import { storage } from '../utils/storage';

async function getToken() {
  return (await storage.getToken()) || '';
}

export function useAlgorithmScores() {
  return useQuery<AlgorithmScoresResponse>({
    queryKey: queryKeys.algorithm.scores,
    queryFn: async () => {
      const token = await getToken();
      return algorithmService.getScores(token);
    },
  });
}

export function useTopCategories(limit = 10) {
  return useQuery<TopCategoriesResponse>({
    queryKey: queryKeys.algorithm.topCategories(limit),
    queryFn: async () => {
      const token = await getToken();
      return algorithmService.getTopCategories(token, limit);
    },
  });
}

export function useUpdateAlgorithmScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { categoryId: number; score: number }) => {
      const token = await getToken();
      return algorithmService.updateScore(token, params.categoryId, params.score);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.algorithm.scores });
    },
  });
}

export function useResetAlgorithmScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (categoryId: number) => {
      const token = await getToken();
      return algorithmService.resetScore(token, categoryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.algorithm.scores });
    },
  });
}

export function useResetAllAlgorithmScores() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return algorithmService.resetAllScores(token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.algorithm.scores });
    },
  });
}
