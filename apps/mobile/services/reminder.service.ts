import { apiClient } from './api.config';

export type Reminder = {
  reminder_id: number;
  user_id: number | null;
  mantra_id: number | null;
  collection_id: number | null;
  journal_id: number | null;
  time: string | null;
  frequency: string | null;
  status: string | null;
  last_sent_at: string | null;
  mantra_title: string | null;
  collection_name: string | null;
  journal_title: string | null;
  schedule_times: string[] | null;
  schedule_days: number[] | null;
  timezone: string | null;
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
  journal_id?: number;
  time?: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom' | 'routine';
  status?: 'active' | 'paused';
  schedule_times?: string[];
  schedule_days?: number[];
  timezone?: string;
}

export interface UpdateReminderInput {
  mantra_id?: number;
  collection_id?: number;
  journal_id?: number;
  time?: string;
  frequency?: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom' | 'routine';
  status?: 'active' | 'paused' | 'completed';
  schedule_times?: string[];
  schedule_days?: number[];
  timezone?: string;
}

export interface SchedulePreviewResponse {
  status: string;
  data: {
    timezone: string;
    preview: Array<{ day: string; date: string; times: string[] }>;
    total_notifications_per_week: number;
  };
}

export interface SuggestionsResponse {
  status: string;
  data: {
    suggestions: {
      templates: Array<{ name: string; icon: string; times: string[]; description: string }>;
      recommended_times: string[];
      day_presets: Array<{ name: string; days: number[] }>;
    };
  };
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

  async getSchedulePreview(
    data: { schedule_times: string[]; schedule_days?: number[]; timezone: string },
    token: string,
  ): Promise<SchedulePreviewResponse> {
    const response = await apiClient.post<SchedulePreviewResponse>(
      '/reminders/preview-schedule',
      data,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  },

  async getSuggestions(token: string): Promise<SuggestionsResponse> {
    const response = await apiClient.get<SuggestionsResponse>('/reminders/suggestions', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
