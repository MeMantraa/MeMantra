import { apiClient } from './api.config';

export interface PerformanceMetricSummary {
  key: string;
  count: number;
  error_count: number;
  error_rate: number;
  slow_count: number;
  avg_duration_ms: number;
  max_duration_ms: number;
}

export interface PerformanceSummary {
  enabled: boolean;
  sample_rate: number;
  slow_thresholds_ms: {
    requestMs: number;
    queryMs: number;
  };
  buffer_size: number;
  recent_stats: {
    p50_ms: number;
    p95_ms: number;
    p99_ms: number;
  };
  by_metric: PerformanceMetricSummary[];
}

export const performanceService = {
  async getSummary(token: string): Promise<{ status: string; data: PerformanceSummary }> {
    const response = await apiClient.get('/performance/summary', {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  },
};
