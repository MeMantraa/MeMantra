import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useAllReminders,
  useActiveReminders,
  useCreateReminder,
  useUpdateReminder,
  useDeleteReminder,
} from '../../hooks/useReminderQueries';
import { reminderService } from '../../services/reminder.service';
import { storage } from '../../utils/storage';

jest.mock('../../services/reminder.service', () => ({
  reminderService: {
    getReminders: jest.fn(),
    getActiveReminders: jest.fn(),
    createReminder: jest.fn(),
    updateReminder: jest.fn(),
    deleteReminder: jest.fn(),
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

describe('useAllReminders', () => {
  it('calls getReminders with the token from storage', async () => {
    (reminderService.getReminders as jest.Mock).mockResolvedValue({ data: { reminders: [] } });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAllReminders(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(reminderService.getReminders).toHaveBeenCalledWith('test-token');
  });

  it('returns data from the service', async () => {
    const mockData = { data: { reminders: [{ reminder_id: 1 }] } };
    (reminderService.getReminders as jest.Mock).mockResolvedValue(mockData);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAllReminders(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });
});

describe('useActiveReminders', () => {
  it('calls getActiveReminders with the token from storage', async () => {
    (reminderService.getActiveReminders as jest.Mock).mockResolvedValue({
      data: { reminders: [] },
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useActiveReminders(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(reminderService.getActiveReminders).toHaveBeenCalledWith('test-token');
  });
});

describe('useCreateReminder', () => {
  it('calls createReminder with the data and token', async () => {
    (reminderService.createReminder as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper } = createWrapper();
    const payload = { mantra_id: 1, frequency: 'daily' as const, time: '08:00' };

    const { result } = renderHook(() => useCreateReminder(), { wrapper });

    await act(async () => {
      result.current.mutate(payload);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(reminderService.createReminder).toHaveBeenCalledWith(payload, 'test-token');
  });

  it('invalidates reminders.all and reminders.active on success', async () => {
    (reminderService.createReminder as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const payload = { mantra_id: 1, frequency: 'daily' as const, time: '08:00' };

    const { result } = renderHook(() => useCreateReminder(), { wrapper });

    await act(async () => {
      result.current.mutate(payload);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reminders'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reminders', 'active'] });
  });
});

describe('useUpdateReminder', () => {
  it('calls updateReminder with the right args and token', async () => {
    (reminderService.updateReminder as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUpdateReminder(), { wrapper });

    await act(async () => {
      result.current.mutate({ reminderId: 2, data: { status: 'paused' } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(reminderService.updateReminder).toHaveBeenCalledWith(
      2,
      { status: 'paused' },
      'test-token',
    );
  });

  it('invalidates reminders.all and reminders.active on success', async () => {
    (reminderService.updateReminder as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateReminder(), { wrapper });

    await act(async () => {
      result.current.mutate({ reminderId: 2, data: { status: 'paused' } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reminders'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reminders', 'active'] });
  });
});

describe('useDeleteReminder', () => {
  it('calls deleteReminder with the id and token', async () => {
    (reminderService.deleteReminder as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDeleteReminder(), { wrapper });

    await act(async () => {
      result.current.mutate(9);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(reminderService.deleteReminder).toHaveBeenCalledWith(9, 'test-token');
  });

  it('invalidates reminders.all and reminders.active on success', async () => {
    (reminderService.deleteReminder as jest.Mock).mockResolvedValue({ status: 'success' });
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteReminder(), { wrapper });

    await act(async () => {
      result.current.mutate(9);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reminders'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reminders', 'active'] });
  });
});
