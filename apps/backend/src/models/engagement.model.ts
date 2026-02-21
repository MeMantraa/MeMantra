import { sql } from 'kysely';
import { db } from '../db';
import { EngagementEvent } from '../types/database.types';

export interface EngagementAnalytics {
  window_days: number;
  event_counts: Record<string, number>;
  notification_effectiveness: {
    sent: number;
    taps: number;
    /** Percentage of sent notifications that were tapped. null when no sends recorded. */
    tap_through_rate_pct: number | null;
    /** Percentage of taps followed by a like, save, or rate within 60 minutes. null when no taps. */
    post_tap_conversion_rate_pct: number | null;
  };
  /** Count of recommendation taps by UTC hour (0-23). */
  tap_by_hour: Array<{ hour: number; count: number }>;
  adaptive_timing: {
    users_with_optimal_hour: number;
    users_using_default: number;
  };
}

export const EngagementModel = {
  /**
   * Record an engagement event for a user.
   * De-duplicates within the current UTC hour — returns undefined when an
   * event of the same type was already recorded this hour.
   */
  async create(userId: number, eventType = 'app_open'): Promise<EngagementEvent | undefined> {
    // Check for an existing event this UTC hour
    const existing = await db
      .selectFrom('EngagementEvent')
      .where('user_id', '=', userId)
      .where('event_type', '=', eventType)
      .where(
        'occurred_at',
        '>=',
        sql<string>`date_trunc('hour', now() AT TIME ZONE 'UTC')`,
      )
      .select('event_id')
      .executeTakeFirst();

    if (existing) {
      return undefined;
    }

    return db
      .insertInto('EngagementEvent')
      .values({ user_id: userId, event_type: eventType })
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  /**
   * Find the modal local hour at which the user opens the app.
   * Looks back `windowDays` days and requires at least `minEvents` to return
   * a result — returns null when there is insufficient data.
   */
  async getOptimalHour(
    userId: number,
    timezone: string,
    windowDays = 30,
    minEvents = 5,
  ): Promise<number | null> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - windowDays);

    const rows = await db
      .selectFrom('EngagementEvent')
      .where('user_id', '=', userId)
      .where('occurred_at', '>=', cutoff.toISOString())
      .select([
        sql<number>`EXTRACT(HOUR FROM occurred_at AT TIME ZONE ${timezone})`.as('hour'),
        db.fn.count('event_id').as('count'),
      ])
      .groupBy(sql`EXTRACT(HOUR FROM occurred_at AT TIME ZONE ${timezone})`)
      .orderBy('count', 'desc')
      .execute();

    if (rows.length === 0 || Number(rows[0].count) < minEvents) {
      return null;
    }

    return Number(rows[0].hour);
  },

  /**
   * Isolated raw-SQL helper for the post-tap conversion query so tests can
   * spy on it independently of the query builder paths.
   */
  async _queryPostTapConversion(
    cutoffISO: string,
  ): Promise<{ total_taps: string; taps_with_followup: string }> {
    const result = await sql<{ total_taps: string; taps_with_followup: string }>`
      SELECT
        COUNT(DISTINCT tap.event_id)::text  AS total_taps,
        COUNT(DISTINCT follow.event_id)::text AS taps_with_followup
      FROM "EngagementEvent" tap
      LEFT JOIN "EngagementEvent" follow
        ON  follow.user_id    = tap.user_id
        AND follow.event_type IN ('mantra_like', 'mantra_save', 'mantra_rate')
        AND follow.occurred_at >  tap.occurred_at
        AND follow.occurred_at <= tap.occurred_at + INTERVAL '60 minutes'
      WHERE tap.event_type = 'notification_tap_recommendation'
        AND tap.occurred_at >= ${cutoffISO}
    `.execute(db);
    return result.rows[0] ?? { total_taps: '0', taps_with_followup: '0' };
  },

  /**
   * Aggregate effectiveness metrics over the past `windowDays` days.
   */
  async getAnalytics(windowDays = 30): Promise<EngagementAnalytics> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - windowDays);
    const cutoffISO = cutoff.toISOString();

    // 1. Event counts by type
    const countRows = await db
      .selectFrom('EngagementEvent')
      .where('occurred_at', '>=', cutoffISO)
      .select(['event_type', db.fn.count('event_id').as('count')])
      .groupBy('event_type')
      .execute();

    const eventCounts: Record<string, number> = {};
    for (const row of countRows) {
      eventCounts[row.event_type] = Number(row.count);
    }

    // 2. Post-tap conversion: like/save/rate within 60 min of a recommendation tap
    const conversionRow = await this._queryPostTapConversion(cutoffISO);
    const totalTaps = Number(conversionRow.total_taps);
    const tapsWithFollowup = Number(conversionRow.taps_with_followup);

    // 3. Recommendation taps per UTC hour
    const tapByHourRows = await db
      .selectFrom('EngagementEvent')
      .where('event_type', '=', 'notification_tap_recommendation')
      .where('occurred_at', '>=', cutoffISO)
      .select([
        sql<number>`EXTRACT(HOUR FROM occurred_at AT TIME ZONE 'UTC')`.as('hour'),
        db.fn.count('event_id').as('count'),
      ])
      .groupBy(sql`EXTRACT(HOUR FROM occurred_at AT TIME ZONE 'UTC')`)
      .orderBy('hour', 'asc')
      .execute();

    // 4. Adaptive timing coverage across notifiable users
    const adaptiveRow = await db
      .selectFrom('User')
      .where('device_token', 'is not', null)
      .select([
        sql<number>`COUNT(CASE WHEN optimal_send_hour IS NOT NULL THEN 1 END)`.as('with_optimal'),
        sql<number>`COUNT(CASE WHEN optimal_send_hour IS NULL THEN 1 END)`.as('without_optimal'),
      ])
      .executeTakeFirst();

    const sent = eventCounts['notification_sent'] ?? 0;
    const taps = eventCounts['notification_tap_recommendation'] ?? 0;

    return {
      window_days: windowDays,
      event_counts: eventCounts,
      notification_effectiveness: {
        sent,
        taps,
        tap_through_rate_pct: sent > 0 ? Math.round((taps / sent) * 1000) / 10 : null,
        post_tap_conversion_rate_pct:
          totalTaps > 0 ? Math.round((tapsWithFollowup / totalTaps) * 1000) / 10 : null,
      },
      tap_by_hour: tapByHourRows.map((r) => ({ hour: Number(r.hour), count: Number(r.count) })),
      adaptive_timing: {
        users_with_optimal_hour: Number(adaptiveRow?.with_optimal ?? 0),
        users_using_default: Number(adaptiveRow?.without_optimal ?? 0),
      },
    };
  },
};
