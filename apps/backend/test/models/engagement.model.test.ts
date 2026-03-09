import { EngagementModel } from '../../src/models/engagement.model';
import { db } from '../../src/db';

jest.mock('../../src/db', () => ({
  db: {
    selectFrom: jest.fn(),
    insertInto: jest.fn(),
    fn: { count: jest.fn() },
  },
}));

const mockedDb = db as jest.Mocked<typeof db>;

// ─── helpers ─────────────────────────────────────────────────────────────────

const makeSelectChain = (result: any) => {
  const chain: any = {
    where: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    executeTakeFirst: jest.fn().mockResolvedValue(result),
    execute: jest.fn().mockResolvedValue(result),
  };
  return chain;
};

const makeInsertChain = (result: any) => {
  const chain: any = {
    values: jest.fn().mockReturnThis(),
    returningAll: jest.fn().mockReturnThis(),
    executeTakeFirstOrThrow: jest.fn().mockResolvedValue(result),
  };
  return chain;
};

// ─── tests ────────────────────────────────────────────────────────────────────

describe('EngagementModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('stores an event and returns it when none exists this hour', async () => {
      const stored = {
        event_id: 1,
        user_id: 42,
        event_type: 'app_open',
        occurred_at: new Date().toISOString(),
      };

      const selectChain = makeSelectChain(undefined); // no existing row
      (mockedDb.selectFrom as jest.Mock).mockReturnValue(selectChain);

      const insertChain = makeInsertChain(stored);
      (mockedDb.insertInto as jest.Mock).mockReturnValue(insertChain);

      const result = await EngagementModel.create(42);

      expect(result).toEqual(stored);
      expect(mockedDb.insertInto).toHaveBeenCalledWith('EngagementEvent');
    });

    it('returns undefined (de-duplicated) when an event already exists this hour', async () => {
      const existingRow = { event_id: 5 };
      const selectChain = makeSelectChain(existingRow);
      (mockedDb.selectFrom as jest.Mock).mockReturnValue(selectChain);

      const result = await EngagementModel.create(42);

      expect(result).toBeUndefined();
      expect(mockedDb.insertInto).not.toHaveBeenCalled();
    });

    it('defaults event_type to "app_open"', async () => {
      const stored = {
        event_id: 2,
        user_id: 1,
        event_type: 'app_open',
        occurred_at: new Date().toISOString(),
      };

      const selectChain = makeSelectChain(undefined);
      (mockedDb.selectFrom as jest.Mock).mockReturnValue(selectChain);

      const insertChain = makeInsertChain(stored);
      (mockedDb.insertInto as jest.Mock).mockReturnValue(insertChain);

      await EngagementModel.create(1);

      expect(insertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({ event_type: 'app_open' }),
      );
    });
  });

  // ── getAnalytics ──────────────────────────────────────────────────────────

  describe('getAnalytics', () => {
    let conversionSpy: jest.SpyInstance;

    beforeEach(() => {
      conversionSpy = jest
        .spyOn(EngagementModel, '_queryPostTapConversion')
        .mockResolvedValue({ total_taps: '10', taps_with_followup: '6' });

      (mockedDb.fn.count as jest.Mock).mockReturnValue({ as: jest.fn().mockReturnValue('count_expr') });
    });

    afterEach(() => {
      conversionSpy.mockRestore();
    });

    const makeAnalyticsSelectChain = (result: any) => ({
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(result),
      executeTakeFirst: jest.fn().mockResolvedValue(result),
    });

    it('computes tap-through rate correctly', async () => {
      // Call 1: event counts (includes sent=20, taps=10)
      // Call 2: tap by hour
      // Call 3: adaptive timing (User table)
      let call = 0;
      (mockedDb.selectFrom as jest.Mock).mockImplementation(() => {
        call++;
        if (call === 1) return makeAnalyticsSelectChain([
          { event_type: 'notification_sent', count: '20' },
          { event_type: 'notification_tap_recommendation', count: '10' },
        ]);
        if (call === 2) return makeAnalyticsSelectChain([{ hour: 9, count: '10' }]);
        return makeAnalyticsSelectChain({ with_optimal: '5', without_optimal: '15' });
      });

      const result = await EngagementModel.getAnalytics(30);

      expect(result.notification_effectiveness.sent).toBe(20);
      expect(result.notification_effectiveness.taps).toBe(10);
      expect(result.notification_effectiveness.tap_through_rate_pct).toBe(50);
    });

    it('computes post-tap conversion rate correctly', async () => {
      conversionSpy.mockResolvedValue({ total_taps: '10', taps_with_followup: '6' });

      let call = 0;
      (mockedDb.selectFrom as jest.Mock).mockImplementation(() => {
        call++;
        if (call === 1) return makeAnalyticsSelectChain([]);
        if (call === 2) return makeAnalyticsSelectChain([]);
        return makeAnalyticsSelectChain({ with_optimal: '0', without_optimal: '0' });
      });

      const result = await EngagementModel.getAnalytics(30);

      expect(result.notification_effectiveness.post_tap_conversion_rate_pct).toBe(60);
    });

    it('returns null tap_through_rate_pct when no notifications sent', async () => {
      let call = 0;
      (mockedDb.selectFrom as jest.Mock).mockImplementation(() => {
        call++;
        if (call === 1) return makeAnalyticsSelectChain([]);  // no events
        if (call === 2) return makeAnalyticsSelectChain([]);
        return makeAnalyticsSelectChain({ with_optimal: '0', without_optimal: '0' });
      });
      conversionSpy.mockResolvedValue({ total_taps: '0', taps_with_followup: '0' });

      const result = await EngagementModel.getAnalytics(30);

      expect(result.notification_effectiveness.tap_through_rate_pct).toBeNull();
      expect(result.notification_effectiveness.post_tap_conversion_rate_pct).toBeNull();
    });

    it('maps tap_by_hour rows correctly', async () => {
      let call = 0;
      (mockedDb.selectFrom as jest.Mock).mockImplementation(() => {
        call++;
        if (call === 1) return makeAnalyticsSelectChain([]);
        if (call === 2) return makeAnalyticsSelectChain([
          { hour: '8', count: '3' },
          { hour: '9', count: '7' },
        ]);
        return makeAnalyticsSelectChain({ with_optimal: '0', without_optimal: '0' });
      });

      const result = await EngagementModel.getAnalytics(30);

      expect(result.tap_by_hour).toEqual([
        { hour: 8, count: 3 },
        { hour: 9, count: 7 },
      ]);
    });

    it('passes window_days through to the result', async () => {
      (mockedDb.selectFrom as jest.Mock).mockImplementation(() =>
        makeAnalyticsSelectChain([]),
      );

      const result = await EngagementModel.getAnalytics(7);

      expect(result.window_days).toBe(7);
    });
  });

  // ── getOptimalHour ────────────────────────────────────────────────────────

  describe('getOptimalHour', () => {
    it('returns the modal hour when count >= minEvents', async () => {
      const rows = [{ hour: 8, count: '7' }];
      const selectChain = makeSelectChain(rows);
      (mockedDb.selectFrom as jest.Mock).mockReturnValue(selectChain);
      (mockedDb.fn.count as jest.Mock).mockReturnValue({ as: jest.fn().mockReturnValue('count_expr') });

      const result = await EngagementModel.getOptimalHour(1, 'America/New_York');

      expect(result).toBe(8);
    });

    it('returns null when count < minEvents', async () => {
      const rows = [{ hour: 8, count: '3' }]; // below default minEvents=5
      const selectChain = makeSelectChain(rows);
      (mockedDb.selectFrom as jest.Mock).mockReturnValue(selectChain);
      (mockedDb.fn.count as jest.Mock).mockReturnValue({ as: jest.fn().mockReturnValue('count_expr') });

      const result = await EngagementModel.getOptimalHour(1, 'America/New_York');

      expect(result).toBeNull();
    });

    it('returns null when no rows are returned', async () => {
      const selectChain = makeSelectChain([]);
      (mockedDb.selectFrom as jest.Mock).mockReturnValue(selectChain);
      (mockedDb.fn.count as jest.Mock).mockReturnValue({ as: jest.fn().mockReturnValue('count_expr') });

      const result = await EngagementModel.getOptimalHour(1, 'UTC');

      expect(result).toBeNull();
    });
  });
});
