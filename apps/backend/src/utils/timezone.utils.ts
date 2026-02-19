const DAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

/**
 * Return the current hour, minute, and day-of-week in a given IANA timezone.
 * Uses Intl.DateTimeFormat — no external dependencies.
 */
export function getCurrentTimeInTimezone(
  timezone: string,
): { hour: number; minute: number; dayOfWeek: number } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const hour = Number.parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10) % 24;
  const minute = Number.parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun';
  const dayOfWeek = DAY_MAP[weekdayStr] ?? 0;
  return { hour, minute, dayOfWeek };
}
