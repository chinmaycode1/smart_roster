import type { RosterEntryData, ConflictData, GenerationContext } from '../../types.js';

export function checkOverlappingShifts(
  entries: RosterEntryData[],
  _context: GenerationContext
): ConflictData[] {
  const conflicts: ConflictData[] = [];

  const workingEntries = entries.filter((e) => e.status === 'WORKING');
  const entriesByEmployeeDate = new Map<string, RosterEntryData[]>();

  for (const entry of workingEntries) {
    const key = `${entry.employeeId}_${entry.date.toISOString().split('T')[0]}`;
    if (!entriesByEmployeeDate.has(key)) {
      entriesByEmployeeDate.set(key, []);
    }
    entriesByEmployeeDate.get(key)!.push(entry);
  }

  for (const [key, entries] of entriesByEmployeeDate) {
    if (entries.length > 1) {
      const [employeeId, dateKey] = key.split('_');
      conflicts.push({
        severity: 'WARNING',
        code: 'OVERLAPPING_SHIFTS',
        employeeId,
        date: new Date(dateKey),
        message: `Employee has ${entries.length} working entries on ${dateKey}. May indicate multi-brand assignment.`,
        suggestedActions: [
          {
            type: 'ADJUST_COVERAGE',
            description: 'Verify if employee can handle multiple brand assignments on same day',
          },
        ],
      });
    }
  }

  return conflicts;
}
