import type { RosterEntryData, ConflictData, GenerationContext } from '../../types.js';

export function checkOverlappingShiftAssignment(
  entries: RosterEntryData[],
  context: GenerationContext
): ConflictData[] {
  const conflicts: ConflictData[] = [];
  const { employees, brandProcesses } = context;

  const workingEntries = entries.filter((e) => e.status === 'WORKING');
  
  for (const employee of employees) {
    const empEntries = workingEntries.filter((e) => e.employeeId === employee.id);
    const entriesByDate = new Map<string, RosterEntryData[]>();

    empEntries.forEach((entry) => {
      const dateKey = entry.date.toISOString().split('T')[0];
      if (!entriesByDate.has(dateKey)) {
        entriesByDate.set(dateKey, []);
      }
      entriesByDate.get(dateKey)!.push(entry);
    });

    for (const [dateKey, dateEntries] of entriesByDate) {
      const brandProcessIds = new Set(
        employee.assignments.map((a) => a.brandProcessId)
      );

      if (dateEntries.length > brandProcessIds.size) {
        const brands = employee.assignments
          .map((a) => {
            const bp = brandProcesses.find((bp) => bp.id === a.brandProcessId);
            return bp?.brandName || 'Unknown';
          })
          .filter((v, i, a) => a.indexOf(v) === i);

        conflicts.push({
          severity: 'WARNING',
          code: 'OVERLAPPING_SHIFT_ASSIGNMENT',
          employeeId: employee.id,
          date: new Date(dateKey),
          message: `${employee.name} has overlapping shifts on ${dateKey} across brands: ${brands.join(', ')}`,
          suggestedActions: [
            {
              type: 'ADJUST_COVERAGE',
              description: 'Review if employee can handle multiple brand assignments same day',
            },
          ],
        });
      }
    }
  }

  return conflicts;
}
