import { getWeekday } from '../../lib/dates.js';
import type { BrandProcessData, PublicHolidayData } from '../types.js';

export function isOperatingDay(
  date: Date,
  brandProcess: BrandProcessData,
  holidays: PublicHolidayData[]
): boolean {
  const weekday = getWeekday(date);
  const rule = brandProcess.operatingRule;
  const isHoliday = holidays.some(
    (h) => h.date.toDateString() === date.toDateString()
  );

  switch (rule.type) {
    case 'ALL_365':
      return true;

    case 'DAILY_EXCEPT_HOLIDAYS':
      return !isHoliday;

    case 'EXCEPT_SUNDAYS_AND_HOLIDAYS':
      if (weekday === 0) return false;
      return !isHoliday;

    case 'CUSTOM_WEEKDAYS':
      if (!rule.workingWeekdays.includes(weekday)) return false;
      if (!rule.worksOnHolidays && isHoliday) return false;
      return true;

    default:
      return true;
  }
}

export function getOperatingDates(
  dates: Date[],
  brandProcess: BrandProcessData,
  holidays: PublicHolidayData[]
): Date[] {
  return dates.filter((date) => isOperatingDay(date, brandProcess, holidays));
}
