import { describe, it, expect } from 'vitest';
import { isOperatingDay } from '../calendar/operatingCalendar.js';
import type { BrandProcessData, PublicHolidayData } from '../types.js';

describe('operatingCalendar', () => {
  const mockBrandProcess: BrandProcessData = {
    id: 'bp1',
    brandId: 'b1',
    brandName: 'Test Brand',
    brandCode: 'TB',
    processId: 'p1',
    processName: 'CS',
    processCode: 'CS',
    operatingRule: {
      type: 'ALL_365',
      workingWeekdays: [0, 1, 2, 3, 4, 5, 6],
      worksOnHolidays: true,
    },
    defaultMinCoverage: 1,
    coverageOverrides: [],
  };

  const holiday: PublicHolidayData = {
    date: new Date('2026-01-26'),
  };

  it('should return true for ALL_365 rule on any day including holidays', () => {
    const date = new Date('2026-01-26');
    expect(isOperatingDay(date, mockBrandProcess, [holiday])).toBe(true);
  });

  it('should return false for DAILY_EXCEPT_HOLIDAYS on a holiday', () => {
    const bp: BrandProcessData = {
      ...mockBrandProcess,
      operatingRule: {
        type: 'DAILY_EXCEPT_HOLIDAYS',
        workingWeekdays: [0, 1, 2, 3, 4, 5, 6],
        worksOnHolidays: false,
      },
    };
    const date = new Date('2026-01-26');
    expect(isOperatingDay(date, bp, [holiday])).toBe(false);
  });

  it('should return false for EXCEPT_SUNDAYS_AND_HOLIDAYS on Sunday', () => {
    const bp: BrandProcessData = {
      ...mockBrandProcess,
      operatingRule: {
        type: 'EXCEPT_SUNDAYS_AND_HOLIDAYS',
        workingWeekdays: [1, 2, 3, 4, 5, 6],
        worksOnHolidays: false,
      },
    };
    const sunday = new Date('2026-01-04'); // Sunday
    expect(isOperatingDay(sunday, bp, [])).toBe(false);
  });

  it('should return true for CUSTOM_WEEKDAYS on a working weekday', () => {
    const bp: BrandProcessData = {
      ...mockBrandProcess,
      operatingRule: {
        type: 'CUSTOM_WEEKDAYS',
        workingWeekdays: [1, 2, 3, 4, 5], // Mon-Fri
        worksOnHolidays: false,
      },
    };
    const monday = new Date('2026-01-05'); // Monday
    expect(isOperatingDay(monday, bp, [])).toBe(true);
  });
});
