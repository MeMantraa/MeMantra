import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryClient';
import {
  reminderService,
  RemindersResponse,
  UpdateReminderInput,
} from '../services/reminder.service';
import { storage } from '../utils/storage';

async function getToken() {
  return (await storage.getToken()) || '';
}

export function useAllReminders() {
  return useQuery<RemindersResponse>({
    queryKey: queryKeys.reminders.all,
    queryFn: async () => {
      const token = await getToken();
      return reminderService.getReminders(token);
    },
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { reminderId: number; data: UpdateReminderInput }) => {
      const token = await getToken();
      return reminderService.updateReminder(params.reminderId, params.data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reminders.all });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reminderId: number) => {
      const token = await getToken();
      return reminderService.deleteReminder(reminderId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reminders.all });
    },
  });
}
