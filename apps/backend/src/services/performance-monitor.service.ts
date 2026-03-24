import { Pool } from 'pg';

type PerformanceEventKind =
  | 'api_request'
  | 'db_query'
  | 'mobile_api'
  | 'mobile_screen'
  | 'service_operation'
  | 'scheduler_job';

type PerformanceSource = 'backend' | 'mobile';

type PerformanceStatus = 'success' | 'error';

export interface PerformanceEvent {
  kind: PerformanceEventKind;
  name: string;
  duration_ms: number;
  status: PerformanceStatus;
  source: PerformanceSource;
  route?: string;
  method?: string;
  screen?: string;
  request_id?: string;
  platform?: string;
  app_version?: string;
  metadata?: Record<string, unknown>;
  occurred_at: string;
}

interface AggregatedMetric {
  count: number;
  error_count: number;
  total_duration_ms: number;
  max_duration_ms: number;
  slow_count: number;
}

interface SlowThresholds {
  requestMs: number;
  queryMs: number;
}

const MAX_EVENT_BUFFER = 5000;
const DEFAULT_SAMPLE_RATE = 1;
const DEFAULT_SLOW_REQUEST_MS = 750;
const DEFAULT_SLOW_QUERY_MS = 200;

const toFiniteNumber = (value: unknown, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toBoundedSampleRate = (value: unknown): number => {
  const parsed = toFiniteNumber(value, DEFAULT_SAMPLE_RATE);
  if (parsed < 0) return 0;
  if (parsed > 1) return 1;
  return parsed;
};

const toEventKey = (event: PerformanceEvent): string => {
  const routeOrScreen = event.route || event.screen || '-';
  const method = event.method || '-';
  return [event.kind, event.name, method, routeOrScreen].join('|');
};

const getSlowThresholdMs = (event: PerformanceEvent, thresholds: SlowThresholds): number => {
  if (event.kind === 'db_query') return thresholds.queryMs;
  if (event.kind === 'api_request' || event.kind === 'mobile_api') return thresholds.requestMs;
  return Number.POSITIVE_INFINITY;
};

const trimMetadata = (metadata?: Record<string, unknown>): Record<string, unknown> | undefined => {
  if (!metadata) return undefined;

  const entries = Object.entries(metadata).slice(0, 20);
  const result: Record<string, unknown> = {};

  for (const [key, value] of entries) {
    if (value === null || value === undefined) {
      result[key] = value;
      continue;
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      result[key] = value;
      continue;
    }

    try {
      result[key] = JSON.stringify(value).slice(0, 300);
    } catch {
      result[key] = '[unserializable]';
    }
  }

  return result;
};

class PerformanceMonitorService {
  private readonly events: PerformanceEvent[] = [];
  private readonly aggregates = new Map<string, AggregatedMetric>();
  private readonly writePool: Pool;

  constructor() {
    this.writePool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      allowExitOnIdle: true,
    });
  }

  private isEnabled(): boolean {
    return (process.env.MONITORING_ENABLED || 'true').toLowerCase() !== 'false';
  }

  private sampleRate(): number {
    return toBoundedSampleRate(process.env.MONITORING_SAMPLE_RATE);
  }

  private thresholds(): SlowThresholds {
    return {
      requestMs: toFiniteNumber(process.env.SLOW_REQUEST_MS, DEFAULT_SLOW_REQUEST_MS),
      queryMs: toFiniteNumber(process.env.SLOW_QUERY_MS, DEFAULT_SLOW_QUERY_MS),
    };
  }

  private shouldSample(source: PerformanceSource): boolean {
    // Keep backend metrics deterministic by default; sample mobile ingress by rate.
    if (source === 'backend') return true;
    return Math.random() <= this.sampleRate();
  }

  private shouldPersist(): boolean {
    if (process.env.NODE_ENV === 'test') return false;
    return (process.env.MONITORING_PERSIST_ENABLED || 'true').toLowerCase() !== 'false';
  }

  private persistEvent(event: PerformanceEvent): void {
    if (!this.shouldPersist()) return;
    if (typeof (this.writePool as any).query !== 'function') return;

    const query = `
      INSERT INTO "PerformanceEvent" (
        kind,
        name,
        duration_ms,
        status,
        source,
        route,
        method,
        screen,
        request_id,
        platform,
        app_version,
        metadata,
        occurred_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12::jsonb, $13::timestamptz
      )
    `;

    const values = [
      event.kind,
      event.name,
      event.duration_ms,
      event.status,
      event.source,
      event.route || null,
      event.method || null,
      event.screen || null,
      event.request_id || null,
      event.platform || null,
      event.app_version || null,
      event.metadata ? JSON.stringify(event.metadata) : null,
      event.occurred_at,
    ];

    void this.writePool.query(query, values).catch(() => {
      // Non-critical: don't block request path if persistence fails.
    });
  }

  trackEvent(input: Omit<PerformanceEvent, 'occurred_at'>): void {
    if (!this.isEnabled()) return;
    if (!this.shouldSample(input.source)) return;

    const event: PerformanceEvent = {
      ...input,
      duration_ms: Math.max(0, Number(input.duration_ms) || 0),
      metadata: trimMetadata(input.metadata),
      occurred_at: new Date().toISOString(),
    };

    this.events.push(event);
    if (this.events.length > MAX_EVENT_BUFFER) {
      this.events.shift();
    }

    this.persistEvent(event);

    const key = toEventKey(event);
    const existing = this.aggregates.get(key) || {
      count: 0,
      error_count: 0,
      total_duration_ms: 0,
      max_duration_ms: 0,
      slow_count: 0,
    };

    existing.count += 1;
    existing.total_duration_ms += event.duration_ms;
    existing.max_duration_ms = Math.max(existing.max_duration_ms, event.duration_ms);

    if (event.status === 'error') {
      existing.error_count += 1;
    }

    const slowThreshold = getSlowThresholdMs(event, this.thresholds());
    if (event.duration_ms >= slowThreshold) {
      existing.slow_count += 1;
    }

    this.aggregates.set(key, existing);
  }

  async measureAsync<T>(
    name: string,
    operation: () => Promise<T>,
    eventBase: Omit<PerformanceEvent, 'name' | 'duration_ms' | 'status' | 'occurred_at'>,
  ): Promise<T> {
    const start = process.hrtime.bigint();
    try {
      const result = await operation();
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      this.trackEvent({ ...eventBase, name, duration_ms: durationMs, status: 'success' });
      return result;
    } catch (error) {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      this.trackEvent({
        ...eventBase,
        name,
        duration_ms: durationMs,
        status: 'error',
        metadata: {
          ...(eventBase.metadata || {}),
          error_name: error instanceof Error ? error.name : 'UnknownError',
        },
      });
      throw error;
    }
  }

  getSummary() {
    const byMetric = Array.from(this.aggregates.entries()).map(([key, value]) => {
      const avgDuration = value.count > 0 ? value.total_duration_ms / value.count : 0;
      return {
        key,
        count: value.count,
        error_count: value.error_count,
        error_rate: value.count > 0 ? value.error_count / value.count : 0,
        slow_count: value.slow_count,
        avg_duration_ms: Math.round(avgDuration * 100) / 100,
        max_duration_ms: Math.round(value.max_duration_ms * 100) / 100,
      };
    });

    const recentEvents = this.events.slice(-200);
    const sortedDurations = recentEvents.map((e) => e.duration_ms).sort((a, b) => a - b);

    const percentile = (p: number): number => {
      if (sortedDurations.length === 0) return 0;
      const index = Math.min(
        sortedDurations.length - 1,
        Math.max(0, Math.floor((sortedDurations.length - 1) * p)),
      );
      return Math.round(sortedDurations[index] * 100) / 100;
    };

    return {
      enabled: this.isEnabled(),
      sample_rate: this.sampleRate(),
      slow_thresholds_ms: this.thresholds(),
      buffer_size: this.events.length,
      recent_stats: {
        p50_ms: percentile(0.5),
        p95_ms: percentile(0.95),
        p99_ms: percentile(0.99),
      },
      by_metric: byMetric,
    };
  }
}

export const PerformanceMonitor = new PerformanceMonitorService();
