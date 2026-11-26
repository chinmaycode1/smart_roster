import type { RosterEntryData, ConflictData, GenerationContext } from '../types.js';
import {
  checkDuplicateEntries,
  checkInsufficientCoverage,
  checkWeeklyOffViolations,
  checkLeaveClashes,
  checkSoleOwnerUnavailable,
  checkFixedOffDayViolations,
  checkOverlappingShifts,
} from './rules/index.js';

export function validateRoster(
  entries: RosterEntryData[],
  context: GenerationContext
): ConflictData[] {
  const allConflicts: ConflictData[] = [];

  const rules = [
    checkDuplicateEntries,
    checkLeaveClashes,
    checkFixedOffDayViolations,
    checkWeeklyOffViolations,
    checkSoleOwnerUnavailable,
    checkInsufficientCoverage,
    checkOverlappingShifts,
  ];

  for (const rule of rules) {
    const conflicts = rule(entries, context);
    allConflicts.push(...conflicts);
  }

  return deduplicateConflicts(allConflicts);
}

function deduplicateConflicts(conflicts: ConflictData[]): ConflictData[] {
  const seen = new Set<string>();
  const unique: ConflictData[] = [];

  for (const conflict of conflicts) {
    const key = `${conflict.code}_${conflict.employeeId || ''}_${conflict.brandProcessId || ''}_${conflict.date?.toISOString().split('T')[0] || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(conflict);
    }
  }

  return unique;
}
