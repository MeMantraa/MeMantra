import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryClient';
import {
  collectionService,
  CollectionsResponse,
  CollectionWithMantrasResponse,
} from '../services/collection.service';
import { storage } from '../utils/storage';

async function getToken() {
  return (await storage.getToken()) || '';
}

export function useUserCollections() {
  return useQuery<CollectionsResponse>({
    queryKey: queryKeys.collections.all,
    queryFn: async () => {
      const token = await getToken();
      return collectionService.getUserCollections(token);
    },
  });
}

export function useCollectionById(collectionId: number) {
  return useQuery<CollectionWithMantrasResponse>({
    queryKey: queryKeys.collections.detail(collectionId),
    queryFn: async () => {
      const token = await getToken();
      return collectionService.getCollectionById(collectionId, token);
    },
    enabled: !!collectionId,
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (collectionId: number) => {
      const token = await getToken();
      return collectionService.deleteCollection(collectionId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
    },
  });
}
