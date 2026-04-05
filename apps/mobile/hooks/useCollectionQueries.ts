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

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { name: string; description?: string; icon?: string }) => {
      const token = await getToken();
      return collectionService.createCollection(
        params.name,
        params.description,
        token,
        params.icon,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      collectionId: number;
      updates: { name?: string; description?: string; icon?: string };
    }) => {
      const token = await getToken();
      return collectionService.updateCollection(params.collectionId, params.updates, token);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.detail(variables.collectionId),
      });
    },
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

export function useAddMantraToCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { collectionId: number; mantraId: number }) => {
      const token = await getToken();
      return collectionService.addMantraToCollection(params.collectionId, params.mantraId, token);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.detail(variables.collectionId),
      });
    },
  });
}

export function useRemoveMantraFromCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { collectionId: number; mantraId: number }) => {
      const token = await getToken();
      return collectionService.removeMantraFromCollection(
        params.collectionId,
        params.mantraId,
        token,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.detail(variables.collectionId),
      });
    },
  });
}
