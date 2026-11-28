import { describe, it, expect } from 'vitest';
import { getAllDatesInMonth } from '../lib/dates.js';

describe('Timezone Independence Tests', () => {
  it('should generate exactly 31 dates for December 2026 regardless of timezone', () => {
    const dates = getAllDatesInMonth(2026, 12);
    expect(dates.length).toBe(31);

    expect(dates[0].getUTCDate()).toBe(1);
    expect(dates[0].getUTCMonth()).toBe(11);
    expect(dates[0].getUTCFullYear()).toBe(2026);

    expect(dates[30].getUTCDate()).toBe(31);
    expect(dates[30].getUTCMonth()).toBe(11);
    expect(dates[30].getUTCFullYear()).toBe(2026);
  });

  it('should generate exactly 28 dates for February 2026', () => {
    const dates = getAllDatesInMonth(2026, 2);
    expect(dates.length).toBe(28);
  });

  it('should generate exactly 29 dates for February 2024 (leap year)', () => {
    const dates = getAllDatesInMonth(2024, 2);
    expect(dates.length).toBe(29);
  });

  it('should use UTC dates consistently', () => {
    const dates = getAllDatesInMonth(2026, 12);
    
    for (let i = 0; i < dates.length; i++) {
      expect(dates[i].getUTCDate()).toBe(i + 1);
      expect(dates[i].getUTCMonth()).toBe(11);
      expect(dates[i].getUTCFullYear()).toBe(2026);
      expect(dates[i].getUTCHours()).toBe(0);
      expect(dates[i].getUTCMinutes()).toBe(0);
      expect(dates[i].getUTCSeconds()).toBe(0);
    }
  });

  it('should format dates as YYYY-MM-DD regardless of timezone', () => {
    const dates = getAllDatesInMonth(2026, 12);
    const firstDate = dates[0].toISOString().split('T')[0];
    expect(firstDate).toBe('2026-12-01');

    const lastDate = dates[30].toISOString().split('T')[0];
    expect(lastDate).toBe('2026-12-31');
  });
});
