import { Kysely, PostgresDialect } from 'kysely';
import { Pool, types } from 'pg';
import { Database } from '../types/database.types';
import dotenv from 'dotenv';
import { PerformanceMonitor } from '../services/performance-monitor.service';

dotenv.config({ quiet: true });

// OID 1114 = TIMESTAMP WITHOUT TIME ZONE
// By default pg interprets these in the server's local timezone, causing
// time offsets when the server isn't UTC. Treat them as UTC so the ISO
// strings stored via toISOString() round-trip correctly.
types.setTypeParser(1114, (val: string) => val.replace(' ', 'T') + 'Z');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

if (typeof (pool as any).query === 'function') {
  const originalQuery = pool.query.bind(pool);

  pool.query = (async (...args: any[]) => {
    const start = process.hrtime.bigint();
    const text = typeof args[0] === 'string' ? args[0] : args[0]?.text;

    const queryType =
      typeof text === 'string'
        ? text.trim().split(/\s+/)[0]?.toUpperCase() || 'UNKNOWN'
        : 'UNKNOWN';

    try {
      const result = await (originalQuery as any)(...args);
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

      PerformanceMonitor.trackEvent({
        kind: 'db_query',
        name: queryType,
        duration_ms: durationMs,
        status: 'success',
        source: 'backend',
        metadata: {
          row_count: result?.rowCount ?? null,
        },
      });

      return result;
    } catch (error) {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

      PerformanceMonitor.trackEvent({
        kind: 'db_query',
        name: queryType,
        duration_ms: durationMs,
        status: 'error',
        source: 'backend',
        metadata: {
          error_name: error instanceof Error ? error.name : 'UnknownError',
        },
      });

      throw error;
    }
  }) as typeof pool.query;
}

const dialect = new PostgresDialect({
  pool,
});

export const db = new Kysely<Database>({
  dialect,
});
