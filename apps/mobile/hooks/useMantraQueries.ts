import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryClient';
import { mantraService } from '../services/mantra.service';
import { storage } from '../utils/storage';

async function getToken() {
  return (await storage.getToken()) || '';
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
  return useQuery({
    queryKey: queryKeys.mantras.saved,
    queryFn: async () => {
      const token = await getToken();
      return mantraService.getSavedMantras(token);
    },
  });
}
