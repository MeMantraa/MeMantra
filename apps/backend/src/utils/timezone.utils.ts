const DAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * Return the current hour, minute, and day-of-week in a given IANA timezone.
 * Uses Intl.DateTimeFormat — no external dependencies.
 */
export function getCurrentTimeInTimezone(timezone: string): {
  hour: number;
  minute: number;
  dayOfWeek: number;
} {
  return getTimeInTimezone(new Date(), timezone);
}

/**
 * Return the hour, minute, and day-of-week for a specific date in a given IANA timezone.
 */
export function getTimeInTimezone(
  date: Date,
  timezone: string,
): { hour: number; minute: number; dayOfWeek: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const hour = Number.parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10) % 24;
  const minute = Number.parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun';
  const dayOfWeek = DAY_MAP[weekdayStr] ?? 0;
  return { hour, minute, dayOfWeek };
}

/**
 * Format a date as YYYY-MM-DD in the given timezone.
 */
export function formatDateInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(date);
}

/**
 * Format a date as YYYY-MM in the given timezone.
 */
export function formatMonthInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
  }).format(date);
}

/**
 * Get day-of-week (0=Sun, 6=Sat) for a specific date in the given timezone.
 */
export function getDayOfWeekInTimezone(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  }).formatToParts(date);
  const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun';
  return DAY_MAP[weekdayStr] ?? 0;
}

/**
 * Check if two dates fall in the same week (week starts on Sunday) in the given timezone.
 */
export function isSameWeekInTimezone(date1: Date, date2: Date, timezone: string): boolean {
  // Get the local date string for each date in the target timezone,
  // then compute start-of-week from the local date to avoid DST issues
  // with raw millisecond arithmetic.
  const localDate1 = formatDateInTimezone(date1, timezone);
  const localDate2 = formatDateInTimezone(date2, timezone);
  const dow1 = getDayOfWeekInTimezone(date1, timezone);
  const dow2 = getDayOfWeekInTimezone(date2, timezone);

  // Parse the local date and subtract day-of-week to get Sunday's date
  const [y1, m1, d1] = localDate1.split('-').map(Number);
  const [y2, m2, d2] = localDate2.split('-').map(Number);

  // Use UTC dates to avoid any local timezone interference in the arithmetic
  const utcDate1 = Date.UTC(y1, m1 - 1, d1);
  const utcDate2 = Date.UTC(y2, m2 - 1, d2);

  const startOfWeek1 = utcDate1 - dow1 * 86400000;
  const startOfWeek2 = utcDate2 - dow2 * 86400000;

  return startOfWeek1 === startOfWeek2;
}
