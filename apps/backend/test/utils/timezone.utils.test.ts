import { getCurrentTimeInTimezone } from '../../src/utils/timezone.utils';

// Helper to mock Intl.DateTimeFormat formatToParts for a given set of parts
function mockFormatToParts(
  parts: Array<{ type: string; value: string }>,
): jest.SpyInstance {
  return jest
    .spyOn(Intl.DateTimeFormat.prototype, 'formatToParts')
    .mockReturnValue(parts as Intl.DateTimeFormatPart[]);
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('getCurrentTimeInTimezone', () => {
  it('returns correct hour, minute, and dayOfWeek for a normal time', () => {
    mockFormatToParts([
      { type: 'weekday', value: 'Wed' },
      { type: 'hour', value: '14' },
      { type: 'minute', value: '35' },
    ]);

    const result = getCurrentTimeInTimezone('America/New_York');

    expect(result.hour).toBe(14);
    expect(result.minute).toBe(35);
    expect(result.dayOfWeek).toBe(3); // Wednesday
  });

  it('maps all weekday abbreviations to correct dayOfWeek values', () => {
    const cases: Array<{ value: string; expected: number }> = [
      { value: 'Sun', expected: 0 },
      { value: 'Mon', expected: 1 },
      { value: 'Tue', expected: 2 },
      { value: 'Wed', expected: 3 },
      { value: 'Thu', expected: 4 },
      { value: 'Fri', expected: 5 },
      { value: 'Sat', expected: 6 },
    ];

    for (const { value, expected } of cases) {
      mockFormatToParts([
        { type: 'weekday', value },
        { type: 'hour', value: '9' },
        { type: 'minute', value: '0' },
      ]);

      const result = getCurrentTimeInTimezone('UTC');
      expect(result.dayOfWeek).toBe(expected);

      jest.restoreAllMocks();
    }
  });

  it('normalises hour=24 to 0 via % 24', () => {
    // Some Intl implementations return "24" for midnight in hour12:false mode
    mockFormatToParts([
      { type: 'weekday', value: 'Mon' },
      { type: 'hour', value: '24' },
      { type: 'minute', value: '0' },
    ]);

    const result = getCurrentTimeInTimezone('UTC');
    expect(result.hour).toBe(0);
  });

  it('falls back to hour 0 when hour part is missing', () => {
    mockFormatToParts([
      { type: 'weekday', value: 'Fri' },
      { type: 'minute', value: '15' },
    ]);

    const result = getCurrentTimeInTimezone('UTC');
    expect(result.hour).toBe(0);
    expect(result.minute).toBe(15);
  });

  it('falls back to minute 0 when minute part is missing', () => {
    mockFormatToParts([
      { type: 'weekday', value: 'Tue' },
      { type: 'hour', value: '7' },
    ]);

    const result = getCurrentTimeInTimezone('UTC');
    expect(result.hour).toBe(7);
    expect(result.minute).toBe(0);
  });

  it('falls back to dayOfWeek 0 when weekday is unrecognised', () => {
    mockFormatToParts([
      { type: 'weekday', value: 'Xyz' },
      { type: 'hour', value: '10' },
      { type: 'minute', value: '5' },
    ]);

    const result = getCurrentTimeInTimezone('UTC');
    expect(result.dayOfWeek).toBe(0);
  });

  it('falls back to dayOfWeek 0 when weekday part is missing', () => {
    mockFormatToParts([
      { type: 'hour', value: '8' },
      { type: 'minute', value: '30' },
    ]);

    const result = getCurrentTimeInTimezone('UTC');
    expect(result.dayOfWeek).toBe(0);
  });
});
