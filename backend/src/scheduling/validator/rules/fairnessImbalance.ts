import type { RosterEntryData, ConflictData, GenerationContext } from '../../types.js';

export function checkFairnessImbalance(
  entries: RosterEntryData[],
  context: GenerationContext
): ConflictData[] {
  const conflicts: ConflictData[] = [];
  const { employees, holidays } = context;

  const stats = employees.map((emp) => {
    const empEntries = entries.filter((e) => e.employeeId === emp.id && e.status === 'WORKING');
    const weekendDays = empEntries.filter((e) => [0, 6].includes(e.date.getDay())).length;
    const holidayDays = empEntries.filter((e) =>
      holidays.some((h) => h.date.toDateString() === e.date.toDateString())
    ).length;
    return { emp, weekendDays, holidayDays };
  });

  const avgWeekend = stats.reduce((sum, s) => sum + s.weekendDays, 0) / stats.length;
  const avgHoliday = stats.reduce((sum, s) => sum + s.holidayDays, 0) / stats.length;

  for (const stat of stats) {
    const weekendDeviation = Math.abs(stat.weekendDays - avgWeekend);
    const holidayDeviation = Math.abs(stat.holidayDays - avgHoliday);

    if (weekendDeviation > 2 || holidayDeviation > 1) {
      conflicts.push({
        severity: 'WARNING',
        code: 'FAIRNESS_IMBALANCE',
        employeeId: stat.emp.id,
        message: `${stat.emp.name} has ${stat.weekendDays} weekend days (avg ${avgWeekend.toFixed(1)}) and ${stat.holidayDays} holiday days (avg ${avgHoliday.toFixed(1)})`,
        suggestedActions: [
          {
            type: 'ADJUST_COVERAGE',
            description: 'Rebalance weekend and holiday distribution next month',
          },
        ],
      });
    }
  }

  return conflicts;
}
