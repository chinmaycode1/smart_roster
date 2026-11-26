import type { RosterEntryData, ConflictData, GenerationContext } from '../../types.js';

export function checkFixedOffDayViolations(
  entries: RosterEntryData[],
  context: GenerationContext
): ConflictData[] {
  const conflicts: ConflictData[] = [];
  const { employees } = context;

  for (const employee of employees) {
    if (!employee.weeklyOffPattern || !employee.weeklyOffPattern.isFixed) {
      continue;
    }

    const fixedOffDays = employee.weeklyOffPattern.fixedOffDays;
    const empEntries = entries.filter((e) => e.employeeId === employee.id);

    for (const entry of empEntries) {
      const weekday = entry.date.getDay();
      const isFixedOffDay = fixedOffDays.includes(weekday);

      if (isFixedOffDay && entry.status === 'WORKING') {
        conflicts.push({
          severity: 'ERROR',
          code: 'FIXED_OFF_DAY_VIOLATION',
          employeeId: employee.id,
          date: entry.date,
          message: `${employee.name} scheduled to work on ${entry.date.toISOString().split('T')[0]} but has fixed weekly off on ${getDayName(weekday)}`,
          suggestedActions: [
            {
              type: 'ADJUST_COVERAGE',
              description: 'Find alternate employee to cover this day',
              employeeId: employee.id,
              employeeName: employee.name,
              date: entry.date,
              impact: 'Fixed weekly off pattern must be respected',
            },
          ],
        });
      }
    }
  }

  return conflicts;
}

function getDayName(weekday: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[weekday];
}
