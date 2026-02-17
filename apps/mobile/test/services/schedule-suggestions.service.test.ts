import {
  compareTimeSlots,
  dateToTimeSlot,
  hasTimeConflict,
  scheduleSuggestionsService,
} from '../../services/schedule-suggestions.service';

describe('compareTimeSlots', () => {
  it('should sort earlier times before later times', () => {
    expect(compareTimeSlots('07:00', '12:00')).toBeLessThan(0);
    expect(compareTimeSlots('12:00', '07:00')).toBeGreaterThan(0);
  });

  it('should return 0 for identical times', () => {
    expect(compareTimeSlots('09:30', '09:30')).toBe(0);
  });

  it('should correctly sort an array of time slots', () => {
    const times = ['22:00', '07:00', '12:00', '18:00', '09:30'];
    const sorted = [...times].sort(compareTimeSlots);
    expect(sorted).toEqual(['07:00', '09:30', '12:00', '18:00', '22:00']);
  });

  it('should handle midnight and end-of-day correctly', () => {
    expect(compareTimeSlots('00:00', '23:59')).toBeLessThan(0);
    expect(compareTimeSlots('23:59', '00:00')).toBeGreaterThan(0);
  });

  it('should handle single-element arrays', () => {
    const times = ['14:00'];
    expect([...times].sort(compareTimeSlots)).toEqual(['14:00']);
  });
});

describe('dateToTimeSlot', () => {
  it('should convert a Date to HH:MM string', () => {
    const date = new Date(2024, 0, 1, 9, 30, 0);
    expect(dateToTimeSlot(date)).toBe('09:30');
  });

  it('should pad single-digit hours with zero', () => {
    const date = new Date(2024, 0, 1, 7, 5, 0);
    expect(dateToTimeSlot(date)).toBe('07:05');
  });

  it('should handle midnight', () => {
    const date = new Date(2024, 0, 1, 0, 0, 0);
    expect(dateToTimeSlot(date)).toBe('00:00');
  });

  it('should handle end-of-day', () => {
    const date = new Date(2024, 0, 1, 23, 59, 0);
    expect(dateToTimeSlot(date)).toBe('23:59');
  });

  it('should ignore seconds and milliseconds', () => {
    const date = new Date(2024, 0, 1, 14, 30, 45, 999);
    expect(dateToTimeSlot(date)).toBe('14:30');
  });
});

describe('hasTimeConflict', () => {
  it('should return true when time exists in array', () => {
    expect(hasTimeConflict(['07:00', '12:00', '18:00'], '12:00')).toBe(true);
  });

  it('should return false when time does not exist', () => {
    expect(hasTimeConflict(['07:00', '12:00', '18:00'], '09:00')).toBe(false);
  });

  it('should return false for empty array', () => {
    expect(hasTimeConflict([], '12:00')).toBe(false);
  });

  it('should exclude the specified index when checking', () => {
    const times = ['07:00', '12:00', '18:00'];
    // Editing index 1 to the same value should not conflict
    expect(hasTimeConflict(times, '12:00', 1)).toBe(false);
  });

  it('should detect conflict when time exists at a different index', () => {
    const times = ['07:00', '12:00', '18:00'];
    // Editing index 2 to '12:00' should conflict with index 1
    expect(hasTimeConflict(times, '12:00', 2)).toBe(true);
  });

  it('should work without excludeIndex parameter', () => {
    expect(hasTimeConflict(['07:00'], '07:00')).toBe(true);
    expect(hasTimeConflict(['07:00'], '08:00')).toBe(false);
  });
});

