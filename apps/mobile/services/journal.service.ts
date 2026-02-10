import { apiClient } from './api.config';

/**
 * TYPES
 * -----
 * matches with backend JournalEntry model
 */
export interface JournalEntry {
  journal_id: number;
  user_id: number;
  mantra_id: number | null;
  title: string | null;
  content: string;
  mood: MoodType | null;
  tags: string[] | null;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields from mantra
  mantra_title?: string;
  mantra_key_takeaway?: string;
}

export type MoodType =
  | 'happy'
  | 'calm'
  | 'grateful'
  | 'motivated'
  | 'anxious'
  | 'sad'
  | 'stressed'
  | 'hopeful'
  | 'reflective'
  | 'neutral';

export const MOOD_OPTIONS: { value: MoodType; label: string; emoji: string }[] = [
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'calm', label: 'Calm', emoji: '😌' },
  { value: 'grateful', label: 'Grateful', emoji: '🙏' },
  { value: 'motivated', label: 'Motivated', emoji: '💪' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'stressed', label: 'Stressed', emoji: '😫' },
  { value: 'hopeful', label: 'Hopeful', emoji: '🌟' },
  { value: 'reflective', label: 'Reflective', emoji: '🤔' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
];

export interface CreateJournalPayload {
  mantra_id?: number | null;
  title?: string;
  content: string;
  mood?: MoodType;
  tags?: string[];
  is_private?: boolean;
}

export interface UpdateJournalPayload {
  mantra_id?: number | null;
  title?: string;
  content?: string;
  mood?: MoodType;
  tags?: string[];
  is_private?: boolean;
}

export interface JournalResponse {
  status: string;
  message?: string;
  data: {
    entries: JournalEntry[];
    pagination?: {
      limit: number;
      offset: number;
      count: number;
      total: number;
    };
  };
}

export interface SingleJournalResponse {
  status: string;
  message?: string;
  data: {
    entry: JournalEntry;
  };
}

export interface JournalStatsResponse {
  status: string;
  data: {
    totalEntries: number;
  };
}

export interface JournalMutationResponse {
  status: string;
  message?: string;
  data?: {
    entry: JournalEntry;
  };
}

/**
 * JOURNAL SERVICE
 * ---------------
 * Handles all journal-related API calls.
 */
export const journalService = {
  async getJournalEntries(
    token: string,
    options?: {
      search?: string;
      mood?: MoodType;
      mantra_id?: number;
      limit?: number;
      offset?: number;
    },
  ): Promise<JournalResponse> {
    const params = new URLSearchParams();
    if (options?.search) params.append('search', options.search);
    if (options?.mood) params.append('mood', options.mood);
    if (options?.mantra_id) params.append('mantra_id', options.mantra_id.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const queryString = params.toString();
    const url = queryString ? `/journal?${queryString}` : '/journal';

    const response = await apiClient.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * Get a single journal entry by ID
   */
  async getJournalEntryById(journalId: number, token: string): Promise<SingleJournalResponse> {
    const response = await apiClient.get(`/journal/${journalId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * Get journal entries for a specific mantra
   */
  async getJournalEntriesByMantra(mantraId: number, token: string): Promise<JournalResponse> {
    const response = await apiClient.get(`/journal/mantra/${mantraId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * Create a new journal entry
   */
  async createJournalEntry(
    payload: CreateJournalPayload,
    token: string,
  ): Promise<JournalMutationResponse> {
    const response = await apiClient.post('/journal', payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * Update an existing journal entry
   */
  async updateJournalEntry(
    journalId: number,
    payload: UpdateJournalPayload,
    token: string,
  ): Promise<JournalMutationResponse> {
    const response = await apiClient.put(`/journal/${journalId}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * Delete a journal entry
   */
  async deleteJournalEntry(journalId: number, token: string): Promise<JournalMutationResponse> {
    const response = await apiClient.delete(`/journal/${journalId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * Get journal statistics
   */
  async getJournalStats(token: string): Promise<JournalStatsResponse> {
    const response = await apiClient.get('/journal/stats', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
