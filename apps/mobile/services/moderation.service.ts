import { apiClient } from './api.config';

export interface MessageReportPayload {
  message_id: number;
  conversation_id: number;
  reason:
    | 'inappropriate_language'
    | 'harassment'
    | 'spam'
    | 'offensive_content'
    | 'misinformation'
    | 'other';
  description?: string;
}

export interface MessageReport {
  report_id: number;
  message_id: number;
  conversation_id: number;
  reported_by_id: number;
  reason: string;
  description?: string;
  status: 'pending' | 'accepted' | 'denied' | 'reviewed';
  reviewed_by_id?: number;
  review_notes?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface MessageReportResponse {
  status: string;
  message: string;
  data?: {
    report: MessageReport;
  };
}

export interface MessageReportListResponse {
  status: string;
  data: {
    reports: MessageReport[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
    };
  };
}

export const messageReportService = {
  // Report a message
  async reportMessage(
    payload: MessageReportPayload,
    token: string,
  ): Promise<MessageReportResponse> {
    try {
      const response = await apiClient.post('/moderation/message', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { status: 'error', message: 'Failed to report message' };
    }
  },

  // Get all reports (admin only)
  async getAllReports(
    token: string,
    status?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<MessageReportListResponse> {
    try {
      const response = await apiClient.get('/moderation/message', {
        params: { status, limit, offset },
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { status: 'error', message: 'Failed to fetch reports' };
    }
  },

  // Get a specific report
  async getReportById(reportId: number, token: string): Promise<MessageReportResponse> {
    try {
      const response = await apiClient.get(`/moderation/message/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { status: 'error', message: 'Failed to fetch report' };
    }
  },

  // Update report status (admin only)
  async updateReportStatus(
    reportId: number,
    status: 'pending' | 'accepted' | 'denied' | 'reviewed',
    token: string,
    reviewNotes?: string,
  ): Promise<MessageReportResponse> {
    try {
      const response = await apiClient.put(
        `/moderation/message/${reportId}`,
        { status, review_notes: reviewNotes },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { status: 'error', message: 'Failed to update report' };
    }
  },

  // Delete a report (admin only)
  async deleteReport(
    reportId: number,
    token: string,
  ): Promise<{ status: string; message: string }> {
    try {
      const response = await apiClient.delete(`/moderation/message/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { status: 'error', message: 'Failed to delete report' };
    }
  },
};

// User Block Service
export interface UserBlockResponse {
  status: string;
  message: string;
  data?: {
    blocked: boolean;
    blockedUsers?: any[];
  };
}

export const userBlockService = {
  // Block a user
  async blockUser(userId: number, token: string): Promise<UserBlockResponse> {
    try {
      const response = await apiClient.post(
        `/moderation/block/${userId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { status: 'error', message: 'Failed to block user' };
    }
  },

  // Unblock a user
  async unblockUser(userId: number, token: string): Promise<UserBlockResponse> {
    try {
      const response = await apiClient.delete(`/moderation/block/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { status: 'error', message: 'Failed to unblock user' };
    }
  },

  // Get all blocked users
  async getBlockedUsers(token: string): Promise<UserBlockResponse> {
    try {
      const response = await apiClient.get('/moderation/blocked', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { status: 'error', message: 'Failed to fetch blocked users' };
    }
  },

  // Check if user is blocked
  async isBlocked(userId: number, token: string): Promise<UserBlockResponse> {
    try {
      const response = await apiClient.get(`/moderation/is-blocked/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { status: 'error', message: 'Failed to check block status' };
    }
  },
};
