import { apiClient } from './api.config';

export type Reminder = {
  reminder_id: number;
  user_id: number | null;
  mantra_id: number | null;
  collection_id: number | null;
  time: string | null;
  frequency: string | null;
  status: string | null;
  last_sent_at: string | null;
};

export interface RemindersResponse {
  status: string;
  data: {
    reminders: Reminder[];
  };
}

export interface ReminderResponse {
  status: string;
  message?: string;
  data: {
    reminder: Reminder;
  };
}

export interface MessageResponse {
  status: string;
  message: string;
}

export interface CreateReminderInput {
  mantra_id?: number;
  collection_id?: number;
  time: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  status?: 'active' | 'paused';
}

export interface UpdateReminderInput {
  mantra_id?: number;
  collection_id?: number;
  time?: string;
  frequency?: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  status?: 'active' | 'paused' | 'completed';
}

export const reminderService = {
  async getReminders(token: string): Promise<RemindersResponse> {
    const response = await apiClient.get<RemindersResponse>('/reminders', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getActiveReminders(token: string): Promise<RemindersResponse> {
    const response = await apiClient.get<RemindersResponse>('/reminders/active', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getUpcomingReminders(token: string, hours?: number): Promise<RemindersResponse> {
    const params = hours ? `?hours=${hours}` : '';
    const response = await apiClient.get<RemindersResponse>(`/reminders/upcoming${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getReminderById(reminderId: number, token: string): Promise<ReminderResponse> {
    const response = await apiClient.get<ReminderResponse>(`/reminders/${reminderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async createReminder(data: CreateReminderInput, token: string): Promise<ReminderResponse> {
    const response = await apiClient.post<ReminderResponse>('/reminders', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async updateReminder(
    reminderId: number,
    data: UpdateReminderInput,
    token: string,
  ): Promise<ReminderResponse> {
    const response = await apiClient.put<ReminderResponse>(`/reminders/${reminderId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async deleteReminder(reminderId: number, token: string): Promise<MessageResponse> {
    const response = await apiClient.delete<MessageResponse>(`/reminders/${reminderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
