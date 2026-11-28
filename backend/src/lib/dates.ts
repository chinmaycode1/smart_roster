import { parseISO, isValid } from 'date-fns';

export function getMonthDateRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = new Date(Date.UTC(year, month - 1, daysInMonth, 23, 59, 59, 999));
  return { start, end };
}

export function getAllDatesInMonth(year: number, month: number): Date[] {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const dates: Date[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    dates.push(new Date(Date.UTC(year, month - 1, day)));
  }
  return dates;
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
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
  return date.getUTCDay();
}

export function isSameDate(date1: Date, date2: Date): boolean {
  return formatDate(date1) === formatDate(date2);
}
