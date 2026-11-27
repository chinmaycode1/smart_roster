import type { RosterEntryData, ConflictData, GenerationContext } from '../../types.js';

export function checkPreferenceViolated(
  entries: RosterEntryData[],
  context: GenerationContext
): ConflictData[] {
  const conflicts: ConflictData[] = [];
  const { employees } = context;

  for (const employee of employees) {
    if (!employee.weeklyOffPattern || employee.weeklyOffPattern.preferredOffDays.length === 0) {
      continue;
    }

    const empEntries = entries.filter(
      (e) => e.employeeId === employee.id && e.status === 'WORKING'
    );

    const preferredDays = employee.weeklyOffPattern.preferredOffDays;
    const violatedDates = empEntries.filter((e) => preferredDays.includes(e.date.getDay()));

    if (violatedDates.length > 0) {
      conflicts.push({
        severity: 'WARNING',
        code: 'PREFERENCE_VIOLATED',
        employeeId: employee.id,
        message: `${employee.name} working on ${violatedDates.length} preferred off day(s)`,
        suggestedActions: [
          {
            type: 'MOVE_WEEKLY_OFF',
            description: `Try to honor preferred off days where coverage allows`,
            employeeId: employee.id,
            employeeName: employee.name,
          },
        ],
      });
    }
  }

  return conflicts;
}
