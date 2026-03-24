import { apiClient } from './api.config';

export interface EngagementAnalytics {
  window_days: number;
  event_counts: Record<string, number>;
  notification_effectiveness: {
    sent: number;
    taps: number;
    tap_through_rate_pct: number | null;
    post_tap_conversion_rate_pct: number | null;
  };
  tap_by_hour: Array<{ hour: number; count: number }>;
  adaptive_timing: {
    users_with_optimal_hour: number;
    users_using_default: number;
  };
}

type EngagementEventType =
  | 'app_open'
  | 'mantra_like'
  | 'mantra_save'
  | 'mantra_rate'
  | 'journal_create'
  | 'reminder_create'
  | 'collection_create'
  | 'collection_add'
  | 'notification_tap_recommendation'
  | 'notification_tap_reminder'
  | 'notification_tap_collection_reminder';

export interface PerformanceEventPayload {
  kind: 'mobile_api' | 'mobile_screen';
  name: string;
  duration_ms: number;
  status: 'success' | 'error';
  route?: string;
  method?: string;
  screen?: string;
  request_id?: string;
  platform?: string;
  app_version?: string;
  metadata?: Record<string, unknown>;
}

export const engagementService = {
  /** Fire-and-forget — never throws, never blocks the caller. */
  async trackEvent(eventType: EngagementEventType): Promise<void> {
    try {
      await apiClient.post('/engagement/event', { event_type: eventType });
    } catch {
      // non-critical; swallow silently
    }
  },

  async trackAppOpen(): Promise<void> {
    return this.trackEvent('app_open');
  },

  async trackPerformanceEvent(payload: PerformanceEventPayload): Promise<void> {
    try {
      await apiClient.post(
        '/performance/event',
        {
          ...payload,
          source: 'mobile',
        },
        {
          skipPerformanceMonitoring: true,
          timeout: 3000,
        } as any,
      );
    } catch {
      // non-critical; swallow silently
    }
  },

  async getAnalytics(
    token: string,
    days = 30,
  ): Promise<{ status: string; data: EngagementAnalytics }> {
    const response = await apiClient.get('/engagement/analytics', {
      headers: { Authorization: `Bearer ${token}` },
      params: { days },
    });
    return response.data;
  },
};
