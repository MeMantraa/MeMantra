export interface ScheduleTemplate {
  name: string;
  icon: string;
  times: string[];
  description: string;
}

export interface DayPreset {
  name: string;
  key: 'everyday' | 'weekdays' | 'weekends' | 'custom';
  days: number[];
}

export const scheduleSuggestionsService = {
  getTemplates(): ScheduleTemplate[] {
    return [
      {
        name: 'Morning',
        icon: 'sunny-outline',
        times: ['07:00'],
        description: 'Start your day mindfully',
      },
      {
        name: 'Lunch',
        icon: 'restaurant-outline',
        times: ['12:00'],
        description: 'Midday mindfulness break',
      },
      {
        name: 'Bedtime',
        icon: 'moon-outline',
        times: ['22:00'],
        description: 'End your day with intention',
      },
    ];
  },

  getDayPresets(): DayPreset[] {
    return [
      { name: 'Every Day', key: 'everyday', days: [0, 1, 2, 3, 4, 5, 6] },
      { name: 'Weekdays', key: 'weekdays', days: [1, 2, 3, 4, 5] },
      { name: 'Weekends', key: 'weekends', days: [0, 6] },
      { name: 'Custom', key: 'custom', days: [] },
    ];
  },

  getRecommendedTimes(): string[] {
    return ['07:00', '12:00', '18:00', '22:00'];
  },

  getDeviceTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  },

  formatTimezoneDisplay(timezone: string): string {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'short',
      });
      const parts = formatter.formatToParts(new Date());
      const tzAbbrev = parts.find((p) => p.type === 'timeZoneName')?.value || timezone;
      const location = timezone.split('/').pop()?.replace(/_/g, ' ') || timezone;
      return `${location} (${tzAbbrev})`;
    } catch {
      return timezone;
    }
  },

  formatTimeForDisplay(timeStr: string): string {
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${m} ${ampm}`;
  },

  formatDaysForDisplay(days: number[] | null): string {
    if (!days || days.length === 0 || days.length === 7) return 'Every day';
    const sorted = [...days].sort();
    if (sorted.length === 5 && sorted.join(',') === '1,2,3,4,5') return 'Weekdays';
    if (sorted.length === 2 && sorted.join(',') === '0,6') return 'Weekends';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return sorted.map((d) => dayNames[d]).join(', ');
  },
};
