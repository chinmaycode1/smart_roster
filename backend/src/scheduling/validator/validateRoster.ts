import type { RosterEntryData, ConflictData, GenerationContext } from '../types.js';

export function validateRoster(
  entries: RosterEntryData[],
  _context: GenerationContext
): ConflictData[] {
  const conflicts: ConflictData[] = [];

  // Basic validation placeholder - full rules would be in separate files
  // For MVP, just check for basic data integrity

  const entriesByEmployee = groupBy(entries, (e) => e.employeeId);

  for (const [employeeId, empEntries] of Object.entries(entriesByEmployee)) {
    // Check for duplicate entries
    const dateKeys = empEntries.map((e) => e.date.toISOString().split('T')[0]);
    const unique = new Set(dateKeys);
    if (dateKeys.length !== unique.size) {
      conflicts.push({
        severity: 'ERROR',
        code: 'DUPLICATE_ENTRY',
        employeeId,
        message: `Employee has duplicate entries for the same date`,
        suggestedActions: [],
      });
    }
  }

  return conflicts;
}

function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce(
    (acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}
