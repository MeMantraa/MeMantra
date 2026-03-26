import { sql } from 'kysely';
import { db } from '../db';

export interface PersistedPerformanceSummary {
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
  by_metric: Array<{
    key: string;
    count: number;
    error_count: number;
    error_rate: number;
    slow_count: number;
    avg_duration_ms: number;
    max_duration_ms: number;
  }>;
}

const DEFAULT_SLOW_REQUEST_MS = 750;
const DEFAULT_SLOW_QUERY_MS = 200;

const toFiniteNumber = (value: unknown, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toBoundedSampleRate = (value: unknown): number => {
  const parsed = toFiniteNumber(value, 1);
  if (parsed < 0) return 0;
  if (parsed > 1) return 1;
  return parsed;
};

export const PerformanceEventModel = {
  async getSummary(windowHours = 24): Promise<PersistedPerformanceSummary> {
    const boundedWindowHours = Math.min(24 * 14, Math.max(1, Math.floor(windowHours) || 24));

    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - boundedWindowHours);
    const cutoffISO = cutoff.toISOString();

    const slowThresholds = {
      requestMs: toFiniteNumber(process.env.SLOW_REQUEST_MS, DEFAULT_SLOW_REQUEST_MS),
      queryMs: toFiniteNumber(process.env.SLOW_QUERY_MS, DEFAULT_SLOW_QUERY_MS),
    };

    const percentileRows = await sql<{ p50: number; p95: number; p99: number; count: number }>`
      SELECT
        COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms), 0)::float8 AS p50,
        COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms), 0)::float8 AS p95,
        COALESCE(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms), 0)::float8 AS p99,
        COUNT(*)::int AS count
      FROM "PerformanceEvent"
      WHERE occurred_at >= ${cutoffISO}
    `.execute(db);

    const metricRows = await sql<{
      key: string;
      count: number;
      error_count: number;
      slow_count: number;
      avg_duration_ms: number;
      max_duration_ms: number;
    }>`
      SELECT
        kind || '|' || name || '|' || COALESCE(method, '-') || '|' || COALESCE(route, screen, '-') AS key,
        COUNT(*)::int AS count,
        COUNT(*) FILTER (WHERE status = 'error')::int AS error_count,
        COUNT(*) FILTER (
          WHERE
            (kind = 'db_query' AND duration_ms >= ${slowThresholds.queryMs}) OR
            ((kind = 'api_request' OR kind = 'mobile_api') AND duration_ms >= ${slowThresholds.requestMs})
        )::int AS slow_count,
        COALESCE(AVG(duration_ms), 0)::float8 AS avg_duration_ms,
        COALESCE(MAX(duration_ms), 0)::float8 AS max_duration_ms
      FROM "PerformanceEvent"
      WHERE occurred_at >= ${cutoffISO}
      GROUP BY kind, name, method, route, screen
      ORDER BY count DESC
      LIMIT 200
    `.execute(db);

    const p = percentileRows.rows[0] || { p50: 0, p95: 0, p99: 0, count: 0 };

    return {
      enabled: (process.env.MONITORING_ENABLED || 'true').toLowerCase() !== 'false',
      sample_rate: toBoundedSampleRate(process.env.MONITORING_SAMPLE_RATE),
      slow_thresholds_ms: slowThresholds,
      buffer_size: Number(p.count || 0),
      recent_stats: {
        p50_ms: Math.round(Number(p.p50 || 0) * 100) / 100,
        p95_ms: Math.round(Number(p.p95 || 0) * 100) / 100,
        p99_ms: Math.round(Number(p.p99 || 0) * 100) / 100,
      },
      by_metric: metricRows.rows.map((row) => ({
        key: row.key,
        count: Number(row.count),
        error_count: Number(row.error_count),
        error_rate: Number(row.count) > 0 ? Number(row.error_count) / Number(row.count) : 0,
        slow_count: Number(row.slow_count),
        avg_duration_ms: Math.round(Number(row.avg_duration_ms) * 100) / 100,
        max_duration_ms: Math.round(Number(row.max_duration_ms) * 100) / 100,
      })),
    };
  },
};
