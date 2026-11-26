import type { RosterEntryData, ConflictData, GenerationContext } from '../../types.js';

export function checkDuplicateEntries(
  entries: RosterEntryData[],
  _context: GenerationContext
): ConflictData[] {
  const conflicts: ConflictData[] = [];
  const entriesByEmployee = new Map<string, Map<string, RosterEntryData[]>>();

  for (const entry of entries) {
    if (!entriesByEmployee.has(entry.employeeId)) {
      entriesByEmployee.set(entry.employeeId, new Map());
    }
    const employeeEntries = entriesByEmployee.get(entry.employeeId)!;
    const dateKey = entry.date.toISOString().split('T')[0];
    
    if (!employeeEntries.has(dateKey)) {
      employeeEntries.set(dateKey, []);
    }
    employeeEntries.get(dateKey)!.push(entry);
  }

  for (const [employeeId, dateMap] of entriesByEmployee) {
    for (const [dateKey, entriesForDate] of dateMap) {
      if (entriesForDate.length > 1) {
        conflicts.push({
          severity: 'ERROR',
          code: 'DUPLICATE_ENTRY',
          employeeId,
          date: new Date(dateKey),
          message: `Employee has ${entriesForDate.length} entries for ${dateKey}`,
          suggestedActions: [
            {
              type: 'ADJUST_COVERAGE',
              description: 'Remove duplicate entries, keeping the most recent or locked entry',
            },
          ],
        });
      }
    }
  }

  return conflicts;
}
