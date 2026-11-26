import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  parseISO,
  isValid,
  getDay,
} from 'date-fns';

export function getMonthDateRange(year: number, month: number) {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(start);
  return { start, end };
}

export function getAllDatesInMonth(year: number, month: number): Date[] {
  const { start, end } = getMonthDateRange(year, month);
  return eachDayOfInterval({ start, end });
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseDate(dateString: string): Date | null {
  try {
    const parsed = parseISO(dateString);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function getWeekday(date: Date): number {
  return getDay(date);
}

export function isSameDate(date1: Date, date2: Date): boolean {
  return formatDate(date1) === formatDate(date2);
}
