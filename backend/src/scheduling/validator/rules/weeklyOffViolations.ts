import type { RosterEntryData, ConflictData, GenerationContext } from '../../types.js';
import { getAllDatesInMonth } from '../../../lib/dates.js';

export function checkWeeklyOffViolations(
  entries: RosterEntryData[],
  context: GenerationContext
): ConflictData[] {
  const conflicts: ConflictData[] = [];
  const { month, year, employees } = context;
  const dates = getAllDatesInMonth(year, month);

  for (const employee of employees) {
    const empEntries = entries
      .filter((e) => e.employeeId === employee.id)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const weeks = groupDatesByWeek(dates);

    for (const week of weeks) {
      const weekEntries = empEntries.filter((e) =>
        week.some((d) => d.toDateString() === e.date.toDateString())
      );

      const offDays = weekEntries.filter(
        (e) => e.status === 'WEEKLY_OFF' || e.status === 'LEAVE' || e.status === 'COMP_OFF'
      );

      if (offDays.length === 0 && weekEntries.length >= 7) {
        const weekStart = week[0];
        conflicts.push({
          severity: 'ERROR',
          code: 'NO_WEEKLY_OFF',
          employeeId: employee.id,
          date: weekStart,
          message: `${employee.name} has no weekly off in week starting ${weekStart.toISOString().split('T')[0]}`,
          suggestedActions: [
            {
              type: 'MOVE_WEEKLY_OFF',
              description: 'Add a weekly off on the least critical day this week',
              employeeId: employee.id,
              employeeName: employee.name,
              date: weekStart,
            },
          ],
        });
      }
    }

    let consecutiveWorkDays = 0;
    for (const entry of empEntries) {
      if (entry.status === 'WORKING') {
        consecutiveWorkDays++;
        if (consecutiveWorkDays > employee.maxConsecutiveWorkDays) {
          conflicts.push({
            severity: 'ERROR',
            code: 'MAX_CONSECUTIVE_DAYS_EXCEEDED',
            employeeId: employee.id,
            date: entry.date,
            message: `${employee.name} worked ${consecutiveWorkDays} consecutive days (max: ${employee.maxConsecutiveWorkDays})`,
            suggestedActions: [
              {
                type: 'MOVE_WEEKLY_OFF',
                description: `Add a rest day after ${employee.maxConsecutiveWorkDays} consecutive working days`,
                employeeId: employee.id,
                employeeName: employee.name,
                date: entry.date,
              },
            ],
          });
        }
      } else if (
        entry.status === 'WEEKLY_OFF' ||
        entry.status === 'LEAVE' ||
        entry.status === 'COMP_OFF'
      ) {
        consecutiveWorkDays = 0;
      }
    }
  }

  return conflicts;
}

function groupDatesByWeek(dates: Date[]): Date[][] {
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  let lastMonday: Date | null = null;

  for (const date of dates) {
    const dayOfWeek = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    if (lastMonday && monday.getTime() !== lastMonday.getTime()) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    currentWeek.push(date);
    lastMonday = monday;
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}
