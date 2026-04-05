import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryClient';
import { mantraService, MantraResponse, Mantra } from '../services/mantra.service';
import { storage } from '../utils/storage';

async function getToken() {
  return (await storage.getToken()) || '';
}

export function useFeedMantras() {
  return useQuery<MantraResponse>({
    queryKey: queryKeys.mantras.feed,
    queryFn: async () => {
      const token = await getToken();
      return mantraService.getFeedMantras(token);
    },
  });
}

export function useAllMantras() {
  return useQuery<MantraResponse>({
    queryKey: queryKeys.mantras.all,
    queryFn: async () => {
      const token = await getToken();
      return mantraService.getAllMantras(token);
    },
  });
}

export function useMantraById(mantraId: number) {
  return useQuery({
    queryKey: queryKeys.mantras.detail(mantraId),
    queryFn: async () => {
      const token = await getToken();
      return mantraService.getMantraById(mantraId, token);
    },
    enabled: !!mantraId,
  });
}

export function useLikedMantras() {
  return useQuery({
    queryKey: queryKeys.mantras.liked,
    queryFn: async () => {
      const token = await getToken();
      return mantraService.getLikedMantras(token);
    },
  });
}

export function useSavedMantras() {
  return useQuery<Mantra[]>({
    queryKey: queryKeys.mantras.saved,
    queryFn: async () => {
      const token = await getToken();
      return mantraService.getSavedMantras(token);
    },
  });
}

export function useLikeMantra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mantraId: number) => {
      const token = await getToken();
      return mantraService.likeMantra(mantraId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mantras.feed });
      queryClient.invalidateQueries({ queryKey: queryKeys.mantras.liked });
    },
  });
}

export function useUnlikeMantra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mantraId: number) => {
      const token = await getToken();
      return mantraService.unlikeMantra(mantraId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mantras.feed });
      queryClient.invalidateQueries({ queryKey: queryKeys.mantras.liked });
    },
  });
}

export function useSaveMantra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mantraId: number) => {
      const token = await getToken();
      return mantraService.saveMantra(mantraId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mantras.feed });
      queryClient.invalidateQueries({ queryKey: queryKeys.mantras.saved });
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
    },
  });
}

export function useUnsaveMantra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mantraId: number) => {
      const token = await getToken();
      return mantraService.unsaveMantra(mantraId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mantras.feed });
      queryClient.invalidateQueries({ queryKey: queryKeys.mantras.saved });
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
    },
  });
}