describe('scheduleSuggestionsService', () => {
  describe('getTemplates', () => {
    it('should return Morning, Lunch, and Bedtime templates', () => {
      const templates = scheduleSuggestionsService.getTemplates();
      expect(templates).toHaveLength(3);
      expect(templates.map((t) => t.name)).toEqual(['Morning', 'Lunch', 'Bedtime']);
    });

    it('should have valid HH:MM times', () => {
      const templates = scheduleSuggestionsService.getTemplates();
      for (const tmpl of templates) {
        expect(tmpl.times[0]).toMatch(/^\d{2}:\d{2}$/);
      }
    });
  });

  describe('getDayPresets', () => {
    it('should return 4 presets', () => {
      const presets = scheduleSuggestionsService.getDayPresets();
      expect(presets).toHaveLength(4);
      expect(presets.map((p) => p.key)).toEqual(['everyday', 'weekdays', 'weekends', 'custom']);
    });

    it('should have 7 days for everyday', () => {
      const presets = scheduleSuggestionsService.getDayPresets();
      const everyday = presets.find((p) => p.key === 'everyday');
      expect(everyday?.days).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    it('should have 5 days for weekdays', () => {
      const presets = scheduleSuggestionsService.getDayPresets();
      const weekdays = presets.find((p) => p.key === 'weekdays');
      expect(weekdays?.days).toEqual([1, 2, 3, 4, 5]);
    });

    it('should have empty days for custom', () => {
      const presets = scheduleSuggestionsService.getDayPresets();
      const custom = presets.find((p) => p.key === 'custom');
      expect(custom?.days).toEqual([]);
    });
  });

  describe('getDeviceTimezone', () => {
    it('should return a non-empty string', () => {
      const tz = scheduleSuggestionsService.getDeviceTimezone();
      expect(typeof tz).toBe('string');
      expect(tz.length).toBeGreaterThan(0);
    });
  });

  describe('formatTimeForDisplay', () => {
    it('should format morning time', () => {
      expect(scheduleSuggestionsService.formatTimeForDisplay('07:00')).toBe('7:00 AM');
    });

    it('should format afternoon time', () => {
      expect(scheduleSuggestionsService.formatTimeForDisplay('14:30')).toBe('2:30 PM');
    });

    it('should format noon', () => {
      expect(scheduleSuggestionsService.formatTimeForDisplay('12:00')).toBe('12:00 PM');
    });

    it('should format midnight', () => {
      expect(scheduleSuggestionsService.formatTimeForDisplay('00:00')).toBe('12:00 AM');
    });

    it('should format 11 PM', () => {
      expect(scheduleSuggestionsService.formatTimeForDisplay('23:00')).toBe('11:00 PM');
    });
  });

  describe('formatDaysForDisplay', () => {
    it('should return "Every day" for all 7 days', () => {
      expect(scheduleSuggestionsService.formatDaysForDisplay([0, 1, 2, 3, 4, 5, 6])).toBe(
        'Every day',
      );
    });

    it('should return "Every day" for null', () => {
      expect(scheduleSuggestionsService.formatDaysForDisplay(null)).toBe('Every day');
    });

    it('should return "Every day" for empty array', () => {
      expect(scheduleSuggestionsService.formatDaysForDisplay([])).toBe('Every day');
    });

    it('should return "Weekdays" for Mon-Fri', () => {
      expect(scheduleSuggestionsService.formatDaysForDisplay([1, 2, 3, 4, 5])).toBe('Weekdays');
    });

    it('should return "Weekends" for Sat and Sun', () => {
      expect(scheduleSuggestionsService.formatDaysForDisplay([0, 6])).toBe('Weekends');
    });

    it('should return comma-separated day names for custom days', () => {
      expect(scheduleSuggestionsService.formatDaysForDisplay([1, 3, 5])).toBe('Mon, Wed, Fri');
    });

    it('should sort days before displaying', () => {
      expect(scheduleSuggestionsService.formatDaysForDisplay([5, 1, 3])).toBe('Mon, Wed, Fri');
    });
  });

  describe('formatTimezoneDisplay', () => {
    it('should format a valid IANA timezone', () => {
      const result = scheduleSuggestionsService.formatTimezoneDisplay('America/New_York');
      expect(result).toContain('New York');
    });

    it('should return the raw string for an invalid timezone', () => {
      const result = scheduleSuggestionsService.formatTimezoneDisplay('Invalid/Zone');
      expect(result).toBe('Invalid/Zone');
    });
  });

  describe('getRecommendedTimes', () => {
    it('should return an array of time strings', () => {
      const times = scheduleSuggestionsService.getRecommendedTimes();
      expect(times.length).toBeGreaterThan(0);
      for (const t of times) {
        expect(t).toMatch(/^\d{2}:\d{2}$/);
      }
    });
  });
});
