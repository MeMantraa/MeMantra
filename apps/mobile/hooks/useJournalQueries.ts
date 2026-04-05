import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryClient';
import {
  journalService,
  JournalResponse,
  SingleJournalResponse,
  JournalStatsResponse,
  CreateJournalPayload,
  UpdateJournalPayload,
  MoodType,
} from '../services/journal.service';
import { storage } from '../utils/storage';

async function getToken() {
  return (await storage.getToken()) || '';
}

export function useJournalEntries(options?: {
  search?: string;
  mood?: MoodType;
  mantra_id?: number;
  limit?: number;
  offset?: number;
}) {
  return useQuery<JournalResponse>({
    queryKey: [...queryKeys.journal.all, options],
    queryFn: async () => {
      const token = await getToken();
      return journalService.getJournalEntries(token, options);
    },
  });
}

export function useJournalEntryById(journalId: number) {
  return useQuery<SingleJournalResponse>({
    queryKey: queryKeys.journal.detail(journalId),
    queryFn: async () => {
      const token = await getToken();
      return journalService.getJournalEntryById(journalId, token);
    },
    enabled: !!journalId,
  });
}

export function useJournalEntriesByMantra(mantraId: number) {
  return useQuery<JournalResponse>({
    queryKey: queryKeys.journal.byMantra(mantraId),
    queryFn: async () => {
      const token = await getToken();
      return journalService.getJournalEntriesByMantra(mantraId, token);
    },
    enabled: !!mantraId,
  });
}

export function useJournalStats() {
  return useQuery<JournalStatsResponse>({
    queryKey: queryKeys.journal.stats,
    queryFn: async () => {
      const token = await getToken();
      return journalService.getJournalStats(token);
    },
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateJournalPayload) => {
      const token = await getToken();
      return journalService.createJournalEntry(payload, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.stats });
    },
  });
}

export function useUpdateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { journalId: number; payload: UpdateJournalPayload }) => {
      const token = await getToken();
      return journalService.updateJournalEntry(params.journalId, params.payload, token);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.journal.detail(variables.journalId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.stats });
    },
  });
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (journalId: number) => {
      const token = await getToken();
      return journalService.deleteJournalEntry(journalId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.stats });
    },
  });
}
